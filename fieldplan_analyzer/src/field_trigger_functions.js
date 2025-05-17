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
      <h4>Program Metrics</h4>
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

function sendFieldPlanEmail(fieldPlan) {
  if (!fieldPlan) {
    Logger.log('Error: fieldPlan object is undefined');
    return;
  }

  // Configuration object with recipient emails array - add your emails here
  const config = {
    recipientEmails: [
      "gabri@alforward.org",
      "sherri@alforward.org",
      "deanna@alforward.org",
      "datateam@alforward.org"
    ],
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
    const lastRow = sheet.getLastRow();
    const rowData = sheet.getRange(lastRow, 1, 1, sheet.getLastColumn()).getValues()[0];

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
          replyTo: "datateam@alforward.org"
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
    ScriptApp.newTrigger('checkForNewRows')
      .timeBased()
      .everyHours(12)
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
  const sheet = SpreadsheetApp.getActive().getSheetByName('2025_field_plan');
  return sheet.getLastRow();
}

// Function to check for new rows and process them
function checkForNewRows() {
  try {
    const sheet = SpreadsheetApp.getActive().getSheetByName('2025_field_plan');
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
          sendFieldPlanEmail(fieldPlan);
          
        } catch (error) {
          Logger.log(`Error processing row ${rowNumber}: ${error.message}`);
        }
      }
      
      // Update the last processed row
      PropertiesService.getScriptProperties().setProperty('LAST_PROCESSED_ROW', currentLastRow.toString());
      Logger.log(`Updated last processed row to ${currentLastRow}`);
    } else {
      Logger.log('No new rows to process');
    }
  } catch (error) {
    Logger.log(`Error in checkForNewRows: ${error.message}`);
  }
}


