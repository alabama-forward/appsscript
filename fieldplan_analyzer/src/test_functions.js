/**
 * Test function to analyze the most recent field plan and send a test email
 * @param {string} emailRecipient - Email address to send the test to (optional)
 * @return {object} Status of the test operation
 */
function testMostRecentFieldPlan(emailRecipient) {
  try {
    Logger.log("Starting test of most recent field plan entry...");
    
    // Get the most recent field plan from the last row
    const fieldPlan = FieldPlan.fromLastRow();
    
    if (!fieldPlan) {
      throw new Error("Could not retrieve the most recent field plan");
    }
    
    Logger.log(`Retrieved field plan for: ${fieldPlan.memberOrgName}`);
    
    // Create a modified version of sendFieldPlanEmail that uses the test recipient
    const sendTestEmail = function(fieldPlan, testEmailRecipient) {
      // Call the original function with a modified recipient
      const originalSendEmail = MailApp.sendEmail;
      
      // Override the MailApp.sendEmail method temporarily
      MailApp.sendEmail = function(emailOptions) {
        // Use the test recipient instead of the configured recipients
        const testEmailOptions = {...emailOptions};
        testEmailOptions.to = testEmailRecipient;
        testEmailOptions.subject = `[TEST] ${emailOptions.subject}`;
        
        // Add a test header to the email body
        testEmailOptions.htmlBody = `
          <div style="background-color: #FFEB3B; padding: 10px; margin-bottom: 20px; border-radius: 5px;">
            <h2>⚠️ TEST EMAIL ⚠️</h2>
            <p>This is a test email sent from the testMostRecentFieldPlan function.</p>
            <p>Timestamp: ${new Date().toLocaleString()}</p>
          </div>
        ` + emailOptions.htmlBody;
        
        // Call the original sendEmail with the modified options
        return originalSendEmail.call(MailApp, testEmailOptions);
      };
      
      try {
        // Call the existing function to send the email with the overridden MailApp
        sendFieldPlanEmail(fieldPlan);
        Logger.log(`Test email sent successfully to: ${testEmailRecipient}`);
      } finally {
        // Restore the original sendEmail function
        MailApp.sendEmail = originalSendEmail;
      }
    };
    
    // Determine the recipient email
    const testRecipient = emailRecipient || Session.getActiveUser().getEmail();
    
    // Send the test email
    sendTestEmail(fieldPlan, testRecipient);
    
    return {
      success: true,
      message: `Test email sent successfully to: ${testRecipient}`,
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