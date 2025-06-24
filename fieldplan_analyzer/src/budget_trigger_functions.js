// Note: PROGRAM_COLUMNS is defined in field_program_extension_class.js
// It's available globally since all Apps Script files share the same scope

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
  const sheetName = scriptProps.getProperty('SHEET_FIELD_PLAN') || '2025_field_plan';
  const planSheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  const data = planSheet.getDataRange().getValues();
  
  let latestMatch = null;
  let latestRow = -1;
  
  // Find the most recent field plan for this org
  for (let i = 1; i < data.length; i++) {
    if (data[i][FieldPlan.COLUMNS.MEMBERNAME] === orgName) {
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
  const planSheet = SpreadsheetApp.getActive().getSheetByName('2025_field_plan');
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
  let tacticType, budgetField, fundingRequested;
  
  // Map tactic to budget field and type
  if (tactic instanceof DoorTactic) {
    tacticType = 'DOOR';
    budgetField = 'canvassRequested';
    fundingRequested = parseFloat(budget.canvassRequested) || 0;
  } else if (tactic instanceof PhoneTactic) {
    tacticType = 'PHONE';
    budgetField = 'phoneRequested';
    fundingRequested = parseFloat(budget.phoneRequested) || 0;
  } else if (tactic instanceof TextTactic) {
    tacticType = 'TEXT';
    budgetField = 'textRequested';
    fundingRequested = parseFloat(budget.textRequested) || 0;
  } else if (tactic instanceof OpenTactic) {
    tacticType = 'OPEN';
    budgetField = 'canvassRequested';
    fundingRequested = parseFloat(budget.canvassRequested) || 0;
  } else {
    return null;
  }
  
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
    return `${tacticType} funding is below the standard range. Consider increasing funding to better support planned activities.`;
  } else {
    return `${tacticType} funding exceeds the standard range. Review if the funding request aligns with realistic program expectations.`;
  }
}

// Analyze gaps and opportunities
function analyzeGaps(budget, tactics) {
  const gaps = [];
  
  // Only include tactic-related categories for recommendations
  const tacticCategories = ['canvass', 'phone', 'text', 'open'];
  
  // Check each tactic category for gaps
  for (const category of tacticCategories) {
    const requested = budget[category + 'Requested'] || 0;
    const rawGap = budget[category + 'Gap'] || 0;
    
    // Convert negative gaps to positive values
    const gap = Math.abs(rawGap);
    
    if (gap > 0) {
      // Check if we can recommend increased funding
      const canIncrease = checkIfCanIncreaseFunding(category, requested, gap, tactics);
      gaps.push({
        category: category,
        requested: requested,
        gap: gap,
        originalGap: rawGap,
        canIncrease: canIncrease,
        recommendation: canIncrease ? 
          `Consider increasing ${category} funding by up to $${gap} while maintaining cost efficiency.` +
          (rawGap < 0 ? ' (Note: Original gap was negative, converted to positive for analysis)' : '') :
          `Gap identified in ${category} but increasing funding would exceed efficiency targets.` +
          (rawGap < 0 ? ' (Note: Original gap was negative, converted to positive for analysis)' : '')
      });
    }
  }
  
  return gaps;
}

// Check if funding can be increased within targets
function checkIfCanIncreaseFunding(category, requested, gap, tactics) {
  // For tactic-related categories, check if increased funding stays within bounds
  if (['canvass', 'phone', 'text', 'open'].includes(category)) {
    const relevantTactic = tactics.find(t => {
      if ((category === 'canvass' || category === 'open') && (t instanceof DoorTactic || t instanceof OpenTactic)) return true;
      if (category === 'phone' && t instanceof PhoneTactic) return true;
      if (category === 'text' && t instanceof TextTactic) return true;
      return false;
    });
    
    if (relevantTactic) {
      const programAttempts = relevantTactic.programAttempts();
      const newCostPerAttempt = (requested + gap) / programAttempts;
      
      const tacticType = relevantTactic instanceof DoorTactic ? 'DOOR' :
                        relevantTactic instanceof PhoneTactic ? 'PHONE' :
                        relevantTactic instanceof TextTactic ? 'TEXT' : 'OPEN';
      
      const target = getTacticTargets()[tacticType];
      return newCostPerAttempt <= (target.target + target.stdDev);
    }
  }
  
  // For non-tactic categories, allow increase if gap exists
  return true;
}

// Send budget analysis email
function sendBudgetAnalysisEmail(budget, fieldPlan, analysis, isTestMode = false) {
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
            <th>Recommendation</th>
          </tr>
        </thead>
        <tbody>`;
    
    for (const gap of analysis.gaps) {
      const tacticName = gap.category.charAt(0).toUpperCase() + gap.category.slice(1);
      const recommendation = gap.canIncrease ? 
        `Consider increasing by up to $${gap.gap}` :
        `Would exceed efficiency targets`;
      
      emailBody += `
          <tr>
            <td><strong>${tacticName}</strong></td>
            <td>$${gap.gap}</td>
            <td>${recommendation}</td>
          </tr>`;
    }
    
    emailBody += `
        </tbody>
      </table>`;
  }
  
  // Add field plan connection
  emailBody += `
    <h3>Field Plan Details</h3>
    <p>This analysis is based on the field plan submitted on ${fieldPlan.submissionDateTime}</p>
    <p>Confidence Level: ${fieldPlan.fieldPlanConfidence}/10</p>
    <p>${fieldPlan.needsCoaching()}</p>`;
  
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

// Manually analyze a specific organization
function analyzeSpecificOrganization(orgName, isTestMode = true) {
  Logger.log(`Manual analysis requested for ${orgName} (${isTestMode ? 'TEST MODE' : 'PRODUCTION'})`);
  
  // Find the budget for this org
  const sheetName = scriptProps.getProperty('SHEET_FIELD_BUDGET') || '2025_field_budget';
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

// Generate combined weekly summary report for both budgets and field plans
function generateWeeklySummary(isTestMode = false) {
  try {
    Logger.log(`Starting generateWeeklySummary (isTestMode: ${isTestMode})`);
    
    const budgetSheetName = scriptProps.getProperty('SHEET_FIELD_BUDGET') || '2025_field_budget';
    const fieldPlanSheetName = scriptProps.getProperty('SHEET_FIELD_PLAN') || '2025_field_plan';
    
    // Get sheets with error checking
    const spreadsheet = SpreadsheetApp.getActive();
    if (!spreadsheet) {
      throw new Error('Unable to access active spreadsheet');
    }
    
    const budgetSheet = spreadsheet.getSheetByName(budgetSheetName);
    if (!budgetSheet) {
      throw new Error(`Budget sheet '${budgetSheetName}' not found`);
    }
    
    const fieldPlanSheet = spreadsheet.getSheetByName(fieldPlanSheetName);
    if (!fieldPlanSheet) {
      throw new Error(`Field plan sheet '${fieldPlanSheetName}' not found`);
    }
    
    const budgetData = budgetSheet.getDataRange().getValues();
    const fieldPlanData = fieldPlanSheet.getDataRange().getValues();
    
    Logger.log(`Loaded ${budgetData.length} budget rows and ${fieldPlanData.length} field plan rows`);
  
  // Calculate date range for "this week" (past 7 days)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  // Budget analysis
  let budgetsAnalyzed = 0;
  let budgetsPending = 0;
  let budgetsMissingPlans = 0;
  let totalRequested = 0;
  let totalGap = 0;
  let weeklyRequestedTotal = 0;
  const budgetsMissingPlansList = [];
  
  // Field plan analysis
  let fieldPlansTotal = 0;
  let fieldPlansThisWeek = 0;
  let fieldPlansMissingBudgets = 0;
  const fieldPlansMissingBudgetsList = [];
  const countyData = {};
  const tacticCounts = {
    DOOR: 0,
    PHONE: 0,
    TEXT: 0,
    OPEN: 0,
    RELATIONAL: 0,
    REGISTRATION: 0,
    MAIL: 0
  };
  const coachingNeeds = {
    high: 0,    // 1-5
    medium: 0,  // 6-8
    low: 0      // 9-10
  };
  
  // Process budget data
  for (let i = 1; i < budgetData.length; i++) {
    if (budgetData[i][0]) {
      const orgName = budgetData[i][FieldBudget.COLUMNS.MEMBERNAME];
      const requestedAmount = budgetData[i][FieldBudget.COLUMNS.REQUESTEDTOTAL] || 0;
      
      if (budgetData[i][FieldBudget.COLUMNS.ANALYZED] === true) {
        budgetsAnalyzed++;
      } else {
        budgetsPending++;
        // Check if waiting for field plan
        const properties = PropertiesService.getScriptProperties();
        const missingPlanProp = properties.getProperty(`MISSING_PLAN_${orgName}`);
        if (missingPlanProp) {
          budgetsMissingPlans++;
          const daysSince = Math.floor((new Date() - new Date(missingPlanProp)) / (1000 * 60 * 60 * 24));
          budgetsMissingPlansList.push({ org: orgName, days: daysSince });
        }
      }
      
      totalRequested += requestedAmount;
      
      // Check if submitted this week (would need timestamp column)
      const submitDate = budgetData[i][0]; // Assuming first column is timestamp
      if (submitDate && new Date(submitDate) >= oneWeekAgo) {
        weeklyRequestedTotal += requestedAmount;
      }
      
      // Convert negative gaps to positive for totaling
      const gapValue = budgetData[i][FieldBudget.COLUMNS.GAPTOTAL] || 0;
      totalGap += Math.abs(gapValue);
    }
  }
  
  // Process field plan data
  const properties = PropertiesService.getScriptProperties();
  for (let i = 1; i < fieldPlanData.length; i++) {
    if (fieldPlanData[i][0]) {
      fieldPlansTotal++;
      const orgName = fieldPlanData[i][FieldPlan.COLUMNS.MEMBERNAME];
      const submitDate = fieldPlanData[i][FieldPlan.COLUMNS.SUBMISSIONDATETIME];
      
      // Check if submitted this week
      if (submitDate && new Date(submitDate) >= oneWeekAgo) {
        fieldPlansThisWeek++;
      }
      
      // Check for missing budget
      const missingBudgetProp = properties.getProperty(`MISSING_BUDGET_${orgName}`);
      if (missingBudgetProp) {
        fieldPlansMissingBudgets++;
        const daysSince = Math.floor((new Date() - new Date(missingBudgetProp)) / (1000 * 60 * 60 * 24));
        fieldPlansMissingBudgetsList.push({ org: orgName, days: daysSince });
      } else {
        // Check if budget exists at all
        let hasBudget = false;
        for (let j = 1; j < budgetData.length; j++) {
          if (budgetData[j][FieldBudget.COLUMNS.MEMBERNAME] === orgName) {
            hasBudget = true;
            break;
          }
        }
        if (!hasBudget && submitDate) {
          const daysSince = Math.floor((new Date() - new Date(submitDate)) / (1000 * 60 * 60 * 24));
          if (daysSince > 3) {
            fieldPlansMissingBudgets++;
            fieldPlansMissingBudgetsList.push({ org: orgName, days: daysSince });
          }
        }
      }
      
      // Count counties
      const counties = fieldPlanData[i][FieldPlan.COLUMNS.FIELDCOUNTIES];
      if (counties) {
        let countyList = [];
        
        // Handle different input formats
        if (Array.isArray(counties)) {
          countyList = counties;
        } else {
          const countyString = counties.toString().trim();
          
          // Check if it contains commas (properly formatted)
          if (countyString.includes(',')) {
            countyList = countyString.split(',');
          } else {
            // No commas - need to parse space-separated counties
            // Handle known multi-word counties in Alabama
            const multiWordCounties = ['Saint Clair', 'St. Clair', 'St Clair'];
            let processedString = countyString;
            
            // Replace multi-word counties with temporary placeholders
            multiWordCounties.forEach((mwCounty, index) => {
              const regex = new RegExp(mwCounty, 'gi');
              processedString = processedString.replace(regex, `__MW${index}__`);
            });
            
            // Split by spaces
            let tempList = processedString.split(/\s+/);
            
            // Replace placeholders back with actual county names
            countyList = tempList.map(item => {
              multiWordCounties.forEach((mwCounty, index) => {
                if (item === `__MW${index}__`) {
                  item = 'Saint Clair'; // Normalize to standard form
                }
              });
              return item;
            }).filter(county => county.length > 0);
          }
        }
        
        // Process each county
        countyList.forEach(county => {
          const trimmedCounty = county.trim();
          if (trimmedCounty) {
            countyData[trimmedCounty] = (countyData[trimmedCounty] || 0) + 1;
          }
        });
      }
      
      // Count tactics (checking which tactic columns have data)
      const rowData = fieldPlanData[i];
      if (rowData[PROGRAM_COLUMNS.DOOR.PROGRAMLENGTH]) tacticCounts.DOOR++;
      if (rowData[PROGRAM_COLUMNS.PHONE.PROGRAMLENGTH]) tacticCounts.PHONE++;
      if (rowData[PROGRAM_COLUMNS.TEXT.PROGRAMLENGTH]) tacticCounts.TEXT++;
      if (rowData[PROGRAM_COLUMNS.OPEN.PROGRAMLENGTH]) tacticCounts.OPEN++;
      if (rowData[PROGRAM_COLUMNS.RELATIONAL.PROGRAMLENGTH]) tacticCounts.RELATIONAL++;
      if (rowData[PROGRAM_COLUMNS.REGISTRATION.PROGRAMLENGTH]) tacticCounts.REGISTRATION++;
      if (rowData[PROGRAM_COLUMNS.MAIL.PROGRAMLENGTH]) tacticCounts.MAIL++;
      
      // Count coaching needs
      const confidence = fieldPlanData[i][FieldPlan.COLUMNS.PLANCONFIDENCE];
      if (confidence) {
        if (confidence <= 5) coachingNeeds.high++;
        else if (confidence <= 8) coachingNeeds.medium++;
        else coachingNeeds.low++;
      }
    }
  }
  
  // Sort missing lists by days
  budgetsMissingPlansList.sort((a, b) => b.days - a.days);
  fieldPlansMissingBudgetsList.sort((a, b) => b.days - a.days);
  
  // Build email body
  let emailBody = `
    <h2>Weekly Summary Report - Field Plans & Budgets</h2>
    <p>Report generated on: ${new Date().toLocaleDateString()}</p>
    
    <h3>Field Plan Activity</h3>
    <ul>
      <li>New Field Plans This Week: ${fieldPlansThisWeek}</li>
      <li>Total Active Field Plans: ${fieldPlansTotal}</li>
      <li>Field Plans Missing Budgets: ${fieldPlansMissingBudgets}</li>
    </ul>
    
    <h3>Budget Analysis Status</h3>
    <ul>
      <li>Budgets Analyzed: ${budgetsAnalyzed}</li>
      <li>Budgets Pending Analysis: ${budgetsPending}</li>
      <li>Budgets Missing Field Plans: ${budgetsMissingPlans}</li>
    </ul>
    
    <h3>Financial Summary</h3>
    <ul>
      <li>Total Requested This Week: $${weeklyRequestedTotal.toFixed(2)}</li>
      <li>Total Requested Overall: $${totalRequested.toFixed(2)}</li>
      <li>Total Gap Identified: $${totalGap.toFixed(2)}</li>
    </ul>
    
    <h3>Tactic Distribution</h3>
    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse;">
      <thead>
        <tr style="background-color: #f2f2f2;">
          <th>Tactic</th>
          <th>Number of Programs</th>
        </tr>
      </thead>
      <tbody>`;
  
  // Add tactic rows
  Object.entries(tacticCounts).forEach(([tactic, count]) => {
    if (count > 0) {
      emailBody += `
        <tr>
          <td>${tactic}</td>
          <td>${count}</td>
        </tr>`;
    }
  });
  
  emailBody += `
      </tbody>
    </table>
    
    <h3>Geographic Coverage</h3>
    <p><strong>Counties with Active Programs:</strong></p>
    <ul>`;
  
  // Sort counties by count
  const sortedCounties = Object.entries(countyData).sort((a, b) => b[1] - a[1]);
  sortedCounties.forEach(([county, count]) => {
    emailBody += `<li>${county}: ${count} program${count > 1 ? 's' : ''}</li>`;
  });
  
  emailBody += `
    </ul>
    
    <h3>Organizations Needing Follow-Up</h3>`;
  
  // Missing budgets section
  if (fieldPlansMissingBudgetsList.length > 0) {
    emailBody += `
    <h4>Field Plans Missing Budgets (>72 hours)</h4>
    <ul>`;
    fieldPlansMissingBudgetsList.forEach(item => {
      emailBody += `<li>${item.org} - submitted ${item.days} days ago</li>`;
    });
    emailBody += `</ul>`;
  }
  
  // Missing field plans section
  if (budgetsMissingPlansList.length > 0) {
    emailBody += `
    <h4>Budgets Missing Field Plans (>72 hours)</h4>
    <ul>`;
    budgetsMissingPlansList.forEach(item => {
      emailBody += `<li>${item.org} - submitted ${item.days} days ago</li>`;
    });
    emailBody += `</ul>`;
  }
  
  emailBody += `
    <h3>Coaching Needs Summary</h3>
    <ul>
      <li>High Need (1-5): ${coachingNeeds.high} organizations</li>
      <li>Medium Need (6-8): ${coachingNeeds.medium} organizations</li>
      <li>Low Need (9-10): ${coachingNeeds.low} organizations</li>
    </ul>
    
    <p><em>Note: All gap calculations use absolute values. Missing documents are tracked after 72 hours.</em></p>
  `;
  
  // Add test mode indicator if in test mode
  if (isTestMode) {
    emailBody = `<div style="background-color: #ffffcc; padding: 10px; border: 2px solid #ffcc00; margin-bottom: 20px;">
      <strong>🧪 TEST MODE EMAIL</strong> - This is a test email sent only to datateam@alforward.org
    </div>` + emailBody;
  }

    const recipients = getEmailRecipients(isTestMode);
    Logger.log(`Sending weekly summary to: ${recipients.join(', ')}`);
    
    MailApp.sendEmail({
      to: recipients.join(','),
      subject: `${isTestMode ? '[TEST] ' : ''}Weekly Summary Report - ${new Date().toLocaleDateString()}`,
      htmlBody: emailBody,
      name: "Field Plan & Budget Analysis System",
      replyTo: scriptProps.getProperty('EMAIL_REPLY_TO') || 'datateam@alforward.org'
    });
    Logger.log(`Combined weekly summary report sent successfully (${isTestMode ? 'TEST MODE' : 'PRODUCTION'})`);
    
  } catch (error) {
    Logger.log(`ERROR in generateWeeklySummary: ${error.message}`);
    Logger.log(`Stack trace: ${error.stack}`);
    
    // Try to send error notification
    try {
      const errorEmail = `
        <h2>Weekly Summary Generation Failed</h2>
        <p><strong>Error:</strong> ${error.message}</p>
        <p><strong>Time:</strong> ${new Date().toString()}</p>
        <p><strong>Mode:</strong> ${isTestMode ? 'TEST' : 'PRODUCTION'}</p>
        <p>Please check the Apps Script logs for more details.</p>
      `;
      
      MailApp.sendEmail({
        to: 'datateam@alforward.org',
        subject: 'ERROR: Weekly Summary Generation Failed',
        htmlBody: errorEmail,
        name: "Field Plan & Budget Analysis System"
      });
    } catch (emailError) {
      Logger.log(`Failed to send error notification: ${emailError.message}`);
    }
    
    // Re-throw to ensure the error is visible in the execution transcript
    throw error;
  }
}

// Wrapper function for the weekly summary trigger
// This ensures the function is called with the correct parameters
function runWeeklySummaryTrigger() {
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