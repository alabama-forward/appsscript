// SimplifiedBigQueryIntegration.js
// A simplified version that sends email confirmations with query information

/**
 * CONFIGURATION SECTION
 * Update these values with your specific BigQuery details
 */
const BIGQUERY_CONFIG = {
  // Project ID for all BigQuery operations
  projectId: 'prod-sv-al-898733e3',
  
  // Dataset for saving query history and results
  historyDataset: 'alforward',
  historyTableId: 'precinct_query_history',
  resultsTableId: 'latest_query_results',
  
  // Catalist database datasets
  catalistConfig: {
    districtDataset: 'catalist_AL.District',
    personDataset: 'catalist_AL.Person',
    modelsDataset: 'catalist_AL.Models',
    historyDataset: 'catalist_AL.Vote_History'
  }
};

/**
 * Function to build a voter targeting SQL query using the search result row data
 * @param {Array} resultRowData - Array containing precinct data from the search result:
 *                             [county, precinctName, precinctNumber, municipality]
 * @return {string} The constructed SQL query
 */
function buildVoterTargetingQuery(resultRowData) {
  // Extract precinct information from the data
  const county = resultRowData[0] || '';
  const precinctName = resultRowData[1] || ''; 
  const precinctNumber = resultRowData[2] || '';
  const municipality = resultRowData[3] || '';
  
  // Set project and dataset values
  const projectId = BIGQUERY_CONFIG.projectId;
  const districtDataset = BIGQUERY_CONFIG.catalistConfig.districtDataset;
  const personDataset = BIGQUERY_CONFIG.catalistConfig.personDataset;
  const modelsDataset = BIGQUERY_CONFIG.catalistConfig.modelsDataset;
  const historyDataset = BIGQUERY_CONFIG.catalistConfig.historyDataset;
  
  // Hard-coded query parameters
  const races = ['black', 'asian', 'nativeAmerican', 'hispanic', 'unknown'];
  const excludeVoterStatus = ['dropped', 'unregistered', 'multipleAppearances'];
  const voteHistoryYears = ['2021', '2017'];
  const minAge = 18;
  
  // Build race condition
  const raceCondition = `models.race IN (${races.map(race => `'${race}'`).join(', ')})`;
  
  // Build precinct condition
  const precinctCondition = precinctNumber ? `AND precinctnumber = '${precinctNumber}'` : '';
  
  // Build county condition
  const countyCondition = county ? `AND countyname IN ('${county}')` : '';
  
  // Build voter status exclusion condition
  const voterStatusCondition = `AND voterstatus NOT IN (${excludeVoterStatus.map(status => `'${status}'`).join(', ')})`;
  
  // Build deceased condition (hard-coded to exclude deceased)
  const deceasedCondition = `AND deceased NOT IN ('Y')`;
  
  // Build vote history condition (hard-coded to check 2021 or 2017)
  const voteHistoryConditions = voteHistoryYears.map(year => `votehistory_${year} IS NOT NULL`);
  const voteHistoryCondition = `AND (${voteHistoryConditions.join(' OR ')})`;
  
  // Construct the complete SQL query with fully qualified table references
  const query = `SELECT uniqueid
      ,stateid
FROM \`${projectId}.${districtDataset}.district\`
    LEFT JOIN \`${projectId}.${personDataset}.person\` AS person
    USING (uniqueid)
    LEFT JOIN \`${projectId}.${modelsDataset}.models\` AS models
    USING (uniqueid)
    LEFT JOIN \`${projectId}.${historyDataset}.history\` AS votehistory
    USING (uniqueid)
WHERE ${raceCondition}
   ${precinctCondition} AND person.age >= ${minAge}
    ${countyCondition}
    ${voterStatusCondition}
    ${deceasedCondition}
    ${voteHistoryCondition}`;
  
  return query;
}

/**
 * Function to build a metadata SQL query for saving claim information
 * @param {Object} claimInfo - Information about the claim being made
 * @return {string} The constructed SQL query
 */
function buildMetadataQuery(claimInfo) {
  const projectId = BIGQUERY_CONFIG.projectId;
  const datasetId = BIGQUERY_CONFIG.historyDataset;
  const historyTableId = BIGQUERY_CONFIG.historyTableId;
  
  // Generate a unique run ID and timestamp
  const queryRunId = 'run_' + new Date().getTime();
  const timestamp = new Date().toISOString();
  
  // Safely escape string values to prevent SQL injection
  const escapeSQL = (value) => {
    if (value === null || value === undefined) return '';
    return String(value).replace(/'/g, "''");
  };
  
  // Safely get claim information with default values if not provided
  const county = escapeSQL(claimInfo.county || '');
  const precinctName = escapeSQL(claimInfo.precinctName || '');
  const precinctNumber = escapeSQL(claimInfo.precinctNumber || '');
  const municipality = escapeSQL(claimInfo.municipality || '');
  const orgName = escapeSQL(claimInfo.orgName || '');
  const claimType = escapeSQL(claimInfo.claimType || '');
  const queryType = escapeSQL(claimInfo.queryType || 'default_query');
  
  // Get current user email with error handling
  let userEmail;
  try {
    userEmail = Session.getEffectiveUser().getEmail();
  } catch (sessionError) {
    Logger.log("Warning: Unable to get user email: " + sessionError.toString());
    userEmail = "unknown_user@example.com";
  }
  
  // Build the metadata query
  const metadataQuery = `
    -- Make sure the history table exists
    CREATE TABLE IF NOT EXISTS \`${projectId}.${datasetId}.${historyTableId}\` (
      run_id STRING,
      timestamp TIMESTAMP,
      county STRING,
      precinct_name STRING,
      precinct_number STRING,
      municipality STRING,
      org_name STRING,
      claim_type STRING,
      source_query STRING,
      run_by STRING
    );
    
    -- Insert the record with claim information
    INSERT INTO \`${projectId}.${datasetId}.${historyTableId}\`
    (run_id, timestamp, county, precinct_name, precinct_number, municipality, org_name, claim_type, source_query, run_by)
    VALUES(
      '${queryRunId}',
      TIMESTAMP('${timestamp}'),
      '${county}',
      '${precinctName}',
      '${precinctNumber}',
      '${municipality}',
      '${orgName}',
      '${claimType}',
      'Voter targeting query',
      '${userEmail}'
    )
  `;
  
  return metadataQuery;
}

/**
 * Function to send email confirmation with query details
 * 
 * @param {Array} resultRowData - Array containing precinct data
 * @param {Object} claimInfo - Information about the claim being made
 * @return {Object} Email sending result
 */
function sendQueryConfirmationEmail(resultRowData, claimInfo) {
  try {
    // Extract precinct information
    const county = resultRowData[0] || '';
    const precinctName = resultRowData[1] || '';
    const precinctNumber = resultRowData[2] || '';
    const municipality = resultRowData[3] || '';
    
    // Organization information
    const orgName = claimInfo.orgName || '';
    const claimType = claimInfo.claimType || '';
    
    // Build the voter targeting query
    const voterQuery = buildVoterTargetingQuery(resultRowData);
    
    // Build the metadata query
    const metadataQuery = buildMetadataQuery(claimInfo);
    
    // Get user email for sending - trying multiple methods with fallback
    let userEmail;
    try {
      // Try active user first
      userEmail = Session.getActiveUser().getEmail();
      
      // If that doesn't work, try effective user
      if (!userEmail || userEmail.trim() === "") {
        userEmail = Session.getEffectiveUser().getEmail();
      }
      
      // Log what we found
      Logger.log("User email determined to be: " + userEmail);
    } catch (emailError) {
      Logger.log("Unable to get user email: " + emailError.toString());
      userEmail = "datateam@alforward.org"; // Default fallback
    }
    
    // Always CC the data team
    const ccEmail = "datateam@alforward.org"; // Primary email for all communications
    
    // Email subject and body
    const emailSubject = `Voter Targeting Query for Precinct ${precinctNumber} in ${county}`;
    const emailBody = `
      <html>
      <body>
        <h2>Voter Targeting Query Confirmation</h2>
        <p><strong>Organization:</strong> ${orgName}</p>
        <p><strong>Claim Type:</strong> ${claimType}</p>
        <p><strong>County:</strong> ${county}</p>
        <p><strong>Precinct Number:</strong> ${precinctNumber}</p>
        <p><strong>Precinct Name:</strong> ${precinctName}</p>
        <p><strong>Municipality:</strong> ${municipality}</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        
        <h3>Voter Targeting Query:</h3>
        <pre style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto;">
${voterQuery}
        </pre>
        
        <h3>Metadata Query:</h3>
        <pre style="background-color: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto;">
${metadataQuery}
        </pre>
        
        <p>This is an automated message from the Precinct Claim BigQuery Integration.</p>
      </body>
      </html>
    `;
    
    // Log before sending email
    Logger.log(`Attempting to send BigQuery email to ${userEmail} with CC: ${ccEmail}`);
    Logger.log(`Email subject: ${emailSubject}`);
    
    try {
      // Ensure recipient is valid
      if (!userEmail || userEmail.indexOf('@') === -1) {
        userEmail = "datateam@alforward.org";
        Logger.log(`Invalid recipient email, using default: ${userEmail}`);
      }
      
      // Create recipients list
      let recipients = [userEmail, "datateam@alforward.org"];
      
      // Remove duplicates
      recipients = [...new Set(recipients)];
      
      // Log recipients
      Logger.log(`Sending BigQuery query email to: ${recipients.join(", ")}`);
      
      // Send to all recipients using the same method as Code.js
      for (let i = 0; i < recipients.length; i++) {
        MailApp.sendEmail({
          to: recipients[i],
          subject: emailSubject,
          htmlBody: emailBody
        });
        
        // Log each send attempt 
        Logger.log(`Email sent to: ${recipients[i]}`);
      }
      
      // If we get here, email was sent successfully
      Logger.log(`SUCCESS: BigQuery email sent to all recipients`);
    } catch (mailError) {
      // Log detailed error information
      Logger.log(`ERROR sending BigQuery email: ${mailError.toString()}`);
      if (mailError.stack) {
        Logger.log(`Mail error stack: ${mailError.stack}`);
      }
      
      // Try a simplified version as a fallback
      try {
        Logger.log("Attempting fallback email method...");
        
        // Send to both user and data team
        MailApp.sendEmail({
          to: userEmail,
          cc: "datateam@alforward.org",
          subject: `[FALLBACK] ${emailSubject}`,
          htmlBody: "The full HTML email failed to send. Please check the logs for more information. The query will be sent separately."
        });
        
        // Send just the query as plain text to make sure it gets through
        MailApp.sendEmail({
          to: userEmail,
          cc: "datateam@alforward.org",
          subject: `BigQuery Query for Precinct (Plain Text)`,
          body: voterQuery
        });
        
        Logger.log("Fallback emails sent successfully");
      } catch (fallbackError) {
        Logger.log(`Fallback email also failed: ${fallbackError.toString()}`);
      }
    }
    
    return {
      success: true,
      message: "Confirmation email sent successfully",
      recipient: userEmail
    };
    
  } catch (error) {
    const errorMessage = "Error sending confirmation email: " + error.toString();
    Logger.log(errorMessage);
    
    return {
      success: false,
      message: errorMessage,
      error: error.toString()
    };
  }
}

/**
 * Main function to process a precinct claim
 * 
 * @param {Array} resultRowData - Data from search result row
 * @param {Object} claimInfo - Information about the claim
 * @return {Object} Result of the operation
 */
function processPrecinctClaim(resultRowData, claimInfo) {
  Logger.log("Starting processPrecinctClaim function");
  Logger.log(`ResultRowData: ${JSON.stringify(resultRowData)}`);
  Logger.log(`ClaimInfo: ${JSON.stringify(claimInfo)}`);
  
  try {
    // Validate inputs
    if (!resultRowData || !Array.isArray(resultRowData)) {
      throw new Error("Invalid resultRowData: must be an array");
    }
    
    if (!claimInfo || typeof claimInfo !== 'object') {
      throw new Error("Invalid claimInfo: must be an object");
    }
    
    // Send confirmation email with query information
    Logger.log("About to call sendQueryConfirmationEmail function");
    const emailResult = sendQueryConfirmationEmail(resultRowData, claimInfo);
    Logger.log(`Email result: ${JSON.stringify(emailResult)}`);
    
    // If we got this far, we succeeded - even if the email had issues
    Logger.log("Precinct claim processing completed successfully");
    return {
      success: true,
      message: "Precinct claim processed successfully",
      emailResult: emailResult
    };
    
  } catch (error) {
    const errorMessage = "Error processing precinct claim: " + error.toString();
    Logger.log(errorMessage);
    
    // Log full stack trace for better debugging
    if (error.stack) {
      Logger.log(`Error stack: ${error.stack}`);
    }
    
    // Try to send a fallback error notification
    try {
      MailApp.sendEmail(
        "datateam@alforward.org",
        "ERROR: BigQuery Integration Failed",
        `An error occurred while processing a precinct claim:\n\n${errorMessage}\n\nPlease check the logs for more details.`
      );
      Logger.log("Error notification email sent");
    } catch (mailError) {
      Logger.log(`Failed to send error notification: ${mailError.toString()}`);
    }
    
    return {
      success: false,
      message: errorMessage,
      error: error.toString()
    };
  }
}