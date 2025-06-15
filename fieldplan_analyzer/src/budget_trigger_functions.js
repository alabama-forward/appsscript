// Cost per attempt targets with standard deviations
const TACTIC_TARGETS = {
  DOOR: { target: 1.00, stdDev: 0.20 },
  PHONE: { target: 0.66, stdDev: 0.15 },
  TEXT: { target: 0.02, stdDev: 0.01 },
  OPEN: { target: 0.40, stdDev: 0.10 }
}

// Email configuration
const EMAIL_CONFIG = {
  recipients: [
    "gabri@alforward.org",
    "sherri@alforward.org", 
    "deanna@alforward.org",
    "datateam@alforward.org"
  ],
  testRecipients: [
    "datateam@alforward.org"
  ],
  replyTo: "datateam@alforward.org"
};

// Helper function to get email recipients based on mode
function getEmailRecipients(isTestMode = false) {
  return isTestMode ? EMAIL_CONFIG.testRecipients : EMAIL_CONFIG.recipients;
}

// Create time-based trigger for budget analysis
function createBudgetAnalysisTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  const triggerExists = triggers.some(trigger => 
    trigger.getHandlerFunction() === 'analyzeBudgets' && 
    trigger.getEventType() === ScriptApp.EventType.CLOCK
  );
  
  if (!triggerExists) {
    ScriptApp.newTrigger('analyzeBudgets')
      .timeBased()
      .everyHours(12)
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
function processBudget(budgetData) {
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
  sendBudgetAnalysisEmail(budget, fieldPlanMatch.fieldPlan, analysis);
  
  // Mark as analyzed
  budget.markAsAnalyzed(rowNumber);
  
  Logger.log(`Analysis completed for ${budget.memberOrgName}`);
}

// Find matching field plan for organization
function findMatchingFieldPlan(orgName) {
  const planSheet = SpreadsheetApp.getActive().getSheetByName('2025_field_plan');
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
    fundingRequested = budget.canvassRequested || 0;
  } else if (tactic instanceof PhoneTactic) {
    tacticType = 'PHONE';
    budgetField = 'phoneRequested';
    fundingRequested = budget.phoneRequested || 0;
  } else if (tactic instanceof TextTactic) {
    tacticType = 'TEXT';
    budgetField = 'textRequested';
    fundingRequested = budget.textRequested || 0;
  } else if (tactic instanceof OpenTactic) {
    tacticType = 'OPEN';
    budgetField = 'canvassRequested';
    fundingRequested = budget.canvassRequested || 0;
  } else {
    return null;
  }
  
  const programAttempts = tactic.programAttempts();
  const costPerAttempt = programAttempts > 0 ? fundingRequested / programAttempts : Infinity;
  
  const target = TACTIC_TARGETS[tacticType];
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
  
  // Check each budget category for gaps
  const categories = ['admin', 'data', 'travel', 'comms', 'design', 'video', 
                     'print', 'postage', 'training', 'supplies', 'canvass', 
                     'phone', 'text', 'event', 'digital'];
  
  for (const category of categories) {
    const requested = budget[category + 'Requested'] || 0;
    const gap = budget[category + 'Gap'] || 0;
    
    if (gap > 0) {
      // Check if we can recommend increased funding
      const canIncrease = checkIfCanIncreaseFunding(category, requested, gap, tactics);
      gaps.push({
        category: category,
        requested: requested,
        gap: gap,
        canIncrease: canIncrease,
        recommendation: canIncrease ? 
          `Consider increasing ${category} funding by up to $${gap} while maintaining cost efficiency.` :
          `Gap identified in ${category} but increasing funding would exceed efficiency targets.`
      });
    }
  }
  
  return gaps;
}

// Check if funding can be increased within targets
function checkIfCanIncreaseFunding(category, requested, gap, tactics) {
  // For tactic-related categories, check if increased funding stays within bounds
  if (['canvass', 'phone', 'text'].includes(category)) {
    const relevantTactic = tactics.find(t => {
      if (category === 'canvass' && (t instanceof DoorTactic || t instanceof OpenTactic)) return true;
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
      
      const target = TACTIC_TARGETS[tacticType];
      return newCostPerAttempt <= (target.target + target.stdDev);
    }
  }
  
  // For non-tactic categories, allow increase if gap exists
  return true;
}

// Send budget analysis email
function sendBudgetAnalysisEmail(budget, fieldPlan, analysis) {
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
        <li>Funding Requested: $${tactic.fundingRequested.toFixed(2)}</li>
        <li>Program Attempts: ${tactic.programAttempts}</li>
        <li>Cost Per Attempt: $${tactic.costPerAttempt.toFixed(2)}</li>
        <li>Target Range: $${tactic.lowerBound.toFixed(2)} - $${tactic.upperBound.toFixed(2)}</li>
        <li>Status: ${tactic.status} target range</li>
      </ul>
      <p><strong>Recommendation:</strong> ${tactic.recommendation}</p>`;
  }
  
  // Add gap analysis
  if (analysis.gaps.length > 0) {
    emailBody += `<h3>Funding Gap Analysis</h3>`;
    for (const gap of analysis.gaps) {
      emailBody += `
        <p><strong>${gap.category}:</strong> ${gap.recommendation}</p>`;
    }
  }
  
  // Add field plan connection
  emailBody += `
    <h3>Field Plan Details</h3>
    <p>This analysis is based on the field plan submitted on ${fieldPlan.submissionDateTime}</p>
    <p>Confidence Level: ${fieldPlan.fieldPlanConfidence}/10</p>
    <p>${fieldPlan.needsCoaching()}</p>`;
  
  // Send email
  try {
    MailApp.sendEmail({
      to: EMAIL_CONFIG.recipients.join(','),
      subject: `Budget Analysis: ${budget.memberOrgName}`,
      htmlBody: emailBody,
      name: "Budget Analysis System",
      replyTo: EMAIL_CONFIG.replyTo
    });
    Logger.log(`Budget analysis email sent for ${budget.memberOrgName}`);
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
  const seventyTwoHours = 72 * 60 * 60 * 1000; // 72 hours in milliseconds
  
  for (const key in allProperties) {
    if (key.startsWith('MISSING_PLAN_')) {
      const orgName = key.replace('MISSING_PLAN_', '');
      const timestamp = new Date(allProperties[key]);
      
      if (currentTime - timestamp > seventyTwoHours) {
        // Send notification about missing field plan
        sendMissingFieldPlanNotification(orgName);
        
        // Remove the tracking property
        properties.deleteProperty(key);
      }
    }
  }
}

// Send notification for missing field plan
function sendMissingFieldPlanNotification(orgName) {
  const emailBody = `
    <h2>Missing Field Plan Alert</h2>
    <p><strong>Organization:</strong> ${orgName}</p>
    <p>This organization submitted a budget more than 72 hours ago but has not yet submitted a field plan.</p>
    <p>The budget analysis cannot be completed without a corresponding field plan.</p>
    <p>Please follow up with the organization to request their field plan submission.</p>
  `;
  
  try {
    MailApp.sendEmail({
      to: EMAIL_CONFIG.recipients.join(','),
      subject: `Missing Field Plan: ${orgName}`,
      htmlBody: emailBody,
      name: "Budget Analysis System",
      replyTo: EMAIL_CONFIG.replyTo
    });
    Logger.log(`Missing field plan notification sent for ${orgName}`);
  } catch (error) {
    Logger.log(`Error sending missing field plan notification: ${error.message}`);
  }
}

// Send error notification
function sendErrorNotification(budget, error) {
  const emailBody = `
    <h2>Budget Analysis Error</h2>
    <p><strong>Organization:</strong> ${budget.memberOrgName}</p>
    <p><strong>Error:</strong> ${error.message}</p>
    <p>The budget analysis encountered an error and could not be completed.</p>
    <p>Please check the Apps Script logs for more details.</p>
  `;
  
  try {
    MailApp.sendEmail({
      to: EMAIL_CONFIG.recipients.join(','),
      subject: `Budget Analysis Error: ${budget.memberOrgName}`,
      htmlBody: emailBody,
      name: "Budget Analysis System",
      replyTo: EMAIL_CONFIG.replyTo
    });
  } catch (emailError) {
    Logger.log(`Failed to send error notification: ${emailError.message}`);
  }
}

// Manually analyze a specific organization
function analyzeSpecificOrganization(orgName) {
  Logger.log(`Manual analysis requested for ${orgName}`);
  
  // Find the budget for this org
  const budgetSheet = SpreadsheetApp.getActive().getSheetByName('2025_field_budget');
  const data = budgetSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][FieldBudget.COLUMNS.MEMBERNAME] === orgName) {
      const budget = new FieldBudget(data[i]);
      const budgetData = { budget: budget, rowNumber: i + 1 };
      
      try {
        processBudget(budgetData);
        Logger.log(`Manual analysis completed for ${orgName}`);
        return;
      } catch (error) {
        Logger.log(`Error in manual analysis: ${error.message}`);
        sendErrorNotification(budget, error);
        return;
      }
    }
  }
  
  Logger.log(`No budget found for organization: ${orgName}`);
}

// Generate weekly summary report
function generateWeeklySummary() {
  const budgetSheet = SpreadsheetApp.getActive().getSheetByName('2025_field_budget');
  const data = budgetSheet.getDataRange().getValues();
  
  let analyzed = 0;
  let pending = 0;
  let missingPlans = 0;
  let totalRequested = 0;
  let totalGap = 0;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      if (data[i][FieldBudget.COLUMNS.ANALYZED] === true) {
        analyzed++;
      } else {
        pending++;
        // Check if waiting for field plan
        const properties = PropertiesService.getScriptProperties();
        if (properties.getProperty(`MISSING_PLAN_${data[i][FieldBudget.COLUMNS.MEMBERNAME]}`)) {
          missingPlans++;
        }
      }
      
      totalRequested += data[i][FieldBudget.COLUMNS.REQUESTEDTOTAL] || 0;
      totalGap += data[i][FieldBudget.COLUMNS.GAPTOTAL] || 0;
    }
  }
  
  const emailBody = `
    <h2>Weekly Budget Analysis Summary</h2>
    <p>Report generated on: ${new Date().toLocaleDateString()}</p>
    
    <h3>Analysis Status</h3>
    <ul>
      <li>Budgets Analyzed: ${analyzed}</li>
      <li>Budgets Pending: ${pending}</li>
      <li>Waiting for Field Plans: ${missingPlans}</li>
    </ul>
    
    <h3>Financial Summary</h3>
    <ul>
      <li>Total Requested: $${totalRequested.toFixed(2)}</li>
      <li>Total Gap Identified: $${totalGap.toFixed(2)}</li>
    </ul>
    
    <p>${FieldBudget.countAnalyzed()}</p>
  `;
  
  try {
    MailApp.sendEmail({
      to: EMAIL_CONFIG.recipients.join(','),
      subject: `Weekly Budget Analysis Summary - ${new Date().toLocaleDateString()}`,
      htmlBody: emailBody,
      name: "Budget Analysis System",
      replyTo: EMAIL_CONFIG.replyTo
    });
    Logger.log('Weekly summary report sent');
  } catch (error) {
    Logger.log(`Error sending weekly summary: ${error.message}`);
  }
}

// Create weekly summary trigger
function createWeeklySummaryTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  const triggerExists = triggers.some(trigger => 
    trigger.getHandlerFunction() === 'generateWeeklySummary' && 
    trigger.getEventType() === ScriptApp.EventType.CLOCK
  );
  
  if (!triggerExists) {
    ScriptApp.newTrigger('generateWeeklySummary')
      .timeBased()
      .onWeekDay(ScriptApp.WeekDay.MONDAY)
      .atHour(9)
      .create();
    Logger.log('Weekly summary trigger created for Monday 9 AM');
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