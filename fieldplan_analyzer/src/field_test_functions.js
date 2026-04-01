/**
 * Test function to analyze the most recent field plan and send a test email.
 * Sends to datateam@alforward.org via isTestMode, using the same email
 * formatting as the production system.
 *
 * @return {object} Status of the test operation
 */
function testMostRecentFieldPlan() {
  try {
    Logger.log("Starting test of most recent field plan entry...");

    const fieldPlan = FieldPlan.fromLastRow();
    if (!fieldPlan) {
      throw new Error("Could not retrieve the most recent field plan");
    }

    Logger.log(`Retrieved field plan for: ${fieldPlan.memberOrgName}`);

    const sheet = getSheet(scriptProps.getProperty('SHEET_FIELD_PLAN'));
    const lastRowNumber = sheet.getLastRow();

    sendFieldPlanEmail(fieldPlan, lastRowNumber, true);
    Logger.log(`Test email sent successfully to: datateam@alforward.org`);

    return {
      success: true,
      message: `Test email sent successfully to: datateam@alforward.org`,
      organization: fieldPlan.memberOrgName,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    Logger.log(`Error in testMostRecentFieldPlan: ${error.message}`);
    Logger.log(`Error stack: ${error.stack}`);

    return {
      success: false,
      error: error.message,
      stack: error.stack
    };
  }
}

/**
 * Menu function to make the test accessible from the spreadsheet UI
 */
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Field Plan Tests')
    .addItem('Test Most Recent Entry', 'promptForTestEmail')
    .addSeparator()
    .addSubMenu(ui.createMenu('Budget Analyzer Debug')
      .addItem('Debug Matching Issue', 'debugMatchingIssue')
      .addItem('Test Enhanced Matching', 'testEnhancedMatching')
      .addItem('Run All Budget Tests', 'runAllBudgetTests'))
    .addSeparator()
    .addSubMenu(ui.createMenu('Query Builder Tests')
      .addItem('Test Config', 'testQueryConfig')
      .addItem('Test VAN ID Resolution', 'testResolveVanId')
      .addItem('Test County Resolution', 'testResolveCountyName')
      .addItem('Test Precinct Resolution', 'testResolvePrecinctCode')
      .addItem('Test SQL Generation', 'testBuildMetadataQuery')
      .addItem('Test End-to-End (Last Row)', 'testGenerateQueriesForLastRow')
      .addItem('Test Query Email (Test Mode)', 'testQueryEmail')
      .addItem('Test Service Account Token', 'testServiceAccountToken')
      .addItem('Run All Query Builder Tests', 'runAllQueryBuilderTests'))
    .addSeparator()
    .addSubMenu(ui.createMenu('Reprocess Setup')
      .addItem('Create Reprocess Trigger', 'createReprocessTrigger')
      .addItem('Setup Reprocess Columns', 'setupReprocessColumns')
      .addItem('Setup Query Builder Column', 'setupQueryBuilderColumn'))
    .addToUi();
}

/**
 * Menu handler that runs testMostRecentFieldPlan and reports the result.
 * Test emails always go to datateam@alforward.org via isTestMode.
 */
function promptForTestEmail() {
  const ui = SpreadsheetApp.getUi();
  const result = testMostRecentFieldPlan();

  if (result.success) {
    ui.alert('Success', result.message, ui.ButtonSet.OK);
  } else {
    ui.alert('Error', `Failed to send test email: ${result.error}`, ui.ButtonSet.OK);
  }
}

// ============================================
// TEST FUNCTIONS FOR FIELD PLAN FUNCTIONALITY
// ============================================

/**
 * Test the missing budget notification email
 * This will send a test email to the data team only
 */
function testMissingBudgetNotification() {
  Logger.log('Testing missing budget notification...');
  sendMissingBudgetNotification('Test Organization ABC', true);
  Logger.log('Test email sent. Check datateam@alforward.org inbox.');
}

/**
 * Test tracking a field plan without a budget
 * This simulates what happens when a field plan is processed without a matching budget
 */
function testTrackMissingBudget() {
  // Create a test field plan object
  const testFieldPlan = {
    memberOrgName: 'Test Missing Budget Org',
    submissionDateTime: new Date().toISOString()
  };
  
  Logger.log('Testing missing budget tracking...');
  
  // Track the missing budget
  trackMissingBudget(testFieldPlan);
  
  // Verify it was tracked
  const properties = PropertiesService.getScriptProperties();
  const key = `MISSING_BUDGET_${testFieldPlan.memberOrgName}`;
  const tracked = properties.getProperty(key);
  
  if (tracked) {
    Logger.log(`✓ Successfully tracked missing budget for ${testFieldPlan.memberOrgName}`);
    Logger.log(`  Timestamp: ${tracked}`);
  } else {
    Logger.log(`✗ Failed to track missing budget for ${testFieldPlan.memberOrgName}`);
  }
}

/**
 * Test the entire missing budget alert flow
 * This sets up a test scenario with a field plan that's been waiting 73 hours
 */
function testMissingBudgetAlertFlow() {
  const testOrgName = 'Test Alert Flow Org';
  const properties = PropertiesService.getScriptProperties();
  const key = `MISSING_BUDGET_${testOrgName}`;
  
  Logger.log('Testing missing budget alert flow...');
  
  // Set up a timestamp from 73 hours ago
  const oldTimestamp = new Date();
  oldTimestamp.setHours(oldTimestamp.getHours() - 73);
  properties.setProperty(key, oldTimestamp.toISOString());
  Logger.log(`Set up test org with timestamp from 73 hours ago`);
  
  // Run the check function (this should trigger an email)
  checkForMissingBudgets();
  
  // Verify the tracking was removed
  const stillTracked = properties.getProperty(key);
  if (!stillTracked) {
    Logger.log(`✓ Tracking successfully removed after alert`);
  } else {
    Logger.log(`✗ Tracking still exists: ${stillTracked}`);
  }
}

/**
 * Test finding a matching budget
 * This tests the budget matching logic
 */
function testFindMatchingBudget() {
  const budgetSheet = getSheet(scriptProps.getProperty('SHEET_FIELD_BUDGET'));
  const data = budgetSheet.getDataRange().getValues();

  if (data.length > 1) {
    // Test with the first organization in the budget sheet
    const testOrgName = data[1][FieldBudget.COLUMNS.MEMBERNAME];
    Logger.log(`Testing budget match for: ${testOrgName}`);
    
    const match = findMatchingBudget(testOrgName);
    if (match) {
      Logger.log(`✓ Found matching budget:`);
      Logger.log(`  Organization: ${match.budget.memberOrgName}`);
      Logger.log(`  Row: ${match.rowNumber}`);
      Logger.log(`  Analyzed: ${match.analyzed}`);
    } else {
      Logger.log(`✗ No match found for ${testOrgName}`);
    }
    
    // Test with a non-existent organization
    const noMatch = findMatchingBudget('Non-Existent Organization XYZ');
    if (!noMatch) {
      Logger.log(`✓ Correctly returned null for non-existent organization`);
    } else {
      Logger.log(`✗ Incorrectly found match for non-existent organization`);
    }
  } else {
    Logger.log('No budget data available for testing');
  }
}

/**
 * Test the budget submission callback
 * This simulates what happens when a budget is submitted for an org with a waiting field plan
 */
function testOnBudgetSubmission() {
  const testOrgName = 'Test Budget Submission Org';
  const properties = PropertiesService.getScriptProperties();
  const key = `MISSING_BUDGET_${testOrgName}`;
  
  Logger.log('Testing budget submission callback...');
  
  // First, set up tracking
  properties.setProperty(key, new Date().toISOString());
  Logger.log(`Set up missing budget tracking for ${testOrgName}`);
  
  // Create a test budget object
  const testBudget = {
    memberOrgName: testOrgName
  };
  
  // Call the function
  onBudgetSubmission(testBudget);
  
  // Verify tracking was removed
  const stillTracked = properties.getProperty(key);
  if (!stillTracked) {
    Logger.log(`✓ Successfully removed tracking for ${testOrgName}`);
  } else {
    Logger.log(`✗ Tracking still exists for ${testOrgName}`);
  }
}

/**
 * View all current missing budget/plan trackings
 * This helps debug what's currently being tracked
 */
function viewAllMissingTrackings() {
  const properties = PropertiesService.getScriptProperties();
  const allProps = properties.getProperties();
  
  Logger.log('=== Current Missing Document Trackings ===');
  
  let missingBudgets = [];
  let missingPlans = [];
  
  for (const key in allProps) {
    if (key.startsWith('MISSING_BUDGET_')) {
      const orgName = key.replace('MISSING_BUDGET_', '');
      const timestamp = new Date(allProps[key]);
      const hoursAgo = Math.floor((new Date() - timestamp) / (1000 * 60 * 60));
      missingBudgets.push({ org: orgName, hoursAgo: hoursAgo, timestamp: allProps[key] });
    } else if (key.startsWith('MISSING_PLAN_')) {
      const orgName = key.replace('MISSING_PLAN_', '');
      const timestamp = new Date(allProps[key]);
      const hoursAgo = Math.floor((new Date() - timestamp) / (1000 * 60 * 60));
      missingPlans.push({ org: orgName, hoursAgo: hoursAgo, timestamp: allProps[key] });
    }
  }
  
  Logger.log(`\nField Plans Missing Budgets (${missingBudgets.length}):`);
  missingBudgets.forEach(item => {
    Logger.log(`  - ${item.org}: ${item.hoursAgo} hours ago`);
  });
  
  Logger.log(`\nBudgets Missing Field Plans (${missingPlans.length}):`);
  missingPlans.forEach(item => {
    Logger.log(`  - ${item.org}: ${item.hoursAgo} hours ago`);
  });
}

/**
 * Clear all test tracking entries
 * Use this to clean up after testing
 */
function clearTestTrackings() {
  const properties = PropertiesService.getScriptProperties();
  const allProps = properties.getProperties();
  const testOrgs = ['Test Missing Budget Org', 'Test Alert Flow Org', 'Test Budget Submission Org'];
  
  Logger.log('Clearing test tracking entries...');
  
  for (const key in allProps) {
    if (key.startsWith('MISSING_BUDGET_') || key.startsWith('MISSING_PLAN_')) {
      const orgName = key.replace(/MISSING_(BUDGET|PLAN)_/, '');
      if (testOrgs.includes(orgName) || orgName.includes('Test')) {
        properties.deleteProperty(key);
        Logger.log(`  Cleared: ${key}`);
      }
    }
  }
  
  Logger.log('Test tracking entries cleared.');
}

// Test that tactic analysis uses correct organization names
function testTacticOrganizationNames() {
  Logger.log("=== TESTING TACTIC ORGANIZATION NAMES ===");
  
  try {
    const sheet = getSheet(scriptProps.getProperty('SHEET_FIELD_PLAN'));
    const lastRow = sheet.getLastRow();

    // Test with a specific row (not the last one)
    const testRow = Math.max(2, lastRow - 1); // Use second to last row if available
    
    const fieldPlan = FieldPlan.fromSpecificRow(testRow);
    Logger.log(`Testing with field plan from row ${testRow}: ${fieldPlan.memberOrgName}`);
    
    // Get the row data for this specific row
    const rowData = sheet.getRange(testRow, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Create tactic instances
    const tactics = getTacticInstances(rowData);
    
    Logger.log(`Found ${tactics.length} tactics for ${fieldPlan.memberOrgName}`);
    
    // Check each tactic to ensure it has the correct org name
    let allCorrect = true;
    tactics.forEach((tactic, index) => {
      const tacticOrgName = tactic._memberOrgName || tactic.memberOrgName;
      Logger.log(`Tactic ${index + 1} (${tactic._name}): Organization = ${tacticOrgName}`);
      
      if (tacticOrgName !== fieldPlan.memberOrgName) {
        Logger.log(`❌ MISMATCH: Tactic has '${tacticOrgName}' but should be '${fieldPlan.memberOrgName}'`);
        allCorrect = false;
      }
    });
    
    if (allCorrect) {
      Logger.log("✅ All tactics have correct organization name");
    } else {
      Logger.log("❌ Some tactics have incorrect organization names");
    }
    
  } catch (error) {
    Logger.log(`❌ Error testing tactic organization names: ${error.message}`);
    Logger.log(`Stack trace: ${error.stack}`);
  }
}

// Test processing all field plans
function testProcessAllFieldPlans() {
  Logger.log("=== TESTING PROCESS ALL FIELD PLANS ===");
  Logger.log("This will send test emails for ALL field plans to datateam@alforward.org");
  
  try {
    const results = processAllFieldPlans(true); // true = test mode
    Logger.log(`✅ Test completed - Processed ${results.success} field plans with ${results.errors} errors`);
  } catch (error) {
    Logger.log(`❌ Error: ${error.message}`);
  }
}

// Test processing all budgets
function testProcessAllBudgets() {
  Logger.log("=== TESTING PROCESS ALL BUDGETS ===");
  Logger.log("This will send test emails for ALL budgets to datateam@alforward.org");
  
  try {
    const results = processAllBudgets(true); // true = test mode
    Logger.log(`✅ Test completed - Processed ${results.success} budgets, skipped ${results.skipped}, with ${results.errors} errors`);
  } catch (error) {
    Logger.log(`❌ Error: ${error.message}`);
  }
}

// Test reprocessing everything
function testReprocessAllAnalyses() {
  Logger.log("=== TESTING REPROCESS ALL ANALYSES ===");
  Logger.log("This will process ALL field plans and budgets in test mode");
  
  try {
    const results = reprocessAllAnalyses(true); // true = test mode
    Logger.log("✅ Test completed");
    Logger.log(`Field Plans: ${results.fieldPlans.success} success, ${results.fieldPlans.errors} errors`);
    Logger.log(`Budgets: ${results.budgets.success} success, ${results.budgets.skipped} skipped, ${results.budgets.errors} errors`);
  } catch (error) {
    Logger.log(`❌ Error: ${error.message}`);
  }
}

/**
 * Run all tests in sequence
 * This provides a comprehensive test of all new functionality
 */
function runAllFieldPlanTests() {
  Logger.log('===== Running All Field Plan Tests =====\n');
  
  Logger.log('1. Testing Budget Matching...');
  testFindMatchingBudget();
  Logger.log('');
  
  Logger.log('2. Testing Missing Budget Tracking...');
  testTrackMissingBudget();
  Logger.log('');
  
  Logger.log('3. Testing Budget Submission Callback...');
  testOnBudgetSubmission();
  Logger.log('');
  
  Logger.log('4. Testing Missing Budget Notification Email...');
  testMissingBudgetNotification();
  Logger.log('');
  
  Logger.log('5. Testing Weekly Summary Email...');
  testCombinedWeeklySummary();
  Logger.log('');
  
  Logger.log('6. Viewing All Current Trackings...');
  viewAllMissingTrackings();
  Logger.log('');
  
  Logger.log('7. Cleaning Up Test Data...');
  clearTestTrackings();
  Logger.log('');
  
  Logger.log('===== All Tests Complete =====');
  Logger.log('Check datateam@alforward.org for test emails');
}

function testFieldTargetsSummaryEmail() {
  //Temporarily use test recipients
  const originalRecipients = scriptProps.getProperty('EMAIL_RECIPIENTS');

  scriptProps.setProperty('EMAIL_RECIPIENTS', 'datateam@alforward.org');

  sendFieldPlanTargetsSummary();

  //Restore original recipients
  scriptProps.setProperty('EMAIL_RECIPIENTS', originalRecipients);
}

function testColumnMappings() {
  const results = validateColumnMappings();

  Logger.log('=== Column Mapping Validation ===');
  Logger.log(`Status: ${results.valid ? '✅ VALID' : '❌ ERRORS FOUND'}`);

  if (results.errors.length > 0) {
    Logger.log('\n❌ ERRORS:');
    results.errors.forEach(err => Logger.log(`   ${err}`));
  }

  if (results.warnings.length > 0) {
    Logger.log('\n⚠️ WARNINGS:');
    results.warnings.forEach(warn => Logger.log(`   ${warn}`));
  }

  Logger.log('\n📊 STATS:');
  Logger.log(`   Field Plan Columns: ${results.stats.totalFieldPlanColumns}`);
  Logger.log(`   Program Columns: ${results.stats.totalProgramColumns}`);
  Logger.log(`   Total Mapped: ${results.stats.totalMappedColumns}`);
  Logger.log(`   Field Plan Range: ${results.stats.fieldPlanRange}`);
  Logger.log(`   Program Range: ${results.stats.programRange}`);

  return results.valid;
}

function runColumnMappingTests() {
  Logger.log('=== RUNNING COLUMN MAPPING TESTS ===\n');

  // Test 1: Validation
  Logger.log('TEST 1: Validation');
  const isValid = testColumnMappings();
  Logger.log(`Result: ${isValid ? '✅ PASS' : '❌ FAIL'}\n`);

  // Test 2: Summary
  Logger.log('TEST 2: Summary');
  logColumnMappingSummary();
  Logger.log('✅ PASS\n');

  // Test 3: Reverse Lookup
  Logger.log('TEST 3: Reverse Lookup');
  const tests = [0, 1, 2, 37, 65, 72, 999];
  tests.forEach(idx => {
    const name = getColumnNameByIndex(idx);
    Logger.log(`  Column ${idx}: ${name}`);
  });
  Logger.log('✅ PASS\n');

  // Test 4: Read actual data
  Logger.log('TEST 4: Read Real Data');
  try {
    const sheet = getSheet(scriptProps.getProperty('SHEET_FIELD_PLAN'));
    if (sheet && sheet.getLastRow() > 1) {
      const data = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];

      // Test a few key fields
      Logger.log(`  Organization: ${data[FIELD_PLAN_COLUMNS.MEMBERNAME]}`);
      Logger.log(`  Attended Training: ${data[FIELD_PLAN_COLUMNS.ATTENDEDTRAINING]}`);
      Logger.log(`  Phone Length: ${data[PROGRAM_COLUMNS.PHONE.PROGRAMLENGTH]}`);
      Logger.log('✅ PASS\n');
    } else {
      Logger.log('⚠️ SKIP - No data in sheet\n');
    }
  } catch (error) {
    Logger.log(`❌ FAIL - ${error.message}\n`);
  }

  Logger.log('=== TESTS COMPLETE ===');
}

/**
 * Creates the installable onEdit trigger for the reprocess checkboxes.
 *
 * Run this ONCE from the Apps Script editor. It creates an installable
 * onEdit trigger that calls onSpreadsheetEdit(e) whenever any cell is edited.
 * The function checks if the trigger already exists to avoid duplicates.
 *
 * Why installable (not simple)?
 * Simple onEdit triggers run in a restricted scope — they cannot call
 * MailApp, UrlFetchApp, or other services that require authorization.
 * Since reprocessing sends emails, we need an installable trigger.
 */
function createReprocessTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  const exists = triggers.some(function(t) {
    return t.getHandlerFunction() === 'onSpreadsheetEdit';
  });

  if (exists) {
    Logger.log('Reprocess trigger already exists — no action taken');
    return;
  }

  ScriptApp.newTrigger('onSpreadsheetEdit')
    .forSpreadsheet(getSpreadsheet())
    .onEdit()
    .create();
  Logger.log('Reprocess trigger created successfully');
}

/**
 * Adds "Reprocess" checkbox columns to both the field plan and budget sheets.
 *
 * Run this ONCE from the Apps Script editor (or from the menu).
 * It adds:
 *   - A "Reprocess" header in the correct column on each sheet
 *   - Checkbox data validation (TRUE/FALSE) for all data rows
 *
 * Safe to run multiple times — it overwrites the header and re-applies validation.
 */
function setupReprocessColumns() {
  // --- Field Plan Sheet ---
  const fieldPlanSheetName = scriptProps.getProperty('SHEET_FIELD_PLAN');
  const fieldPlanSheet = getSheet(fieldPlanSheetName);
  const fpCol = FIELD_PLAN_COLUMNS.REPROCESS + 1; // Convert 0-indexed to 1-indexed
  const fpLastRow = fieldPlanSheet.getLastRow();

  // Set header
  fieldPlanSheet.getRange(1, fpCol).setValue('Reprocess Plan');

  // Add checkbox validation to all data rows
  if (fpLastRow > 1) {
    const fpRange = fieldPlanSheet.getRange(2, fpCol, fpLastRow - 1, 1);
    const fpValidation = SpreadsheetApp.newDataValidation()
      .requireCheckbox()
      .build();
    fpRange.setDataValidation(fpValidation);
    fpRange.setValue(false); // Initialize all as unchecked
  }

  Logger.log('Field plan Reprocess column set up in column ' + fpCol + ' (' + fpLastRow + ' rows)');

  // --- Budget Sheet ---
  const budgetSheetName = scriptProps.getProperty('SHEET_FIELD_BUDGET');
  const budgetSheet = getSheet(budgetSheetName);
  const budgetCol = BUDGET_COLUMNS.REPROCESS + 1;
  const budgetLastRow = budgetSheet.getLastRow();

  // Set header
  budgetSheet.getRange(1, budgetCol).setValue('Reprocess Budget');

  // Add checkbox validation to all data rows
  if (budgetLastRow > 1) {
    const budgetRange = budgetSheet.getRange(2, budgetCol, budgetLastRow - 1, 1);
    const budgetValidation = SpreadsheetApp.newDataValidation()
      .requireCheckbox()
      .build();
    budgetRange.setDataValidation(budgetValidation);
    budgetRange.setValue(false);
  }

  Logger.log('Budget Reprocess column set up in column ' + budgetCol + ' (' + budgetLastRow + ' rows)');

  // --- Field Plan Query Builder Reprocess ---
  const qbCol = FIELD_PLAN_COLUMNS.REPROCESS_QUERIES + 1;

  fieldPlanSheet.getRange(1, qbCol).setValue('Reprocess Queries');

  if (fpLastRow > 1) {
    const qbRange = fieldPlanSheet.getRange(2, qbCol, fpLastRow - 1, 1);
    const qbValidation = SpreadsheetApp.newDataValidation()
      .requireCheckbox()
      .build();
    qbRange.setDataValidation(qbValidation);
    qbRange.setValue(false);
  }

  Logger.log('Query builder Reprocess column set up in column ' + qbCol + ' (' + fpLastRow + ' rows)');
}

function testProgramDays() {
  const fp = FieldPlan.fromLastRow();
  Logger.log(`programDates: ${fp.programDates}`);
  Logger.log(`programDays: ${fp.programDays}`);
}

function testWeeksVsDaysCheck() {
  const fp = FieldPlan.fromLastRow();
  const sheet = getSheet(scriptProps.getProperty('SHEET_FIELD_PLAN'));
  const rowData = sheet.getRange(sheet.getLastRow(), 1, 1, sheet.getLastColumn()).getValues()[0];
  const programDays = fp.programDays;

  Logger.log(`Program days: ${programDays}`);

  Object.entries(TACTIC_CONFIG).forEach(([key, config]) => {
    const weeks = rowData[PROGRAM_COLUMNS[config.columnKey].PROGRAMLENGTH];
    if (!weeks) return;

    const tacticDays = weeks * 7;
    const difference = Math.abs(tacticDays - programDays);
    const status = difference > 14 ? 'MISMATCH' : 'Aligned';
    Logger.log(`${config.name}: ${weeks} weeks (${tacticDays} days) — ${status} (${difference}-day difference)`);
  });
}