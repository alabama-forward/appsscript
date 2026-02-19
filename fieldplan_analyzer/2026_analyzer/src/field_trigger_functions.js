// Email configuration (shared with budget_trigger_functions.js)
const scriptProps = PropertiesService.getScriptProperties();
const EMAIL_CONFIG = {
  recipients: (scriptProps.getProperty('EMAIL_RECIPIENTS').split(',')),
  testRecipients: (scriptProps.getProperty('EMAIL_TEST_RECIPIENTS')).split(','),
  replyTo: scriptProps.getProperty('EMAIL_REPLY_TO')
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

/**
 * Creates tactic instances for all tactics that have data in the row
 * Uses NEW config-drive TacticProgram class
 * @param {*} rowData 
 * @returns tactics and associated data
 */
function getTacticInstances(rowData) {
  const tactics = [];

  //Iterate through all tactic configurations
  for (const [tacticKey, config] of Object.entries(TACTIC_CONFIG)) {
    try {
      //Check if this TACTIC_CONFIG key has corresponding key in PROGRAM_COLUMNS
      const columns = PROGRAM_COLUMNS[config.columnKey];
      if (!columns) {
        Logger.log(`Warning: No PROGRAM_COLUMNS found for ${tacticKey}`);
        continue;
      }

      //Check if this tactic has any data filled in
      if (rowData[columns.PROGRAM_LENGTH] || rowData[columns.WEEKLYVOLUNTEERS]) {
        tactics.push(new TacticProgram(rowData, tacticKey));
      }
    } catch (error) {
      Logger.log(`Error creating ${tacticKey} tactic: ${error.message}`);
    }
  }
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

/**
 * Generates HTML metrics for a single tactic instance.
 * 
 * Uses the unified TacticProgram class methods: attemptReasonable() and
 * expectedContacts(), which work for all tactic types via TACTIC_CONFIG.
 * 
 * @param {TacticProgram} tactic - A tactic instance created by getTacticInstances()
 * @returns {string}. HTML string with tactic metrics or empty string if tactic is null
 */
function getTacticMetrics(tactic) {
  if (!tactic) return '';

  try {
    let metrics = `
      <h4>${tactic.tacticName} Metrics</h4>
      <ul>
        <li>Program Length: ${tactic.programLength} weeks</li>
        <li>Weekly Volunteers: ${tactic.weeklyVolunteers}</li>
        <li>Weekly Hours per Volunteer: ${tactic.weeklyVolunteerHours}</li>
        <li>Total Program Hours: ${tactic.programVolunteerHours()}</li>
        <li>Weekly Contact Attempts: ${tactic.weeklyAttempts()}</li>
        <li>Total Program Attempts: ${tactic.programAttemts()}</li>
      </ul>`;
    
    metrics += `<p>${tactic.attemptReasonable()}</p>`;
    metrics += `<p>${tactic.expectedContacts()}</p>`

    return metrics;
  } catch (error) {
    Logger.log(`Error getting metrics for ${tactic.tacticName}: ${error.message}`);
    return '<p>Error calculating tactic metrics</p>'
  }
}

function buildFieldTargetsTable(fieldPlans) {
  let html = `
    <h2>Field Wide Targets</h2>
    <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
      <thead>
        <tr style="background-color: #f0f0f0;">
          <th>Organization</th>
          <th>Counties</th>
          <th>Cities</th>
          <th>Special Areas</th>
          <th>Demographics</th>
          <th>Precincts</th>
          <th>Running for Office</th>
          <th>Can Teach</th>
        </tr>
      </thead>
      <tbody>
      `;
  
  //Add each field plan as a row to table
  fieldPlans.forEach(fp => {
    html += createFieldTargetsRow(fp);
  });

  html += `
      </tbody
    </table>
    `;
  
    return html;
};

function sendFieldPlanEmail(fieldPlan, rowNumber = null) {
  if (!fieldPlan) {
    Logger.log('Error: fieldPlan object is undefined');
    return;
  }

  // Configuration object with recipient emails array - add your emails here
  const config = {
    recipientEmails: (scriptProps.getProperty('EMAIL_RECIPIENTS')),
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
    const sheetName = scriptProps.getProperty('SHEET_FIELD_PLAN')
    const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName); 
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

      <h3>Field Tactics & Capacity</h3>
      <p><strong>Can Teach These Tactics:</strong> ${
        fieldPlan.teachComfortable ?
        (Array.isArray(fieldPlan.teachComfortable) ? fieldPlan.teachComfortable.join(', ') : fieldPlan.teachComfortable
        ) :
        'None specified'}</p>

      <p><strong>Field Staff Type:</strong> ${
        fieldPlan.fieldStaff ?
        (Array.isArray(fieldPlan.fieldStaff) ? fieldPlan.fieldStaff.join(', ') : fieldPlan.fieldStaff
        ) :
        'Not specified'}</p>
      
      <p><strong>Field Staff Notes:</strong> ${fieldPlan.fieldStaffNotes || 'None provided'}</p>
      
      <p><strong>Running for Office:</strong> ${fieldPlan.runningForOffice || 'Not specified'}</p>
            
      <h3>Program Details</h3>
      <p><strong>Data Storage:</strong> ${
        fieldPlan.dataStorage ?
        (Array.isArray(fieldPlan.dataStorage) ? fieldPlan.dataStorage.toString().replace(/\n/g, ', ') : fieldPlan.dataStorage.join(', ')
        ) :
        'None specified'}</p>
      
      <p><strong>Data Entry Stipend:</strong> ${fieldPlan.dataStipend || 'Not Specified'}</p>

      <p><strong>Data Digitization Plan:</strong> ${fieldPlan.dataPlan || 'Not Specified'}</p>

      <P><strong>Data Sharing:</strong> ${fieldPlan.dataShare || 'Not Specified'}</p>
      
      <p><strong>VAN Committee:</strong> ${fieldPlan.vanCommittee || 'None specified'}</p>

      <p><strong>Share With Organizations:</strong> ${
        fieldPlan.shareOrg ?
        (Array.isArray(fieldPlan.shareOrg) ? fieldPlan.shareOrg.join(', ') : fieldPlan.shareOrg
        ): 
        'None Specified'}</p>
      
      <p><strong>Program Dates:</strong> ${fieldPlan.programDates || 'Not specified'}</p>

      <p><strong>Program Activity Types:</strong> ${
        fieldPlan.programTypes ?
        (Array.isArray(fieldPlan.programTypes) ? fieldPlan.programTypes.join(', ') : fieldPlan.programTypes
        ) :
        'None specified'}</p>

      <p><strong>Program Tools:</strong> ${
        fieldPlan.programTools ?
        (Array.isArray(fieldPlan.programTools) ? fieldPlan.programTools.toString().replace(/\n/g, ', ') : fieldPlan.programTools.join(', ')
        ) :
        'None specified'}</p>
      
      <h3>Geographic Targeting</h3>

      <p><strong>Field Counties:</strong> ${
      fieldPlan.fieldCounties ?
      (Array.isArray(fieldPlan.fieldCounties) ? fieldPlan.fieldCounties.toString().replace(/\n/g, ', ') : fieldPlan.fieldCounties.join(', ')
      ) :
      'None specified'}</p>

      <p><strong>Cities:</strong> ${
        fieldPlan.cities ?
        (Array.isArray(fieldPlan.cities) ? fieldPlan.cities.join(', ') : fieldPlan.cities
        ) :
        'None specified'}</p>
      
      <p><strong>Special Geographic Areas:</strong> ${
        fieldPlan.specialGeo ?
        (Array.isArray(fieldPlan.specialGeo) ? fieldPlan.specialGeo.join(', ') : fieldPlan.specialGeo
        ) :
        'None specified'}</p>

      <p><strong>Knows Specific Precincts:</strong> ${fieldPlan.knowsPrecincts || 'Not specified'}</p>

      <p><strong>Precincts:</strong> ${
        fieldPlan.fieldPrecincts ?
        (Array.isArray(fieldPlan.fieldPrecincts) ? fieldPlan.fieldPrecincts.toString().replace(/\n/g, ', ') : fieldPlan.fieldPrecincts.join(', ')
        ) :
        'None specified'}</p>

      <p><strong>Willing to Work Different Precincts:</strong> ${fieldPlan.diffPrecincts || 'Not specified'}</p>
            
      <h3>Demographics</h3>
      <p><strong>Race:</strong> ${
        fieldPlan.demoRace ?
        (Array.isArray(fieldPlan.demoRace) ? fieldPlan.demoRace.toString().replace(/\n/g, ', ') : fieldPlan.demoRace.join(', ')
        ) :
        'None specified'}</p>
      
      <p><strong>Age:</strong> ${
        fieldPlan.demoAge ?
        (Array.isArray(fieldPlan.demoAge) ? fieldPlan.demoAge.toString().replace(/\n/g, ', ') : fieldPlan.demoAge.join(', ')
        ) :
        'None specified'}</p>

      <p><strong>Gender:</strong> ${
        fieldPlan.demoGender ?
        (Array.isArray(fieldPlan.demoGender) ? fieldPlan.demoGender.toString().replace(/\n/g, ', ') : fieldPlan.demoGender.join(', ')
        ) :
        'None specified'}</p>
      
      <p><strong>Affinity Groups:</strong> ${Array.isArray(fieldPlan.demoAffinity) ? fieldPlan.demoAffinity.join(', ') : 'None specified'}</p>
      <p><strong>Additional Demographic Notes:</strong> ${fieldPlan.demoNotes || 'None provided'}</p>
      <p><strong>Demographic Reach Confidence:</strong> ${fieldPlan.demoConfidence || 'Not specified'}</p>

      <h3>Training & Preparation</h3>

      <p><strong>Attended Training:</strong>${fieldPlan.attendedTraining || 'Not Specified'}</p>
      <p><strong>Reviewed Table Field Plan:</strong>${fieldPlan.reviewedPlan || 'Not Specified'}</p>
      <p><strong>Understands Requirements:</strong>${fieldPlan.understandsReasonable || 'Not Specified'}, 
          Grant Disbursement: ${fieldPlan.understandsDisbursement || 'Not specified'},
          Training Importance: ${fieldPlan.understandsTraining || 'Not Specified'}
      </p>

      <h3>Confidence & Coaching Assessment</h3>
      <p>${fieldPlan.needsCoaching()}</p>

      <h4>Detailed Confidence Scores</h4>
      <ul>
        <li><strong>Meets Reasonable/Realistic Expectations:</strong> ${fieldPlan.confidenceReasonable || 'Not provided'}/10</li>
        <li><strong>Data & Technology Usage:</strong> ${fieldPlan.confidenceData || 'Not provided'}/10</li>
        <li><strong>Field Plan Quality:</strong> ${fieldPlan.confidencePlan || 'Not provided'}/10</li>
        <li><strong>Staff/Volunteer Capacity:</strong> ${fieldPlan.confidenceCapacity || 'Not provided'}/10</li>
        <li><strong>Field Tactic Skills:</strong> ${fieldPlan.confidenceSkills || 'Not provided'}/10</li>
        <li><strong>Meeting Goals:</strong> ${fieldPlan.confidenceGoals || 'Not provided'}/10</li>
      </ul>

      `

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
          replyTo: scriptProps.getProperty('EMAIL_REPLY_TO')
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
  const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  return sheet.getLastRow();
}

// Function to check for new rows and process them
function checkForNewRows() {
  try {
    const sheetName = scriptProps.getProperty('SHEET_FIELD_PLAN');
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

//Create row fore fieldtargets function
function createFieldTargetsRow(fieldPlan) {
  //Format county arrays as comma-separated strings
  const counties = fieldPlan.fieldCounties ?
    (Array.isArray(fieldPlan.fieldCounties) 
      ? fieldPlan.fieldCounties.toString().replace(/\n/g, ', ') 
      : fieldPlan.fieldCounties.toString().replace(/\n/g, ', ')
    ) : 'None specified';

  //Combine demos into one cell
  const demographics = formatDemographics(fieldPlan);

  //Format precinct array as comma-separated strings
  const precincts = fieldPlan.fieldPrecincts ?
    (Array.isArray(fieldPlan.fieldPrecincts) 
      ? fieldPlan.fieldPrecincts.toString().replace(/\n/g, ', ') 
      : fieldPlan.fieldPrecincts.toString().replace(/\n/g, ', ')
    ) : 'None specified';

  return `
    <tr>
      <td>${fieldPlan.memberOrgName || 'Unknown'}</td>
      <td>${counties}</td>
      <td>${demographics}</td>
      <td>${precincts}</td>
    </tr>
  `;
}

// Find matching budget for organization
function findMatchingBudget(orgName) {
  const budgetSheetName = scriptProps.getProperty('SHEET_FIELD_BUDGET');
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
// Function to process the county, precinct, and demo for each field submission at once
function sendFieldPlanTargetsSummary() {
  //Get the field plan sheet using existing helpers
  const sheet = getSheet('2025_field_plan'); //Why by name and not by script property or business logic?
  const data = sheet.getDataRange().getValues();

  //Process field plans, skip header row
  const fieldPlans = [];
  for (let i = 1; i < data.length; i++) {
    const fieldPlan = new FieldPlan(data[i]);
    fieldPlans.push(fieldPlan)
  }

  //Build the html
  const emailBody = buildFieldTargetsTable(fieldPlans);

  //Send using existing email config
  sendTargetsSummaryEmail(emailBody)
};

function sendTargetsSummaryEmail(htmlBody) {
  const recipients = getEmailRecipients();

  try {
    MailApp.sendEmail({
      to: recipients.join(','),
      subject: 'Field Wide Targets Summary',
      htmlBody: htmlBody,
      name: "Field Targets Summary Email",
      replyTo: EMAIL_CONFIG.replyTo
    });
    Logger.log('Field Wide Targets summary email sent successfull');
  } catch (error) {
    Logger.log(`Error sending field targets email: ${error.message}`);
  }
}

// Function to process ALL field plans regardless of previous processing
function processAllFieldPlans(isTestMode = false) {
  try {
    Logger.log(`=== PROCESSING ALL FIELD PLANS (${isTestMode ? 'TEST MODE' : 'PRODUCTION'}) ===`);
    
    const sheetName = scriptProps.getProperty('SHEET_FIELD_PLAN');
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
          const originalRecipients = scriptProps.getProperty('TEST_RECIPIENTS');
          scriptProps.setProperty('TEST_RECIPIENTS');
          sendFieldPlanEmail(fieldPlan, rowNumber);
          scriptProps.setProperty('TEST_RECIPIENTS', originalRecipients);
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

//Combines demographics for fieldplan target summary email
function formatDemographics(fieldPlan) {
  const parts = [];

  //Test if demoRace array contains data, then format
  if (fieldPlan.demoRace && fieldPlan.demoRace.length > 0) {
    const race = Array.isArray(fieldPlan.demoRace)
      ? fieldPlan.demoRace.toString().replace(/\n/g, ', ')
      : fieldPlan.demoRace.toString().replace(/\n/g, ', ');
    parts.push(`Race: ${race}`);
  }

  //Test if demoAge array contains data, then format
  if (fieldPlan.demoAge && fieldPlan.demoAge.length > 0) {
    const age = Array.isArray(fieldPlan.demoAge)
      ? fieldPlan.demoAge.toString().replace(/\n/g, ', ')
      : fieldPlan.demoAge.toString().replace(/\n/g, ', ');
    parts.push(`Age: ${age}`);
  }

  if (fieldPlan.demoGender && fieldPlan.demoGender.length > 0) {
    const gender = Array.isArray(fieldPlan.demoGender)
      ? fieldPlan.demoGender.toString().replace(/\n/g, ', ')
      : fieldPlan.demoGender.toString().replace(/\n/g, ', ');
    parts.push(`Gender: ${gender}`);
  }

  if (fieldPlan.demoAffinity && fieldPlan.demoAffinity.length > 0) {
    const affinity = Array.isArray(fieldPlan.demoAffinity)
      ? fieldPlan.demoAffinity.toString().replace(/\n/g, ', ')
      : fieldPlan.demoAffinity.toString().replace(/\n/g, ', ');
    parts.push(`Affinity: ${affinity}`);
  }

  // NEW in 2026: Add notes if provided
  if (fieldPlan.demoNotes) {
    parts.push(`<em>Notes: ${fieldPlan.demoNotes}</em>`);
  }

  return parts.length > 0 ? parts.join('<br>') : 'None specified';

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
  
