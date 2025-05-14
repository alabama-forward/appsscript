/**
 * Test function to analyze the most recent field plan and send a test email
 * Automatically sends to the currently logged-in user
 * @return {object} Status of the test operation
 */
function testMostRecentFieldPlan() {
  try {
    Logger.log("Starting test of most recent field plan entry...");

    // Get the most recent field plan from the last row
    const fieldPlan = FieldPlan.fromLastRow();

    if (!fieldPlan) {
      throw new Error("Could not retrieve the most recent field plan");
    }

    Logger.log(`Retrieved field plan for: ${fieldPlan.memberOrgName}`);

    // Get current user's email
    const userEmail = Session.getActiveUser().getEmail();
    Logger.log(`Current user email: ${userEmail}`);

    // Create a modified version of sendFieldPlanEmail that uses the current user
    const sendTestEmail = function(fieldPlan, currentUserEmail) {
      // Call the original function with a modified recipient
      const originalSendEmail = MailApp.sendEmail;

      // Override the MailApp.sendEmail method temporarily
      MailApp.sendEmail = function(emailOptions) {
        // Use the current user instead of the configured recipients
        const testEmailOptions = {...emailOptions};
        testEmailOptions.to = currentUserEmail;
        testEmailOptions.subject = `[TEST] ${emailOptions.subject}`;

        // Add a test header to the email body
        testEmailOptions.htmlBody = `
          <div style="background-color: #FFEB3B; padding: 10px; margin-bottom: 20px; border-radius: 5px;">
            <h2>⚠️ TEST EMAIL ⚠️</h2>
            <p>This is a test email from field plan analysis.</p>
            <p>Sent to: ${currentUserEmail}</p>
            <p>Timestamp: ${new Date().toLocaleString()}</p>
          </div>
        ` + emailOptions.htmlBody;

        // Call the original sendEmail with the modified options
        return originalSendEmail.call(MailApp, testEmailOptions);
      };

      try {
        // Call the existing function to send the email with the overridden MailApp
        sendFieldPlanEmail(fieldPlan);
        Logger.log(`Test email sent successfully to current user: ${currentUserEmail}`);
      } finally {
        // Restore the original sendEmail function
        MailApp.sendEmail = originalSendEmail;
      }
    };

    // Send the test email to the current user
    sendTestEmail(fieldPlan, userEmail);

    return {
      success: true,
      message: `Test email sent successfully to your email: ${userEmail}`,
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
    .addItem('Test Most Recent Entry', 'testMostRecentFieldPlan')
    .addToUi();
}