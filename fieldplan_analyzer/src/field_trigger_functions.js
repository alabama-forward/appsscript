// Email configuration (shared with budget_trigger_functions.js)
const scriptProps = PropertiesService.getScriptProperties();
const EMAIL_CONFIG = {
  recipients: (scriptProps.getProperty('EMAIL_RECIPIENTS') || 'gabri@alforward.org,sherri@alforward.org,khadidah@alforward.org,deanna@alforward.org,datateam@alforward.org').split(','),
  testRecipients: (scriptProps.getProperty('EMAIL_TEST_RECIPIENTS') || 'datateam@alforward.org').split(','),
  replyTo: scriptProps.getProperty('EMAIL_REPLY_TO') || 'datateam@alforward.org'
};

// Helper function to get email recipients based on mode
function getEmailRecipients(isTestMode = false) {
  return isTestMode ? EMAIL_CONFIG.testRecipients : EMAIL_CONFIG.recipients;
}

//Sheet error handling function
function getSheet(sheetName) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`Sheet '${sheetName}' not found. 
      Please check sheet reference`);
  }
  return sheet;
}

function getTacticInstances(rowData) {
    const tactics = [];
    
    // Check each set of tactic columns for data
    try {
      // Phone Tactic Check
      if (rowData[PROGRAM_COLUMNS.PHONE.PROGRAMLENGTH] || 
          rowData[PROGRAM_COLUMNS.PHONE.WEEKLYVOLUNTEERS]) {
        tactics.push(new PhoneTactic(rowData));
      }
      
      // Door Tactic Check
      if (rowData[PROGRAM_COLUMNS.DOOR.PROGRAMLENGTH] || 
          rowData[PROGRAM_COLUMNS.DOOR.WEEKLYVOLUNTEERS]) {
        tactics.push(new DoorTactic(rowData));
      }
      
      // Open Tactic Check
      if (rowData[PROGRAM_COLUMNS.OPEN.PROGRAMLENGTH] || 
          rowData[PROGRAM_COLUMNS.OPEN.WEEKLYVOLUNTEERS]) {
        tactics.push(new OpenTactic(rowData));
      }
      
      // Relational Tactic Check
      if (rowData[PROGRAM_COLUMNS.RELATIONAL.PROGRAMLENGTH] || 
          rowData[PROGRAM_COLUMNS.RELATIONAL.WEEKLYVOLUNTEERS]) {
        tactics.push(new RelationalTactic(rowData));
      }
      
      // Registration Tactic Check
      if (rowData[PROGRAM_COLUMNS.REGISTRATION.PROGRAMLENGTH] || 
          rowData[PROGRAM_COLUMNS.REGISTRATION.WEEKLYVOLUNTEERS]) {
        tactics.push(new RegistrationTactic(rowData));
      }
      
      // Text Tactic Check
      if (rowData[PROGRAM_COLUMNS.TEXT.PROGRAMLENGTH] || 
          rowData[PROGRAM_COLUMNS.TEXT.WEEKLYVOLUNTEERS]) {
        tactics.push(new TextTactic(rowData));
      }
      
      // Mail Tactic Check
      if (rowData[PROGRAM_COLUMNS.MAIL.PROGRAMLENGTH] || 
          rowData[PROGRAM_COLUMNS.MAIL.WEEKLYVOLUNTEERS]) {
        tactics.push(new MailTactic(rowData));
      }
    } catch (error) {
      Logger.log(`Error creating tactics: ${tactics} ${error.message}`);
    }
    
    return tactics;
}

function getFieldTacticDetails(rowData, tacticType) {
  try {
    // Apps Script needs global class access
    switch(tacticType) {
      case 'PHONE':
        return new PhoneTactic(rowData);
      case 'DOOR':
        return new DoorTactic(rowData);
      case 'OPEN':
        return new OpenTactic(rowData);
      case 'RELATIONAL':
        return new RelationalTactic(rowData);
      case 'REGISTRATION':
        return new RegistrationTactic(rowData);
      case 'TEXT':
        return new TextTactic(rowData);
      case 'MAIL':
        return new MailTactic(rowData);
      default:
        Logger.log(`Unknown tactic type: ${tacticType}`);
        return null;
    }
  } catch (error) {
    Logger.log(`Error creating ${tacticType} tactic: ${error.message}`);
    return null;
  }
}

function getTacticMetrics(tactic) {
  if (!tactic) return '';
  
  try {
    let metrics = `
      <h4>${tactic._name} Metrics</h4>
      <ul>
        <li>Program Length: ${tactic.programLength} weeks</li>
        <li>Weekly Volunteers: ${tactic.weeklyVolunteers}</li>
        <li>Weekly Hours per Volunteer: ${tactic.weeklyVolunteerHours}</li>
        <li>Total Program Hours: ${tactic.programVolunteerHours()}</li>
        <li>Weekly Contact Attempts: ${tactic.weeklyAttempts()}</li>
        <li>Total Program Attempts: ${tactic.programAttempts()}</li>
      </ul>`;

    // More robust way to get the constructor name that handles various JavaScript implementations
    let constructorName;
    try {
      // Try direct constructor.name first (works in modern browsers)
      if (tactic.constructor && tactic.constructor.name) {
        constructorName = tactic.constructor.name;
      }
      // Fall back to regex matching for older JavaScript engines
      else if (tactic.constructor && tactic.constructor.toString) {
        const match = tactic.constructor.toString().match(/function\s+(\w+)/) ||
                      tactic.constructor.toString().match(/class\s+(\w+)/) ||
                      tactic.constructor.toString().match(/\[object\s+(\w+)/);
        if (match && match[1]) {
          constructorName = match[1];
        } else {
          // Last resort - derive from object property
          for (const tacticType of ['Phone', 'Door', 'Open', 'Relational', 'Registration', 'Text', 'Mail']) {
            if (tactic['_' + tacticType.toLowerCase() + 'Range']) {
              constructorName = tacticType + 'Tactic';
              break;
            }
          }
        }
      }

      // If we still can't determine the name, log and use a fallback
      if (!constructorName) {
        Logger.log('Could not determine tactic constructor name:', tactic);
        constructorName = 'UnknownTactic';
      }
    } catch (nameError) {
      Logger.log('Error determining tactic type: ' + nameError.message);
      constructorName = 'UnknownTactic';
    }
    
    // Add tactic-specific metrics
    switch(constructorName) {
      case 'PhoneTactic':
        metrics += `<p>${tactic.phoneAttemptReasonable()}</p>
                    <p>${tactic.phoneExpectedContacts()}</p>`;
        break;
      case 'DoorTactic':
        metrics += `<p>${tactic.doorAttemptReasonable()}</p>
                    <p>${tactic.doorExpectedContacts()}</p>`;
        break;
      case 'OpenTactic':
        metrics += `<p>${tactic.openAttemptReasonable()}</p>
                    <p>${tactic.openExpectedContacts()}</p>`;
        break;
      case 'RelationalTactic':
        metrics += `<p>${tactic.relationalAttemptReasonable()}</p>
                    <p>${tactic.relationalExpectedContacts()}</p>`;
        break;
      case 'RegistrationTactic':
        metrics += `<p>${tactic.registrationAttemptReasonable()}</p>
                    <p>${tactic.registrationExpectedContacts()}</p>`;
        break;
      case 'TextTactic':
        metrics += `<p>${tactic.textAttemptReasonable()}</p>
                    <p>${tactic.textExpectedContacts()}</p>`;
        break;
      case 'MailTactic':
        metrics += `<p>${tactic.mailAttemptReasonable()}</p>
                    <p>${tactic.mailExpectedContacts()}</p>`;
        break;
    }
    
    return metrics;
  } catch (error) {
    Logger.log(`Error getting metrics: ${error.message}`);
    return '<p>Error calculating tactic metrics</p>';
  }
}

function sendFieldPlanEmail(fieldPlan, rowNumber = null) {
  if (!fieldPlan) {
    Logger.log('Error: fieldPlan object is undefined');
    return;
  }

  // Configuration object with recipient emails array - add your emails here
  const config = {
    recipientEmails: (scriptProps.getProperty('EMAIL_RECIPIENTS') || 'gabri@alforward.org,sherri@alforward.org,deanna@alforward.org,datateam@alforward.org').split(','),
    maxRetries: 3,
    retryDelay: 1000 // milliseconds
  };
  
  // Email validation
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  // Validate all email addresses
  const validEmails = config.recipientEmails.filter(email => validateEmail(email));
  
  if (validEmails.length === 0) {
    Logger.log("No valid recipient email addresses found");
    return;
  }
  
  // Log any invalid emails that were removed
  if (validEmails.length < config.recipientEmails.length) {
    Logger.log(`${config.recipientEmails.length - validEmails.length} invalid email(s) were removed`);
  }

  try {
    // Get the row data for creating tactic instances
    const sheet = SpreadsheetApp.getActive().getSheetByName('2025_field_plan');
    let rowData;
    
    if (rowNumber) {
      // Use the specific row number if provided
      rowData = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
      Logger.log(`Using row data from row ${rowNumber} for ${fieldPlan.memberOrgName}`);
    } else {
      // Fallback: try to find the row by matching organization name
      const allData = sheet.getDataRange().getValues();
      let foundRow = -1;
      
      for (let i = 1; i < allData.length; i++) {
        if (allData[i][FieldPlan.COLUMNS.MEMBERNAME] === fieldPlan.memberOrgName) {
          rowData = allData[i];
          foundRow = i + 1;
          break;
        }
      }
      
      if (foundRow === -1) {
        Logger.log(`Warning: Could not find row for ${fieldPlan.memberOrgName}, using last row as fallback`);
        const lastRow = sheet.getLastRow();
        rowData = sheet.getRange(lastRow, 1, 1, sheet.getLastColumn()).getValues()[0];
      } else {
        Logger.log(`Found ${fieldPlan.memberOrgName} at row ${foundRow}`);
      }
    }

    // Create comprehensive email content
    let emailBody = `
      <h2>New Field Plan Entry</h2>
      
      <h3>Contact Information</h3>
      <p><strong>Organization:</strong> ${fieldPlan.memberOrgName || 'Not specified'}</p>
      <p><strong>Contact:</strong> ${(fieldPlan.firstName || '') + ' ' + (fieldPlan.lastName || '')}</p>
      <p><strong>Email:</strong> ${fieldPlan.contactEmail || 'Not provided'}</p>
      <p><strong>Phone:</strong> ${fieldPlan.contactPhone || 'Not provided'}</p>
      
      <h3>Program Details</h3>
      <p><strong>Data Storage:</strong> ${
        fieldPlan.dataStorage ?
        (Array.isArray(fieldPlan.dataStorage) ? fieldPlan.dataStorage.toString().replace(/\n/g, ', ') : fieldPlan.dataStorage.join(', ')
        ) :
        'None specified'}</p>
      <p><strong>VAN Committee:</strong> ${fieldPlan.vanCommittee || 'None specified'}</p>

      <p><strong>Program Tools:</strong> ${
        fieldPlan.programTools ?
        (Array.isArray(fieldPlan.programTools) ? fieldPlan.programTools.toString().replace(/\n/g, ', ') : fieldPlan.programTools.join(', ')
        ) :
        'None specified'}</p>

      <p><strong>Field Counties:</strong> ${
        fieldPlan.fieldCounties ?
        (Array.isArray(fieldPlan.fieldCounties) ? fieldPlan.fieldCounties.toString().replace(/\n/g, ', ') : fieldPlan.fieldCounties.join(', ')
        ) :
        'None specified'}</p>
      
      <h3>Demographics</h3>
      <p><strong>Race:</strong> ${
        fieldPlan.demoRace ?
        (Array.isArray(fieldPlan.demoRace) ? fieldPlan.demoRace.toString().replace(/\n/g, ', ') : fieldPlan.demoRace.join(', ')
        ) :
        'None specified'}</p>
      
      <p><strong>Age:</strong> ${
        fieldPlan.demoAge ?
        (Array.isArray(fieldPlan.demoAge) ? fieldPlan.demoAge.toString().replace(/\n/g, ', ') : fieldPlan.demoAge.join(', ')
        ):
        'None specified'}</p>

      <p><strong>Gender:</strong> ${
        fieldPlan.demoGender ?
        (Array.isArray(fieldPlan.demoGender) ? fieldPlan.demoGender.toString().replace(/\n/g, ', ') : fieldPlan.demoGender.join(', ')
        ) :
        'None specified'}</p>
      <p><strong>Affinity Groups:</strong> ${Array.isArray(fieldPlan.demoAffinity) ? fieldPlan.demoAffinity.join(', ') : 'None specified'}</p>

      <h3>Coaching Assessment</h3>
      <p>${fieldPlan.needsCoaching()}</p>`;

    // Get all tactics with data
    const tactics = getTacticInstances(rowData);
    
    // Add detailed metrics for each tactic
    if (tactics && tactics.length > 0) {
      emailBody += `<h3>Field Tactic Analysis</h3>`;
      tactics.forEach(tactic => {
        const tacticMetrics = getTacticMetrics(tactic);
        if (tacticMetrics) {
          emailBody += `
            <div class="tactic-section">
              ${tacticMetrics}
            </div>`;
        }
      });
    } else {
      emailBody += `<p>No field tactics were specified in this plan.</p>`;
    }

    // Send email with retry logic
    let attempt = 1;
    let success = false;

    while (attempt <= config.maxRetries && !success) {
      try {
        MailApp.sendEmail({
          to: validEmails.join(','),
          subject: `New Field Plan: ${fieldPlan.memberOrgName || 'Unknown Organization'}`,
          htmlBody: emailBody,
          name: "Field Plan Notification System",
          replyTo: scriptProps.getProperty('EMAIL_REPLY_TO') || "datateam@alforward.org"
        });
        success = true;
        Logger.log('Email sent successfully');
      } catch (error) {
        Logger.log(`Attempt ${attempt} failed: ${error.message}`);
        if (attempt < config.maxRetries) {
          Utilities.sleep(config.retryDelay);
          attempt++;
        } else {
          // Send simplified error notification on final failure
          MailApp.sendEmail({
            to: validEmails.join(','),
            subject: 'Error in Field Plan Email Processing',
            body: `Error processing field plan for ${fieldPlan.memberOrgName}: ${error.message}\n\nPlease check the Apps Script logs for more details.`,
            name: "Field Plan Error Notification"
          });
          throw error;
        }
      }
    }
  } catch (error) {
    Logger.log(`Error in sendFieldPlanEmail: ${error} ${error.message}`);
    Logger.log(`Error stack: ${error.stack}`);
    
    try {
      MailApp.sendEmail({
        to: validEmails.join(','),
        subject: 'Critical Error in Field Plan Processing',
        body: `A critical error occurred while processing the field plan:\n\n${error.message}\n\nPlease check the Apps Script logs for more details.`,
        name: "Field Plan Error Notification"
      });
    } catch (emailError) {
      Logger.log(`Failed to send error notification: ${emailError.message}`);
    }
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
    const triggerHours = parseInt(scriptProps.getProperty('TRIGGER_FIELD_PLAN_CHECK_HOURS') || '12');
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
  const sheetName = scriptProps.getProperty('SHEET_FIELD_PLAN') || '2025_field_plan';
  const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  return sheet.getLastRow();
}

// Function to check for new rows and process them
function checkForNewRows() {
  try {
    const sheetName = scriptProps.getProperty('SHEET_FIELD_PLAN') || '2025_field_plan';
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
  const budgetSheetName = scriptProps.getProperty('SHEET_FIELD_BUDGET') || '2025_field_budget';
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

// Function to process ALL field plans regardless of previous processing
function processAllFieldPlans(isTestMode = false) {
  try {
    Logger.log(`=== PROCESSING ALL FIELD PLANS (${isTestMode ? 'TEST MODE' : 'PRODUCTION'}) ===`);
    
    const sheetName = scriptProps.getProperty('SHEET_FIELD_PLAN') || '2025_field_plan';
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
          const originalRecipients = scriptProps.getProperty('EMAIL_RECIPIENTS');
          scriptProps.setProperty('EMAIL_RECIPIENTS', 'datateam@alforward.org');
          sendFieldPlanEmail(fieldPlan, rowNumber);
          scriptProps.setProperty('EMAIL_RECIPIENTS', originalRecipients);
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

// Send notification for missing budget
function sendMissingBudgetNotification(orgName, isTestMode = false) {
  const emailBody = `
    <h2>Missing Budget Alert</h2>
    <p><strong>Organization:</strong> ${orgName}</p>
    <p>This organization submitted a field plan more than 72 hours ago but has not yet submitted a budget.</p>
    <p>Cost efficiency analysis cannot be performed without budget data.</p>
    <p>Please follow up with the organization to request their budget submission.</p>
  `;
  
  try {
    const recipients = getEmailRecipients(isTestMode);
    MailApp.sendEmail({
      to: recipients.join(','),
      subject: `${isTestMode ? '[TEST] ' : ''}Missing Budget: ${orgName}`,
      htmlBody: isTestMode ? `<div style="background-color: #ffffcc; padding: 10px; border: 2px solid #ffcc00; margin-bottom: 20px;">
        <strong>🧪 TEST MODE EMAIL</strong> - This is a test email sent only to datateam@alforward.org
      </div>` + emailBody : emailBody,
      name: "Field Plan Analysis System",
      replyTo: EMAIL_CONFIG.replyTo
    });
    Logger.log(`Missing budget notification sent for ${orgName} (${isTestMode ? 'TEST MODE' : 'PRODUCTION'})`);
  } catch (error) {
    Logger.log(`Error sending missing budget notification: ${error.message}`);
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
