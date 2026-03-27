/**
 * @deprecated BigQuery execution is not in the active pipeline. Queries are
 * written to the query_queue sheet for manual execution. This module is
 * retained for reference only — no production trigger calls these functions.
 */

/**
 * Gets an OAuth2 access token for the service account.
 * @returns {string} A valid OAuth2 access token string
 * @throws {Error} If SA_CLIENT_EMAIL or SA_PRIVATE_KEY are not set in Script Properties
 * @throws {Error} If the token exchange request fails
 * @example getServiceAccountToken()
 *   // => 'ya29.c.ElqBB...' (cached for 50 minutes)
 * @example getServiceAccountToken() // missing credentials
 *   // => throws Error('SA_CLIENT_EMAIL not set in Script Properties...')
 */
function getServiceAccountToken() {
  const props = PropertiesService.getScriptProperties();

  // Check cache first
  const cachedToken = props.getProperty('SA_CACHED_TOKEN');
  const cachedExpiry = props.getProperty('SA_CACHED_TOKEN_EXPIRY');
  if (cachedToken && cachedExpiry) {
    const expiryTime = parseInt(cachedExpiry, 10);
    if (new Date().getTime() < expiryTime) {
      Logger.log(`Using cached service account token (expires in ${Math.round((expiryTime - new Date().getTime()) / 60000)} minutes)`);
      return cachedToken;
    }
  }

  // Load credentials
  const clientEmail = props.getProperty('SA_CLIENT_EMAIL');
  const privateKey = props.getProperty('SA_PRIVATE_KEY');

  if (!clientEmail) {
    throw new Error('SA_CLIENT_EMAIL not set in Script Properties. Run storeServiceAccountCredentials().');
  }
  if (!privateKey) {
    throw new Error('SA_PRIVATE_KEY not set in Script Properties. Run storeServiceAccountCredentials().');
  }

  // Build JWT header
  const header = {
    alg: 'RS256',
    typ: 'JWT'
  };

  // Build JWT claim set
  const now = Math.floor(new Date().getTime() / 1000);
  const claimSet = {
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/bigquery',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600 // 1 hour from now
  };

  // Base64url encode header and claim set, stripping padding
  const encodedHeader = Utilities.base64EncodeWebSafe(JSON.stringify(header)).replace(/=+$/, '');
  const encodedClaimSet = Utilities.base64EncodeWebSafe(JSON.stringify(claimSet)).replace(/=+$/, '');

  // Create the signing input
  const signingInput = encodedHeader + '.' + encodedClaimSet;

  // Sign with RSA-SHA256
  const signatureBytes = Utilities.computeRsaSha256Signature(signingInput, privateKey);
  const encodedSignature = Utilities.base64EncodeWebSafe(signatureBytes).replace(/=+$/, '');

  // Assemble the JWT
  const jwt = signingInput + '.' + encodedSignature;

  // Exchange JWT for access token
  const tokenResponse = UrlFetchApp.fetch('https://oauth2.googleapis.com/token', {
    method: 'post',
    contentType: 'application/x-www-form-urlencoded',
    payload: {
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    },
    muteHttpExceptions: true
  });

  const tokenResponseCode = tokenResponse.getResponseCode();
  const tokenResponseBody = JSON.parse(tokenResponse.getContentText());

  if (tokenResponseCode !== 200) {
    throw new Error(`Token exchange failed (HTTP ${tokenResponseCode}): ${tokenResponseBody.error_description || tokenResponseBody.error || 'Unknown error'}`);
  }

  const accessToken = tokenResponseBody.access_token;

  // Cache token for 50 minutes (tokens last 60 min, leave 10 min buffer)
  props.setProperty('SA_CACHED_TOKEN', accessToken);
  props.setProperty('SA_CACHED_TOKEN_EXPIRY', (new Date().getTime() + 50 * 60 * 1000).toString());

  Logger.log('Service account token obtained and cached for 50 minutes.');
  return accessToken;
}

/**
 * Executes a SQL query against BigQuery using the service account token.
 * @param {string} sql - The SQL query to execute
 * @param {string} projectId - The Google Cloud project ID (e.g., "prod-sv-al-898733e3")
 * @returns {{ totalRows: string, schema: Object, rows: Object[] }}
 * @throws {Error} If the token cannot be obtained, the API returns an error, or the query times out
 * @example executeBigQuery('SELECT COUNT(*) FROM `dataset.table`', 'prod-sv-al-898733e3')
 *   // => { totalRows: '1', schema: {...}, rows: [{f: [{v: '42'}]}] }
 * @example executeBigQuery('INVALID SQL', 'prod-sv-al-898733e3')
 *   // => throws Error('BigQuery job failed: ...')
 */
function executeBigQuery(sql, projectId) {
  const token = getServiceAccountToken();

  const jobUrl = 'https://bigquery.googleapis.com/bigquery/v2/projects/' + projectId + '/jobs';

  // Submit the query job
  const jobPayload = {
    configuration: {
      query: {
        query: sql,
        useLegacySql: false
      }
    }
  };

  const submitResponse = UrlFetchApp.fetch(jobUrl, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + token
    },
    payload: JSON.stringify(jobPayload),
    muteHttpExceptions: true
  });

  const submitCode = submitResponse.getResponseCode();
  const submitBody = JSON.parse(submitResponse.getContentText());

  if (submitCode !== 200) {
    throw new Error(`BigQuery job submission failed (HTTP ${submitCode}): ${JSON.stringify(submitBody.error || submitBody)}`);
  }

  const jobId = submitBody.jobReference.jobId;
  Logger.log(`BigQuery job submitted: ${jobId}`);

  // Poll for completion
  const statusUrl = jobUrl + '/' + jobId;
  const maxPolls = 60;
  const pollIntervalMs = 2000;

  for (let poll = 0; poll < maxPolls; poll++) {
    Utilities.sleep(pollIntervalMs);

    const statusResponse = UrlFetchApp.fetch(statusUrl, {
      method: 'get',
      headers: {
        'Authorization': 'Bearer ' + token
      },
      muteHttpExceptions: true
    });

    const statusBody = JSON.parse(statusResponse.getContentText());

    if (statusBody.status && statusBody.status.state === 'DONE') {
      // Check for errors in the completed job
      if (statusBody.status.errorResult) {
        throw new Error(`BigQuery job failed: ${statusBody.status.errorResult.message}`);
      }

      Logger.log(`BigQuery job completed: ${jobId} (${statusBody.statistics.totalBytesProcessed || 0} bytes processed)`);

      // Get the results
      const resultsUrl = jobUrl + '/' + jobId + '/queryResults';
      const resultsResponse = UrlFetchApp.fetch(resultsUrl, {
        method: 'get',
        headers: {
          'Authorization': 'Bearer ' + token
        },
        muteHttpExceptions: true
      });

      const resultsBody = JSON.parse(resultsResponse.getContentText());
      return {
        totalRows: resultsBody.totalRows,
        schema: resultsBody.schema,
        rows: resultsBody.rows || []
      };
    }
  }

  throw new Error(`BigQuery job timed out after ${maxPolls * pollIntervalMs / 1000} seconds. Job ID: ${jobId}`);
}

/**
 * Attempts to execute generated queries directly against BigQuery.
 * @param {FieldPlan} fieldPlan - A FieldPlan instance
 * @param {number} rowNumber - The spreadsheet row number of this field plan
 * @returns {{ executed: boolean, results: Object[], error: string|null }}
 * @example executeQueriesForFieldPlan(FieldPlan.fromSpecificRow(5), 5)
 *   // => { executed: true, results: [{ type: 'Metadata SQL', totalRows: '1', success: true }], error: null }
 * @example executeQueriesForFieldPlan(fieldPlan, 5) // no credentials configured
 *   // => { executed: false, results: [], error: 'Service account credentials not configured' }
 */
function executeQueriesForFieldPlan(fieldPlan, rowNumber) {
  const result = {
    executed: false,
    results: [],
    error: null
  };

  // Check kill switch — BQ_EXECUTE_ENABLED must be 'true' in Script Properties
  const config = getQueryConfig();
  if (!config.runQueriesInBigQuery) {
    Logger.log('BigQuery execution disabled (BQ_EXECUTE_ENABLED != true). Email delivery only.');
    result.error = 'BigQuery execution disabled by config';
    return result;
  }

  const projectId = scriptProps.getProperty('SA_PROJECT_ID');
  if (!projectId) {
    Logger.log('SA_PROJECT_ID not set. Skipping direct execution. Email delivery only.');
    result.error = 'SA_PROJECT_ID not configured';
    return result;
  }

  // Check if service account credentials are configured
  const hasCredentials = scriptProps.getProperty('SA_CLIENT_EMAIL') && scriptProps.getProperty('SA_PRIVATE_KEY');
  if (!hasCredentials) {
    Logger.log('Service account credentials not configured. Skipping direct execution. Email delivery only.');
    result.error = 'Service account credentials not configured';
    return result;
  }

  // Find this org's queries in the query_queue sheet
  let queueSheet;
  try {
    queueSheet = getSheet('query_queue');
  } catch (e) {
    Logger.log('query_queue sheet not found. Skipping direct execution.');
    result.error = 'query_queue sheet not found';
    return result;
  }

  const queueData = queueSheet.getDataRange().getValues();
  const orgName = fieldPlan.memberOrgName;

  // QUERY_QUEUE_HEADERS column indices (0-based):
  // 0:Timestamp 1:OrgName 2:County 3:Precinct 4:ActivistCode
  // 5:QueryType 6:SQL 7:Status 8:RowNumber 9:CommitteeId 10:SubmittedBy
  const COL = { ORG: 1, TYPE: 5, SQL: 6, STATUS: 7 };

  // Find rows with pending queries for this org (skip header row)
  const matchingRows = queueData.reduce((acc, row, i) => {
    if (i > 0 && row[COL.ORG] === orgName && row[COL.STATUS] === 'pending') {
      acc.push(i + 1); // Convert to 1-indexed row number
    }
    return acc;
  }, []);

  if (matchingRows.length === 0) {
    Logger.log(`No pending queries found for ${orgName} in query_queue.`);
    result.error = 'No pending queries in queue';
    return result;
  }

  Logger.log(`Attempting direct execution of ${matchingRows.length} queries for ${orgName}`);

  let allSucceeded = true;

  matchingRows.forEach(queueRowNumber => {
    const queueRow = queueSheet.getRange(queueRowNumber, 1, 1, QUERY_QUEUE_HEADERS.length).getValues()[0];
    const queryType = queueRow[COL.TYPE] || 'unknown';
    const sqlValue = queueRow[COL.SQL];

    if (!sqlValue || sqlValue.toString().trim() === '') {
      Logger.log(`Skipping row ${queueRowNumber}: empty SQL`);
      return;
    }

    try {
      const queryResult = executeBigQuery(sqlValue.toString(), projectId);
      result.results.push({
        type: queryType,
        totalRows: queryResult.totalRows,
        success: true
      });
      Logger.log(`Executed ${queryType} for ${orgName}: ${queryResult.totalRows} rows`);
    } catch (execError) {
      Logger.log(`Failed to execute ${queryType} for ${orgName}: ${execError.message}`);
      result.results.push({
        type: queryType,
        error: execError.message,
        success: false
      });
      allSucceeded = false;
    }

    // Update status in query_queue (column 8 = 1-indexed for STATUS)
    const newStatus = allSucceeded ? 'executed' : 'failed';
    queueSheet.getRange(queueRowNumber, COL.STATUS + 1).setValue(newStatus);
  });

  result.executed = allSucceeded;
  if (!allSucceeded) {
    result.error = 'One or more queries failed during execution. Check logs for details.';
  }

  Logger.log(`Direct execution for ${orgName}: ${allSucceeded ? 'SUCCESS' : 'PARTIAL FAILURE'}`);
  return result;
}
