/**
 * Test function to analyze the most recent field plan and send a test email
 * Automatically sends to the currently logged-in user
 * Uses the exact same email formatting as the production system
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
    
    // Temporarily override the MailApp.sendEmail method to redirect the email
    const originalSendEmail = MailApp.sendEmail;
    
    // Replace the sendEmail function with our version that only changes the recipient
    MailApp.sendEmail = function(emailOptions) {
      // If this is an object with multiple parameters
      if (typeof emailOptions === 'object' && emailOptions !== null) {
        // Only modify the recipient, leave everything else exactly as is
        const testOptions = {...emailOptions};
        testOptions.to = userEmail;
        
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
      Logger.log(`Test email sent successfully to current user: ${userEmail}`);
      
      return {
        success: true,
        message: `Test email sent successfully to your email: ${userEmail}`,
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
    .addItem('Test Most Recent Entry', 'testMostRecentFieldPlan')
    .addToUi();
}