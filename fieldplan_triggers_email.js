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

    // Use constructorName since constructor.name might not be reliable in Apps Script
    const constructorName = tactic.constructor.toString().match(/function (\w+)/)[1];
    
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

  // Configuration object
  const config = {
    recipientEmail: "gabri@alforward.org",
    maxRetries: 3,
    retryDelay: 1000 // milliseconds
  };
  
  // Email validation
  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
  };

  if (!validateEmail(config.recipientEmail)) {
    Logger.log(`Invalid recipient email address: ${config.recipientEmail}`);
    return;
  }

  try {
    // Get the row data for creating tactic instances
    const sheet = SpreadsheetApp.getActiveSheet();
    const lastRow = sheet.getLastRow();
    const rowData = sheet.getRange(lastRow, 1, 1, sheet.getLastColumn()).getValues()[0];

    // Create comprehensive email content
    let emailBody = `
      <h2>New Field Plan Entry</h2>
      
      <h3>Contact Information</h3>
      <p><strong>Organization:</strong> ${fieldPlan.memberOrgName || 'Not specified'}</p>
      <p><strong>Contact:</strong> ${(fieldPlan.firstName || '') + ' ' + (fieldPlan.lastName || '')}</p>
      <p><strong>Email:</strong> ${fieldPlan.contactEmail || 'Not specified'}</p>
      
      <h3>Program Details</h3>
      <p><strong>Data Storage:</strong> ${Array.isArray(fieldPlan.dataStorage) ? fieldPlan.dataStorage.join(', ') : 'None specified'}</p>
      <p><strong>VAN Committee:</strong> ${fieldPlan.vanCommittee || 'None specified'}</p>
      <p><strong>Program Tools:</strong> ${Array.isArray(fieldPlan.programTools) ? fieldPlan.programTools.join(', ') : 'None specified'}</p>
      <p><strong>Field Counties:</strong> ${Array.isArray(fieldPlan.fieldCounties) ? fieldPlan.fieldCounties.join(', ') : 'None specified'}</p>
      
      <h3>Demographics</h3>
      <p><strong>Race:</strong> ${Array.isArray(fieldPlan.demoRace) ? fieldPlan.demoRace.join(', ') : 'None specified'}</p>
      <p><strong>Age:</strong> ${Array.isArray(fieldPlan.demoAge) ? fieldPlan.demoAge.join(', ') : 'None specified'}</p>
      <p><strong>Gender:</strong> ${Array.isArray(fieldPlan.demoGender) ? fieldPlan.demoGender.join(', ') : 'None specified'}</p>
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
          to: config.recipientEmail,
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
            to: config.recipientEmail,
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
        to: config.recipientEmail,
        subject: 'Critical Error in Field Plan Processing',
        body: `A critical error occurred while processing the field plan:\n\n${error.message}\n\nPlease check the Apps Script logs for more details.`,
        name: "Field Plan Error Notification"
      });
    } catch (emailError) {
      Logger.log(`Failed to send error notification: ${emailError.message}`);
    }
  }
}

function onEdit(e) {
  if (!e) {
    Logger.log("No event object - this function must be triggered by an edit");
    return;
  }

  const range = e.range;
  const sheet = range.getSheet();
  
  if (range.getRow() === sheet.getLastRow()) {
    try {
      const fieldPlan = FieldPlan.fromLastRow();
      Logger.log(`New entry from: ${fieldPlan.memberOrgName}`);
      
      // Send email with field plan details
      sendFieldPlanEmail(fieldPlan);
      
    } catch (error) {
      Logger.log(`Error processing new row: ${error.message}`);
    }
  }
}

function createSpreadsheetTrigger() {
  // Check if trigger already exists
  const triggers = ScriptApp.getProjectTriggers();
  const triggerExists = triggers.some(trigger => 
    trigger.getHandlerFunction() === 'onEdit' && 
    trigger.getEventType() === ScriptApp.EventType.ON_EDIT
  );
  
  if (!triggerExists) {
    const ss = SpreadsheetApp.getActive();
    ScriptApp.newTrigger('onEdit')
      .forSpreadsheet(ss)
      .onEdit()
      .create();
    Logger.log('New edit trigger created');
  } else {
    Logger.log('Edit trigger already exists');
  }
}