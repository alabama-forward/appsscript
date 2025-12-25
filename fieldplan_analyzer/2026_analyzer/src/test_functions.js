/**
 * Test function to analyze the most recent field plan and send a test email
 * Sends to a specified test email or uses a default test email (datateam@alforward.org)
 * Uses the exact same email formatting as the production system
 * Note: This function overrides the sendFieldPlanEmail recipient to ensure test emails
 * only go to the specified test address, never to production recipients
 * @param {string} testEmail - Optional email address to send the test to
 * @return {object} Status of the test operation
 */
function testMostRecentFieldPlan(testEmail) {
  try {
    Logger.log("Starting test of most recent field plan entry...");

    // Get the most recent field plan from the last row
    const fieldPlan = FieldPlan.fromLastRow();

    if (!fieldPlan) {
      throw new Error("Could not retrieve the most recent field plan");
    }

    Logger.log(`Retrieved field plan for: ${fieldPlan.memberOrgName}`);

    // Use provided test email or fall back to a default
    const recipientEmail = testEmail || "datateam@alforward.org";
    Logger.log(`Test will send email to: ${recipientEmail}`);

    // Temporarily override the MailApp.sendEmail method to redirect the email
    const originalSendEmail = MailApp.sendEmail;

    // Replace the sendEmail function with our version that only changes the recipient
    MailApp.sendEmail = function(emailOptions) {
      // If this is an object with multiple parameters
      if (typeof emailOptions === 'object' && emailOptions !== null) {
        // Only modify the recipient, leave everything else exactly as is
        const testOptions = {...emailOptions};
        testOptions.to = recipientEmail;

        // Mark it as a test in the subject only
        if (testOptions.subject) {
          testOptions.subject = `[TEST] ${testOptions.subject}`;
        }

        // Call the original sendEmail with modified recipient only
        return originalSendEmail.call(MailApp, testOptions);
      }

      // For other forms of the sendEmail call, pass through unchanged
      return originalSendEmail.apply(MailApp, arguments);
    };

    try {
      // Get the last row number for the field plan
      const sheet = SpreadsheetApp.getActive().getSheetByName('2025_field_plan');
      const lastRowNumber = sheet.getLastRow();
      
      // Call the existing function to send the email
      sendFieldPlanEmail(fieldPlan, lastRowNumber);
      Logger.log(`Test email sent successfully to: ${recipientEmail}`);

      return {
        success: true,
        message: `Test email sent successfully to: ${recipientEmail}`,
        organization: fieldPlan.memberOrgName,
        timestamp: new Date().toISOString()
      };
    } finally {
      // Always restore the original email function, even if an error occurs
      MailApp.sendEmail = originalSendEmail;
    }
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
    .addToUi();
}

/**
 * Prompts the user for an email address and then runs the test
 */
function promptForTestEmail() {
  const ui = SpreadsheetApp.getUi();
  const response = ui.prompt(
    'Test Field Plan Email',
    'Enter the email address to send the test to:',
    ui.ButtonSet.OK_CANCEL
  );

  // Check if the user clicked "OK"
  if (response.getSelectedButton() == ui.Button.OK) {
    const email = response.getResponseText().trim();

    // Validate the email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && emailRegex.test(email)) {
      // Run the test with the provided email
      const result = testMostRecentFieldPlan(email);

      // Show a confirmation message
      if (result.success) {
        ui.alert('Success', `Test email sent to: ${email}`, ui.ButtonSet.OK);
      } else {
        ui.alert('Error', `Failed to send test email: ${result.error}`, ui.ButtonSet.OK);
      }
    } else {
      ui.alert('Invalid Email', 'Please enter a valid email address.', ui.ButtonSet.OK);
    }
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
  const budgetSheet = SpreadsheetApp.getActive().getSheetByName('2025_field_budget');
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
    const sheet = SpreadsheetApp.getActive().getSheetByName('2025_field_plan');
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