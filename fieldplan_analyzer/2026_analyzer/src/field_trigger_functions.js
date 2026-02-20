// Field plan processing logic, triggers, and event callbacks.
// Email functions are in email_builders.js.
// Shared globals (scriptProps, EMAIL_CONFIG) are in _globals.js.

/**
 * Creates tactic instances for all tactics that have data in the row
 * Uses NEW config-drive TacticProgram class
 * @param {*} rowData
 * @returns tactics and associated data
 */
function getTacticInstances(rowData) {
  const tactics = [];

  //Iterate through all tactic configurations
  for (const [tacticKey, config] of Object.entries(TACTIC_CONFIG)) {
    try {
      //Check if this TACTIC_CONFIG key has corresponding key in PROGRAM_COLUMNS
      const columns = PROGRAM_COLUMNS[config.columnKey];
      if (!columns) {
        Logger.log(`Warning: No PROGRAM_COLUMNS found for ${tacticKey}`);
        continue;
      }

      //Check if this tactic has any data filled in
      if (rowData[columns.PROGRAM_LENGTH] || rowData[columns.WEEKLYVOLUNTEERS]) {
        tactics.push(new TacticProgram(rowData, tacticKey));
      }
    } catch (error) {
      Logger.log(`Error creating ${tacticKey} tactic: ${error.message}`);
    }
  }
    return tactics;
}

/**
 * Creates a single tactic instance by type
 * Uses the new config-driven TacticProgram class
 * @param {*} rowData
 * @param {*} tacticType
 * @returns
 */
function getFieldTacticDetails(rowData, tacticType) {
  try {
    // Validate tacticType exists in configuration
    if (!TACTIC_CONFIG[tacticType]) {
      Logger.log(`Unknown tactic type: ${tacticType}. Valid types: ${Object.keys(TACTIC_CONFIG).join(', ')}`);
      return null;
    }

    return new TacticProgram(rowData, tacticType);
  } catch (error) {
    Logger.log(`Error creating ${tacticType} tactic: ${error.message}`);
    return null;
  }
}

function createSpreadsheetTrigger() {
  // Check if trigger already exists
  const triggers = ScriptApp.getProjectTriggers();
  const triggerExists = triggers.some(trigger =>
    trigger.getHandlerFunction() === 'checkForNewRows' &&
    trigger.getEventType() === ScriptApp.EventType.CLOCK
  );

  if (!triggerExists) {
    // Create trigger to run twice a day (every 12 hours)
    const triggerHours = parseInt(scriptProps.getProperty('TRIGGER_FIELD_PLAN_CHECK_HOURS'));
    ScriptApp.newTrigger('checkForNewRows')
      .timeBased()
      .everyHours(triggerHours)
      .create();
    Logger.log('New time-based trigger created to run every 12 hours');

    // Initialize the last processed row property
    PropertiesService.getScriptProperties().setProperty('LAST_PROCESSED_ROW', getLastRow().toString());
  } else {
    Logger.log('Time-based trigger already exists');
  }
}

// Helper function to get the last row number
function getLastRow() {
  const sheetName = scriptProps.getProperty('SHEET_FIELD_PLAN');
  const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  return sheet.getLastRow();
}

// Function to check for new rows and process them
function checkForNewRows() {
  try {
    const sheetName = scriptProps.getProperty('SHEET_FIELD_PLAN');
    const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
    const currentLastRow = sheet.getLastRow();

    // Get the last processed row from properties
    const lastProcessedRow = parseInt(PropertiesService.getScriptProperties().getProperty('LAST_PROCESSED_ROW') || '1');

    Logger.log(`Current last row: ${currentLastRow}, Last processed row: ${lastProcessedRow}`);

    // If there are new rows
    if (currentLastRow > lastProcessedRow) {
      // Process each new row
      for (let rowNumber = lastProcessedRow + 1; rowNumber <= currentLastRow; rowNumber++) {
        try {
          const fieldPlan = FieldPlan.fromSpecificRow(rowNumber);
          Logger.log(`Processing row ${rowNumber}: ${fieldPlan.memberOrgName}`);

          // Send email with field plan details
          sendFieldPlanEmail(fieldPlan, rowNumber);

          // Check for matching budget
          const budgetMatch = findMatchingBudget(fieldPlan.memberOrgName);
          if (!budgetMatch) {
            // No budget found - track this field plan as missing budget
            trackMissingBudget(fieldPlan);
          } else {
            Logger.log(`Found matching budget for ${fieldPlan.memberOrgName}`);
          }

          // Trigger budget analysis for this organization
          onFieldPlanSubmission(fieldPlan);

        } catch (error) {
          Logger.log(`Error processing row ${rowNumber}: ${error.message}`);
        }
      }

      // Update the last processed row
      PropertiesService.getScriptProperties().setProperty('LAST_PROCESSED_ROW', currentLastRow.toString());
      Logger.log(`Updated last processed row to ${currentLastRow}`);

      // Check for field plans that have been waiting too long for budgets
      checkForMissingBudgets();
    } else {
      Logger.log('No new rows to process');
    }
  } catch (error) {
    Logger.log(`Error in checkForNewRows: ${error.message}`);
  }
}

// Find matching budget for organization
function findMatchingBudget(orgName) {
  const budgetSheetName = scriptProps.getProperty('SHEET_FIELD_BUDGET');
  const budgetSheet = SpreadsheetApp.getActive().getSheetByName(budgetSheetName);
  const data = budgetSheet.getDataRange().getValues();

  // Find any budget for this org (not necessarily unanalyzed)
  for (let i = 1; i < data.length; i++) {
    if (data[i][FieldBudget.COLUMNS.MEMBERNAME] === orgName) {
      return {
        budget: new FieldBudget(data[i]),
        rowNumber: i + 1,
        analyzed: data[i][FieldBudget.COLUMNS.ANALYZED] === true
      };
    }
  }

  return null;
}

// Track field plans missing budgets
function trackMissingBudget(fieldPlan) {
  const properties = PropertiesService.getScriptProperties();
  const key = `MISSING_BUDGET_${fieldPlan.memberOrgName}`;
  const existingTimestamp = properties.getProperty(key);

  if (!existingTimestamp) {
    // First time checking - record timestamp
    properties.setProperty(key, new Date().toISOString());
    Logger.log(`Started tracking missing budget for ${fieldPlan.memberOrgName}`);
  }
}

// Check for field plans waiting too long for budgets
function checkForMissingBudgets() {
  const properties = PropertiesService.getScriptProperties();
  const allProperties = properties.getProperties();
  const currentTime = new Date();
  const thresholdHours = parseInt(scriptProps.getProperty('TRIGGER_MISSING_PLAN_THRESHOLD_HOURS') || '72');
  const thresholdMilliseconds = thresholdHours * 60 * 60 * 1000; // Convert to milliseconds

  for (const key in allProperties) {
    if (key.startsWith('MISSING_BUDGET_')) {
      const orgName = key.replace('MISSING_BUDGET_', '');
      const timestamp = new Date(allProperties[key]);

      if (currentTime - timestamp > thresholdMilliseconds) {
        // Send notification about missing budget
        sendMissingBudgetNotification(orgName);

        // Remove the tracking property
        properties.deleteProperty(key);
      }
    }
  }
}

// Function to process ALL field plans regardless of previous processing
function processAllFieldPlans(isTestMode = false) {
  try {
    Logger.log(`=== PROCESSING ALL FIELD PLANS (${isTestMode ? 'TEST MODE' : 'PRODUCTION'}) ===`);

    const sheetName = scriptProps.getProperty('SHEET_FIELD_PLAN');
    const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
    const currentLastRow = sheet.getLastRow();

    let successCount = 0;
    let errorCount = 0;

    // Process ALL rows (starting from row 2 to skip header)
    for (let rowNumber = 2; rowNumber <= currentLastRow; rowNumber++) {
      try {
        const fieldPlan = FieldPlan.fromSpecificRow(rowNumber);
        Logger.log(`Processing row ${rowNumber}: ${fieldPlan.memberOrgName}`);

        // Send email with field plan details
        if (isTestMode) {
          // In test mode, modify the sendFieldPlanEmail to use test recipients
          const originalRecipients = scriptProps.getProperty('TEST_RECIPIENTS');
          scriptProps.setProperty('TEST_RECIPIENTS');
          sendFieldPlanEmail(fieldPlan, rowNumber);
          scriptProps.setProperty('TEST_RECIPIENTS', originalRecipients);
        } else {
          sendFieldPlanEmail(fieldPlan, rowNumber);
        }

        successCount++;

      } catch (error) {
        Logger.log(`Error processing row ${rowNumber}: ${error.message}`);
        errorCount++;
      }
    }

    Logger.log(`=== FIELD PLAN PROCESSING COMPLETE ===`);
    Logger.log(`Successfully processed: ${successCount} field plans`);
    Logger.log(`Errors encountered: ${errorCount}`);

    return { success: successCount, errors: errorCount };

  } catch (error) {
    Logger.log(`Critical error in processAllFieldPlans: ${error.message}`);
    throw error;
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
