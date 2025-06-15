/**
 * Test function to analyze the most recent field plan and send a test email
 * Sends to a specified test email or uses a default test email
 * Uses the exact same email formatting as the production system
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
      // Call the existing function to send the email
      sendFieldPlanEmail(fieldPlan);
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