/**
 * The budget spreadsheet does not have dedicate line items for every tactic.
 * This creates a centralized mapping from tactic keys, budget categories, and field prefixes
 * 
 * Two functions depend on this mapping:
 *      - analyzeTactic()
 *      - analyzeGaps()
 */
const TACTIC_BUDGET_MAP = {
  'DOOR':         { category: 'canvass',      budgetPrefix: 'canvass' },
  'OPEN':         { category: 'open',         budgetPrefix: 'canvass' },
  'PHONE':        { category: 'phone',        budgetPrefix: 'phone' },
  'TEXT':         { category: 'text',         budgetPrefix: 'text' },
  'REGISTRATION': { category: 'registration', budgetPrefix: 'canvass' },
  'RELATIONAL':   { category: 'relational',   budgetPrefix: 'canvass' },
  'MAIL':         { category: 'mail',         budgetPrefix: 'postage' }
};

// Cost per attempt targets with standard deviations
// scriptProps is declared in field_trigger_functions.js
function getTacticTargets() {
  return {
  DOOR: { 
    target: parseFloat(scriptProps.getProperty('COST_TARGET_DOOR') || '1.00'), 
    stdDev: parseFloat(scriptProps.getProperty('COST_TARGET_DOOR_STDDEV') || '0.20') 
  },
  PHONE: { 
    target: parseFloat(scriptProps.getProperty('COST_TARGET_PHONE') || '0.66'), 
    stdDev: parseFloat(scriptProps.getProperty('COST_TARGET_PHONE_STDDEV') || '0.15') 
  },
  TEXT: { 
    target: parseFloat(scriptProps.getProperty('COST_TARGET_TEXT') || '0.02'), 
    stdDev: parseFloat(scriptProps.getProperty('COST_TARGET_TEXT_STDDEV') || '0.01') 
  },
  OPEN: { 
    target: parseFloat(scriptProps.getProperty('COST_TARGET_OPEN') || '0.40'), 
    stdDev: parseFloat(scriptProps.getProperty('COST_TARGET_OPEN_STDDEV') || '0.10') 
  }
  };
}

// Note: EMAIL_CONFIG and getEmailRecipients are defined in field_trigger_functions.js

// Create time-based trigger for budget analysis
function createBudgetAnalysisTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  const triggerExists = triggers.some(trigger => 
    trigger.getHandlerFunction() === 'analyzeBudgets' && 
    trigger.getEventType() === ScriptApp.EventType.CLOCK
  );
  
  if (!triggerExists) {
    const triggerHours = parseInt(scriptProps.getProperty('TRIGGER_BUDGET_ANALYSIS_HOURS') || '12');
    ScriptApp.newTrigger('analyzeBudgets')
      .timeBased()
      .everyHours(triggerHours)
      .create();
    Logger.log('Budget analysis trigger created to run every 12 hours');
  } else {
    Logger.log('Budget analysis trigger already exists');
  }
}

// Main function to analyze budgets
function analyzeBudgets() {
  try {
    Logger.log('Starting budget analysis...');
    
    // Get all unanalyzed budgets
    const unanalyzedBudgets = FieldBudget.getUnanalyzedBudgets();
    Logger.log(`Found ${unanalyzedBudgets.length} unanalyzed budgets`);
    
    // Process each unanalyzed budget
    for (const budgetData of unanalyzedBudgets) {
      try {
        // Clear any missing budget tracking for this organization
        onBudgetSubmission(budgetData.budget);
        
        processBudget(budgetData);
      } catch (error) {
        Logger.log(`Error processing budget for ${budgetData.budget.memberOrgName}: ${error.message}`);
        sendErrorNotification(budgetData.budget, error);
      }
    }
    
    // Check for budgets waiting too long for field plans
    checkForMissingFieldPlans();
    
  } catch (error) {
    Logger.log(`Critical error in analyzeBudgets: ${error.message}`);
  }
}

// Process a single budget
function processBudget(budgetData, isTestMode = false) {
  const { budget, rowNumber } = budgetData;
  
  // Check if field plan exists
  const fieldPlanMatch = findMatchingFieldPlan(budget.memberOrgName);
  
  if (!fieldPlanMatch) {
    // Track when first checked
    trackMissingFieldPlan(budget, rowNumber);
    Logger.log(`No field plan found for ${budget.memberOrgName}`);
    return;
  }
  
  Logger.log(`Found field plan for ${budget.memberOrgName}, analyzing...`);
  
  // Verify fieldPlanMatch has the expected structure
  if (!fieldPlanMatch.fieldPlan) {
    Logger.log(`Error: fieldPlanMatch.fieldPlan is undefined for ${budget.memberOrgName}`);
    return;
  }
  
  // Perform analysis
  const analysis = analyzeBudgetWithFieldPlan(budget, fieldPlanMatch);
  
  // Send email with analysis
  sendBudgetAnalysisEmail(budget, fieldPlanMatch.fieldPlan, analysis, isTestMode);
  
  // Mark as analyzed (only in production mode to avoid marking test runs)
  if (!isTestMode) {
    budget.markAsAnalyzed(rowNumber);
  }
  
  Logger.log(`Analysis completed for ${budget.memberOrgName}`);
}

// Find matching field plan for organization
function findMatchingFieldPlan(orgName) {
  const sheetName = scriptProps.getProperty('SHEET_FIELD_PLAN');
  const planSheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  const data = planSheet.getDataRange().getValues();
  
  let latestMatch = null;
  let latestRow = -1;
  
  // Find the most recent field plan for this org
  for (let i = 1; i < data.length; i++) {
    if (data[i][FIELD_PLAN_COLUMNS.MEMBERNAME] === orgName) {
      if (!latestMatch || i > latestRow) {
        latestMatch = new FieldPlan(data[i]);
        latestRow = i + 1;
      }
    }
  }
  
  return latestMatch ? { fieldPlan: latestMatch, rowNumber: latestRow } : null;
}

// Analyze budget with field plan data
function analyzeBudgetWithFieldPlan(budget, fieldPlanMatch) {
  const { fieldPlan } = fieldPlanMatch;
  const planSheetName = scriptProps.getProperty('SHEET_FIELD_PLAN');
  const planSheet = SpreadsheetApp.getActive().getSheetByName(planSheetName);
  const rowData = planSheet.getRange(fieldPlanMatch.rowNumber, 1, 1, planSheet.getLastColumn()).getValues()[0];
  
  const analysis = {
    tactics: [],
    recommendations: [],
    gaps: [],
    summary: {}
  };
  
  // Get tactic instances from field plan
  const tactics = getTacticInstances(rowData);
  
  // Analyze each tactic
  for (const tactic of tactics) {
    const tacticAnalysis = analyzeTactic(budget, tactic);
    if (tacticAnalysis) {
      analysis.tactics.push(tacticAnalysis);
    }
  }
  
  // Analyze gaps and opportunities
  analysis.gaps = analyzeGaps(budget, tactics);
  
  // Generate summary
  analysis.summary = {
    notOutreach: budget.sumNotOutreach(),
    outreach: budget.sumOutreach(),
    dataStipend: budget.needDataStipend(),
    requestSummary: budget.requestSummary()
  };
  
  return analysis;
}

// Analyze a single tactic
function analyzeTactic(budget, tactic) {
  //NEW use of tacticKey property instead of instanceof
  const tacticType = tactic.tacticKey;

  const budgetMapping = TACTIC_BUDGET_MAP[tacticType];
  if (!budgetMapping) {
    Logger.log(`No budget mapping for tactic type: ${tacticType}`);
    return null;
  }

  const budgetField = `${budgetMapping.budgetPrefix}Requested`;
  const fundingRequested = parseFloat(budget[budgetField]) || 0;
  
  const programAttempts = tactic.programAttempts();
  const costPerAttempt = programAttempts > 0 ? fundingRequested / programAttempts : Infinity;
  
  const target = getTacticTargets()[tacticType];
  const lowerBound = target.target - target.stdDev;
  const upperBound = target.target + target.stdDev;
  
  const status = costPerAttempt <= lowerBound ? 'below' :
                 costPerAttempt >= upperBound ? 'above' : 'within';
  
  return {
    tacticType: tacticType,
    tacticName: tactic._name,
    fundingRequested: fundingRequested,
    programAttempts: programAttempts,
    costPerAttempt: costPerAttempt,
    targetCost: target.target,
    lowerBound: lowerBound,
    upperBound: upperBound,
    status: status,
    recommendation: generateTacticRecommendation(tacticType, costPerAttempt, target, status)
  };
}

// Generate recommendation for a tactic
function generateTacticRecommendation(tacticType, costPerAttempt, target, status) {
  if (status === 'within') {
    return `${tacticType} funding is appropriately aligned with planned activities.`;
  } else if (status === 'below') {
    return `${tacticType} funding is below the standard range for this tactic.`;
  } else {
    return `${tacticType} funding exceeds the standard range. Review if the funding request aligns with realistic program expectations.`;
  }
}

/**
 * Analyzes budget gaps across all 7 tactic categories from TACTIC_CONFIG.
 * 
 * Maps each tactic category to its corresponding budget field prefix.
 * Some categories share budget columns because the budget spreadsheet
 * does not have dedicated line items for every tactic type:
 *    - canvass, open, registration, relational -> 'canvass' budget prefix
 *    - phone -> 'phone' budget prefix
 *    - text -> 'text' budget prefix
 *    - mail -> 'postage' budget prefix
 * 
 * @param {FieldBudget} budget - The budget object with column accessors
 * @param {Array} tactics - Array of TacticProgram instances
 * @returns {Array<Object>} Array of gap analysis results per category
 */
function analyzeGaps(budget, tactics) {
  const seen = new Set();
  const categoryMappings = []
  Object.values(TACTIC_BUDGET_MAP).forEach(({ category, budgetPrefix }) => {
    if (!seen.has(category)) {
      seen.add(category);
      categoryMappings.push({ category, budgetPrefix });
    }
  });

  const results = [];

  categoryMappings.forEach(({ category, budgetPrefix }) => {
    const requestedKey = `${budgetPrefix}Requested`;
    const gapKey = `${budgetPrefix}Gap`;

    const requested = budget[requestedKey] || 0;
    const gap = budget[gapKey] || 0;

    if (gap > 0) {
      results.push({
        category: category,
        budgetPrefix: budgetPrefix,
        requested: requested,
        gap: gap
      });
    }
  });
  return results;
}

// Send budget analysis email
function sendBudgetAnalysisEmail(budget, fieldPlan, analysis, isTestMode = false) {
  // Defensive check for fieldPlan
  if (!fieldPlan) {
    Logger.log('Error in sendBudgetAnalysisEmail: fieldPlan is null or undefined');
    throw new Error('Cannot send budget analysis email without field plan data');
  }
  
  let emailBody = `
    <h2>Budget Analysis for ${budget.memberOrgName}</h2>
    
    <h3>Summary</h3>
    <p>${analysis.summary.requestSummary}</p>
    <p>${analysis.summary.notOutreach}</p>
    <p>${analysis.summary.outreach}</p>
    <p>${analysis.summary.dataStipend}</p>
    
    <h3>Tactic Cost Analysis</h3>`;
  
  // Add tactic analysis
  for (const tactic of analysis.tactics) {
    emailBody += `
      <h4>${tactic.tacticName}</h4>
      <ul>
        <li>Funding Requested: $${(parseFloat(tactic.fundingRequested) || 0).toFixed(2)}</li>
        <li>Program Attempts: ${tactic.programAttempts}</li>
        <li>Cost Per Attempt: $${(parseFloat(tactic.costPerAttempt) || 0).toFixed(2)}</li>
        <li>Target Range: $${(parseFloat(tactic.lowerBound) || 0).toFixed(2)} - $${(parseFloat(tactic.upperBound) || 0).toFixed(2)}</li>
        <li>Status: ${tactic.status} target range</li>
      </ul>
      <p><strong>Recommendation:</strong> ${tactic.recommendation}</p>`;
  }
  
  // Add gap analysis as a table
  if (analysis.gaps.length > 0) {
    emailBody += `
      <h3>Funding Gap Analysis</h3>
      <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th>Tactic</th>
            <th>Gap Amount</th>
          </tr>
        </thead>
        <tbody>`;

    for (const gap of analysis.gaps) {
      const tacticName = gap.category.charAt(0).toUpperCase() + gap.category.slice(1);

      emailBody += `
          <tr>
            <td><strong>${tacticName}</strong></td>
            <td>$${gap.gap}</td>
          </tr>`;
    }
    
    emailBody += `
        </tbody>
      </table>`;
  }
  
  // Add field plan connection
  emailBody += `
    <h3>Field Plan Details</h3>
    <p>This analysis is based on the field plan submitted on ${fieldPlan.submissionDateTime || 'Unknown date'}</p>`;
  
  // Add test mode indicator to email if in test mode
  if (isTestMode) {
    emailBody = `<div style="background-color: #ffffcc; padding: 10px; border: 2px solid #ffcc00; margin-bottom: 20px;">
      <strong>🧪 TEST MODE EMAIL</strong> - This is a test email sent only to datateam@alforward.org
    </div>` + emailBody;
  }

  // Send email
  try {
    const recipients = getEmailRecipients(isTestMode);
    MailApp.sendEmail({
      to: recipients.join(','),
      subject: `${isTestMode ? '[TEST] ' : ''}Budget Analysis: ${budget.memberOrgName}`,
      htmlBody: emailBody,
      name: "Budget Analysis System",
      replyTo: scriptProps.getProperty('EMAIL_REPLY_TO') || 'datateam@alforward.org'
    });
    Logger.log(`Budget analysis email sent for ${budget.memberOrgName} (${isTestMode ? 'TEST MODE' : 'PRODUCTION'})`);
  } catch (error) {
    Logger.log(`Error sending email for ${budget.memberOrgName}: ${error.message}`);
    throw error;
  }
}

// Track budgets missing field plans
function trackMissingFieldPlan(budget, rowNumber) {
  const properties = PropertiesService.getScriptProperties();
  const key = `MISSING_PLAN_${budget.memberOrgName}`;
  const existingTimestamp = properties.getProperty(key);
  
  if (!existingTimestamp) {
    // First time checking - record timestamp
    properties.setProperty(key, new Date().toISOString());
    Logger.log(`Started tracking missing field plan for ${budget.memberOrgName}`);
  }
}

// Check for budgets waiting too long for field plans
function checkForMissingFieldPlans() {
  const properties = PropertiesService.getScriptProperties();
  const allProperties = properties.getProperties();
  const currentTime = new Date();
  const thresholdHours = parseInt(scriptProps.getProperty('TRIGGER_MISSING_PLAN_THRESHOLD_HOURS') || '72');
  const thresholdMilliseconds = thresholdHours * 60 * 60 * 1000; // Convert to milliseconds
  
  for (const key in allProperties) {
    if (key.startsWith('MISSING_PLAN_')) {
      const orgName = key.replace('MISSING_PLAN_', '');
      const timestamp = new Date(allProperties[key]);
      
      if (currentTime - timestamp > thresholdMilliseconds) {
        // Send notification about missing field plan
        sendMissingFieldPlanNotification(orgName);
        
        // Remove the tracking property
        properties.deleteProperty(key);
      }
    }
  }
}

// Send notification for missing field plan
function sendMissingFieldPlanNotification(orgName, isTestMode = false) {
  const emailBody = `
    <h2>Missing Field Plan Alert</h2>
    <p><strong>Organization:</strong> ${orgName}</p>
    <p>This organization submitted a budget more than 72 hours ago but has not yet submitted a field plan.</p>
    <p>The budget analysis cannot be completed without a corresponding field plan.</p>
    <p>Please follow up with the organization to request their field plan submission.</p>
  `;
  
  try {
    const recipients = getEmailRecipients(isTestMode);
    MailApp.sendEmail({
      to: recipients.join(','),
      subject: `${isTestMode ? '[TEST] ' : ''}Missing Field Plan: ${orgName}`,
      htmlBody: isTestMode ? `<div style="background-color: #ffffcc; padding: 10px; border: 2px solid #ffcc00; margin-bottom: 20px;">
        <strong>🧪 TEST MODE EMAIL</strong> - This is a test email sent only to datateam@alforward.org
      </div>` + emailBody : emailBody,
      name: "Budget Analysis System",
      replyTo: scriptProps.getProperty('EMAIL_REPLY_TO') || 'datateam@alforward.org'
    });
    Logger.log(`Missing field plan notification sent for ${orgName} (${isTestMode ? 'TEST MODE' : 'PRODUCTION'})`);
  } catch (error) {
    Logger.log(`Error sending missing field plan notification: ${error.message}`);
  }
}

// Send error notification
function sendErrorNotification(budget, error, isTestMode = false) {
  const emailBody = `
    <h2>Budget Analysis Error</h2>
    <p><strong>Organization:</strong> ${budget.memberOrgName}</p>
    <p><strong>Error:</strong> ${error.message}</p>
    <p>The budget analysis encountered an error and could not be completed.</p>
    <p>Please check the Apps Script logs for more details.</p>
  `;
  
  try {
    const recipients = getEmailRecipients(isTestMode);
    MailApp.sendEmail({
      to: recipients.join(','),
      subject: `${isTestMode ? '[TEST] ' : ''}Budget Analysis Error: ${budget.memberOrgName}`,
      htmlBody: isTestMode ? `<div style="background-color: #ffffcc; padding: 10px; border: 2px solid #ffcc00; margin-bottom: 20px;">
        <strong>🧪 TEST MODE EMAIL</strong> - This is a test email sent only to datateam@alforward.org
      </div>` + emailBody : emailBody,
      name: "Budget Analysis System",
      replyTo: scriptProps.getProperty('EMAIL_REPLY_TO') || 'datateam@alforward.org'
    });
    Logger.log(`Error notification sent for ${budget.memberOrgName} (${isTestMode ? 'TEST MODE' : 'PRODUCTION'})`);
  } catch (emailError) {
    Logger.log(`Failed to send error notification: ${emailError.message}`);
  }
}

// Function to process ALL budgets regardless of analysis status
function processAllBudgets(isTestMode = false) {
  try {
    Logger.log(`=== PROCESSING ALL BUDGETS (${isTestMode ? 'TEST MODE' : 'PRODUCTION'}) ===`);
    
    const sheetName = scriptProps.getProperty('SHEET_FIELD_BUDGET');
    const budgetSheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
    const data = budgetSheet.getDataRange().getValues();
    
    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;
    
    // Process ALL budget rows (starting from row 2 to skip header)
    for (let i = 1; i < data.length; i++) {
      const rowNumber = i + 1;
      
      try {
        if (data[i][FieldBudget.COLUMNS.MEMBERNAME]) {
          const budget = new FieldBudget(data[i]);
          const budgetData = { budget: budget, rowNumber: rowNumber };
          
          // Check if field plan exists
          const fieldPlanMatch = findMatchingFieldPlan(budget.memberOrgName);
          
          if (!fieldPlanMatch) {
            Logger.log(`Skipping ${budget.memberOrgName} - no field plan found`);
            skippedCount++;
            continue;
          }
          
          Logger.log(`Processing budget for ${budget.memberOrgName} (row ${rowNumber})`);
          processBudget(budgetData, isTestMode);
          successCount++;
        }
      } catch (error) {
        Logger.log(`Error processing budget row ${rowNumber}: ${error.message}`);
        errorCount++;
      }
    }
    
    Logger.log(`=== BUDGET PROCESSING COMPLETE ===`);
    Logger.log(`Successfully processed: ${successCount} budgets`);
    Logger.log(`Skipped (no field plan): ${skippedCount}`);
    Logger.log(`Errors encountered: ${errorCount}`);
    
    return { success: successCount, skipped: skippedCount, errors: errorCount };
    
  } catch (error) {
    Logger.log(`Critical error in processAllBudgets: ${error.message}`);
    throw error;
  }
}

// Manually analyze a specific organization
function analyzeSpecificOrganization(orgName, isTestMode = true) {
  Logger.log(`Manual analysis requested for ${orgName} (${isTestMode ? 'TEST MODE' : 'PRODUCTION'})`);
  
  // Find the budget for this org
  const sheetName = scriptProps.getProperty('SHEET_FIELD_BUDGET');
  const budgetSheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  const data = budgetSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][FieldBudget.COLUMNS.MEMBERNAME] === orgName) {
      const budget = new FieldBudget(data[i]);
      const budgetData = { budget: budget, rowNumber: i + 1 };
      
      try {
        processBudget(budgetData, isTestMode);
        Logger.log(`Manual analysis completed for ${orgName}`);
        return;
      } catch (error) {
        Logger.log(`Error in manual analysis: ${error.message}`);
        sendErrorNotification(budget, error, isTestMode);
        return;
      }
    }
  }
  
  Logger.log(`No budget found for organization: ${orgName}`);
}

// Convenience function to reprocess ALL field plans and budgets
function reprocessAllAnalyses(isTestMode = false) {
  try {
    Logger.log(`=== REPROCESSING ALL ANALYSES (${isTestMode ? 'TEST MODE' : 'PRODUCTION'}) ===`);
    Logger.log(`Starting at: ${new Date().toString()}`);
    
    // First, process all field plans
    Logger.log('\n--- Phase 1: Processing Field Plans ---');
    const fieldPlanResults = processAllFieldPlans(isTestMode);
    
    // Then, process all budgets
    Logger.log('\n--- Phase 2: Processing Budgets ---');
    const budgetResults = processAllBudgets(isTestMode);
    
    // Summary
    Logger.log('\n=== REPROCESSING COMPLETE ===');
    Logger.log(`Field Plans - Success: ${fieldPlanResults.success}, Errors: ${fieldPlanResults.errors}`);
    Logger.log(`Budgets - Success: ${budgetResults.success}, Skipped: ${budgetResults.skipped}, Errors: ${budgetResults.errors}`);
    Logger.log(`Completed at: ${new Date().toString()}`);
    
    return {
      fieldPlans: fieldPlanResults,
      budgets: budgetResults
    };
    
  } catch (error) {
    Logger.log(`Critical error in reprocessAllAnalyses: ${error.message}`);
    throw error;
  }
}
 


// Wrapper function for the weekly summary trigger
// This ensures the function is called with the correct parameters
// Passes empty object to catch 
function runWeeklySummaryTrigger(e) {
  Logger.log('Weekly summary trigger fired');
  generateWeeklySummary(false); // Explicitly pass false for production mode
}

// Create weekly summary trigger
function createWeeklySummaryTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  const triggerExists = triggers.some(trigger => 
    trigger.getHandlerFunction() === 'runWeeklySummaryTrigger' && 
    trigger.getEventType() === ScriptApp.EventType.CLOCK
  );
  
  if (!triggerExists) {
    const weekDay = scriptProps.getProperty('TRIGGER_WEEKLY_SUMMARY_DAY') || 'MONDAY';
    const hour = parseInt(scriptProps.getProperty('TRIGGER_WEEKLY_SUMMARY_HOUR') || '9');
    
    ScriptApp.newTrigger('runWeeklySummaryTrigger')
      .timeBased()
      .onWeekDay(ScriptApp.WeekDay[weekDay])
      .atHour(hour)
      .create();
    Logger.log(`Weekly summary trigger created for ${weekDay} at ${hour}:00`);
  } else {
    Logger.log('Weekly summary trigger already exists');
  }
}

// Function to be called when a field plan is submitted
function onFieldPlanSubmission(fieldPlan) {
  Logger.log(`Field plan submitted for ${fieldPlan.memberOrgName}, checking for matching budget...`);
  
  // Check if there's a matching unanalyzed budget
  const unanalyzedBudgets = FieldBudget.getUnanalyzedBudgets();
  const matchingBudget = unanalyzedBudgets.find(b => b.budget.memberOrgName === fieldPlan.memberOrgName);
  
  if (matchingBudget) {
    Logger.log(`Found matching unanalyzed budget for ${fieldPlan.memberOrgName}, triggering analysis...`);
    try {
      processBudget(matchingBudget);
    } catch (error) {
      Logger.log(`Error processing triggered budget analysis: ${error.message}`);
      sendErrorNotification(matchingBudget.budget, error);
    }
  }
  
  // Remove from missing field plan tracking if exists
  const properties = PropertiesService.getScriptProperties();
  const key = `MISSING_PLAN_${fieldPlan.memberOrgName}`;
  if (properties.getProperty(key)) {
    properties.deleteProperty(key);
    Logger.log(`Removed missing field plan tracking for ${fieldPlan.memberOrgName}`);
  }
}

// Function to be called when a budget is submitted
function onBudgetSubmission(budget) {
  Logger.log(`Budget submitted for ${budget.memberOrgName}, removing from missing budget tracking...`);
  
  // Remove from missing budget tracking if exists
  const properties = PropertiesService.getScriptProperties();
  const key = `MISSING_BUDGET_${budget.memberOrgName}`;
  if (properties.getProperty(key)) {
    properties.deleteProperty(key);
    Logger.log(`Removed missing budget tracking for ${budget.memberOrgName}`);
  }
}