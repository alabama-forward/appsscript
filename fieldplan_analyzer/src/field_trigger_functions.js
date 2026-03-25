// Field plan processing logic, triggers, and event callbacks.
// Email functions are in email_builders.js.
// Shared globals (scriptProps, EMAIL_CONFIG) are in _globals.js.

/**
 * Creates tactic instances for all tactics that have data in the row
 * Uses NEW config-drive TacticProgram class
 * @param {*} rowData
 * @returns tactics and associated data
 */
/**
 * Creates tactic instances for all tactics that have data in the row.
 *
 * Each tactic row has 4 required fields: Program Length, Weekly Volunteers,
 * Weekly Hours, and Hourly Attempts. This function categorizes each tactic:
 *
 *   - All 4 fields empty  → tactic not used, skipped silently
 *   - All 4 fields filled → valid TacticProgram, added to the returned array
 *   - Some filled, some empty → incomplete submission, tracked in .incomplete
 *
 * If NO tactics have any data at all, a warning is logged. This should not
 * happen (the form requires at least one tactic) but is caught here as a
 * safeguard.
 *
 * @param {Array} rowData - A single row of spreadsheet values
 * @returns {TacticProgram[]} Array of valid tactics with two extra properties:
 *   .incomplete — array of { tacticName, tacticKey, filledFields[], missingFields[] }
 *   .noTacticsAtAll — boolean, true if the respondent left every tactic blank
 */
function getTacticInstances(rowData) {
  const tactics = [];
  const incomplete = [];
  let anyDataFound = false;

  for (const [tacticKey, config] of Object.entries(TACTIC_CONFIG)) {
    try {
      const columns = PROGRAM_COLUMNS[config.columnKey];
      if (!columns) {
        Logger.log(`Warning: No PROGRAM_COLUMNS found for ${tacticKey}`);
        continue;
      }

      const fieldChecks = [
        { name: 'Program Length',    value: rowData[columns.PROGRAMLENGTH] },
        { name: 'Weekly Volunteers', value: rowData[columns.WEEKLYVOLUNTEERS] },
        { name: 'Weekly Hours',      value: rowData[columns.WEEKLYHOURS] },
        { name: 'Hourly Attempts',   value: rowData[columns.HOURLYATTEMPTS] }
      ];

      const filled = fieldChecks.filter(f => f.value && !isNaN(f.value) && Number(f.value) > 0);
      const missing = fieldChecks.filter(f => !f.value || isNaN(f.value) || Number(f.value) <= 0);

      // All empty — tactic not used
      if (filled.length === 0) continue;

      anyDataFound = true;

      // All filled — valid tactic
      if (missing.length === 0) {
        tactics.push(new TacticProgram(rowData, tacticKey));
        continue;
      }

      // Partially filled — incomplete submission
      Logger.log(`Incomplete goals for ${config.name}: missing ${missing.map(f => f.name).join(', ')}`);
      incomplete.push({
        tacticName: config.name,
        tacticKey: tacticKey,
        filledFields: filled.map(f => f.name),
        missingFields: missing.map(f => f.name)
      });

    } catch (error) {
      Logger.log(`Error creating ${tacticKey} tactic: ${error.message}`);
    }
  }

  if (!anyDataFound) {
    Logger.log('WARNING: No tactic data found in any row. The respondent submitted a field plan with zero tactic goals.');
  }

  tactics.incomplete = incomplete;
  tactics.noTacticsAtAll = !anyDataFound;
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
  const sheet = getSheet(sheetName);
  return sheet.getLastRow();
}

// Function to check for new rows and process them
function checkForNewRows() {
  try {
    const sheetName = scriptProps.getProperty('SHEET_FIELD_PLAN');
    const sheet = getSheet(sheetName);
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
  const budgetSheet = getSheet(budgetSheetName);
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
    const sheet = getSheet(sheetName);
    const currentLastRow = sheet.getLastRow();

    let successCount = 0;
    let errorCount = 0;

    // Process ALL rows (starting from row 2 to skip header)
    for (let rowNumber = 2; rowNumber <= currentLastRow; rowNumber++) {
      try {
        const fieldPlan = FieldPlan.fromSpecificRow(rowNumber);
        Logger.log(`Processing row ${rowNumber}: ${fieldPlan.memberOrgName}`);

        // Send email with field plan details
        sendFieldPlanEmail(fieldPlan, rowNumber, isTestMode);

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

/**
 * Installable onEdit trigger handler for reprocessing rows.
 * 
 * When a user checks the "Reprocess" checkbox on a field plan or budget,
 * this function detects the edit, calls the appropriate reprocess function,
 * and unchecks when done.
 * 
 * Set up the trigger by running createReprocessTrigger() once.
 * This must be an installable trigger because of the MailApp authorization
 * 
 * @param {Object} e - The onEdit event object from Google Sheets
 * @param {Range} e.range - The edited cell
 * @param {String} e.value - The new value of the edited cell
 * @param {Spreadsheet} e.source - The spreadsheet
 */
function onSpreadsheetEdit(e) {
  const sheet = e.range.getSheet();
  const sheetName = sheet.getName();
  const row = e.range.getRow();
  const col = e.range.getColumn();

  const fieldPlanSheetName = scriptProps.getProperty('SHEET_FIELD_PLAN');
  const budgetSheetName = scriptProps.getProperty('SHEET_FIELD_BUDGET');

  //col is 1-indexed in Sheets, REPROCESS is 0-indexed, so add 1
  if (sheetName === fieldPlanSheetName && col === FIELD_PLAN_COLUMNS.REPROCESS + 1 && e.value === 'TRUE' && row > 1) {
    reprocessFieldPlanRow(row);
    e.range.setValue(false);
  }

  // Budget reprocess
  if (sheetName === budgetSheetName && col === BUDGET_COLUMNS.REPROCESS + 1 && e.value === 'TRUE' && row > 1) {
    reprocessBudgetRow(row);
    e.range.setValue(false);
  }

  // Query builder reprocess
  if (sheetName === fieldPlanSheetName && col === FIELD_PLAN_COLUMNS.REPROCESS_QUERIES + 1 && e.value === 'TRUE' && row > 1) {
    reprocessQueryBuilderRow(row);
    e.range.setValue(false);
  }
}

/**
 * Reprocesses a single field plan row by row number
 * 
 * This does the same work as checkForNewRows() for a single row
 * 
 * @param {number} rowNumber - The 1-indexed spreadsheet row number
 */
function reprocessFieldPlanRow(rowNumber) {
  try {
    const fieldPlan = FieldPlan.fromSpecificRow(rowNumber);
    Logger.log('Reprocessing field plan row ' + rowNumber + ': ' + fieldPlan.memberOrgName);
    sendFieldPlanEmail(fieldPlan, rowNumber);
    onFieldPlanSubmission(fieldPlan);
    Logger.log('Reprocess complete for field plan row ' + rowNumber);
  } catch (error) {
    Logger.log('Error reprocessing field plan row ' + rowNumber + ': ' + error.message);
  }
}

/**
 * Reprocesses a single budget row by row number.
 *
 * This does the same work as analyzeBudgets() for a single row:
 * 1. Reads the row data from the budget sheet
 * 2. Creates a FieldBudget object
 * 3. Calls processBudget() to run the cost analysis and send the email
 *
 * @param {number} rowNumber - The 1-indexed spreadsheet row number
 */
function reprocessBudgetRow(rowNumber) {
  try {
    const budgetSheet = getSheet(scriptProps.getProperty('SHEET_FIELD_BUDGET'));
    const data = budgetSheet.getDataRange().getValues();
    const budget = new FieldBudget(data[rowNumber - 1]);
    const budgetData = { budget: budget, rowNumber: rowNumber };
    Logger.log('Reprocessing budget row ' + rowNumber + ': ' + budget.memberOrgName);
    processBudget(budgetData, false);
    Logger.log('Reprocess complete for budget row ' + rowNumber);
  } catch (error) {
    Logger.log('Error reprocessing budget row ' + rowNumber + ': ' + error.message);
  }
}

/**
 * Reprocesses query builder output for a single field plan row.
 * @param {number} rowNumber - The 1-indexed spreadsheet row number
 * @example reprocessQueryBuilderRow(5)
 *   // => re-runs generateQueriesForFieldPlan for row 5, overwrites query_queue rows and summary
 * @example reprocessQueryBuilderRow(2)
 *   // => logs error if row 2 has no field plan data
 */
function reprocessQueryBuilderRow(rowNumber) {
  try {
    const fieldPlan = FieldPlan.fromSpecificRow(rowNumber);
    Logger.log(`Reprocessing query builder for row ${rowNumber}: ${fieldPlan.memberOrgName}`);
    const result = generateQueriesForFieldPlan(fieldPlan, rowNumber);
    Logger.log(`Query builder reprocess complete for row ${rowNumber}: ${result.queryCount} queries, ${result.errors.length} errors`);
  } catch (error) {
    Logger.log(`Error reprocessing query builder row ${rowNumber}: ${error.message}`);
  }
}
