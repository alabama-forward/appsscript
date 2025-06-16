// BigQuery integration for Precinct Claim application

/**
 * CONFIGURATION SECTION
 * Update these values with your specific BigQuery details
 */
// Get configuration from script properties
const scriptProps = PropertiesService.getScriptProperties();

const BIGQUERY_CONFIG = {
  // Project ID for all BigQuery operations
  projectId: scriptProps.getProperty('BQ_PROJECT_ID') || 'prod-sv-al-898733e3',
  
  // Dataset for saving query history and results
  historyDataset: scriptProps.getProperty('BQ_HISTORY_DATASET') || 'alforward',
  historyTableId: scriptProps.getProperty('BQ_HISTORY_TABLE') || 'precinct_query_history',
  resultsTableId: scriptProps.getProperty('BQ_RESULTS_TABLE') || 'latest_query_results',
  
  // Catalist database datasets
  catalistConfig: {
    districtDataset: scriptProps.getProperty('BQ_CATALIST_DISTRICT_DATASET') || 'catalist_AL.District',
    personDataset: scriptProps.getProperty('BQ_CATALIST_PERSON_DATASET') || 'catalist_AL.Person',
    modelsDataset: scriptProps.getProperty('BQ_CATALIST_MODELS_DATASET') || 'catalist_AL.Models',
    historyDataset: scriptProps.getProperty('BQ_CATALIST_HISTORY_DATASET') || 'catalist_AL.Vote_History'
  },
  
  // Query timeout in milliseconds (5 minutes)
  queryTimeoutMs: parseInt(scriptProps.getProperty('BQ_QUERY_TIMEOUT_MS') || '300000')
};

/**
 * Helper function to save query history with claim information
 * 
 * @param {Object} queryResult - The results of the BigQuery query
 * @param {Object} claimInfo - Information about the claim being made
 * @return {Object} Result of the history tracking operation
 */
/**
 * Helper function to save query history with claim information
 * 
 * @param {Object} queryResult - The results of the BigQuery query
 * @param {Object} claimInfo - Information about the claim being made
 * @return {Object} Result of the history tracking operation
 */
function saveQueryHistoryWithClaimInfo(queryResult, claimInfo) {
  try {
    // Validate input parameters
    if (!queryResult) {
      throw new Error("Missing required parameter: queryResult");
    }
    
    if (!claimInfo) {
      throw new Error("Missing required parameter: claimInfo");
    }
    
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
    
    // Log claim info to verify it's being processed correctly
    Logger.log(`Processing claim info: county=${county}, precinct=${precinctNumber}, org=${orgName}, type=${claimType}, queryType=${queryType}`);
    
    // Safely extract the query from queryResult
    let sourceQuery = '';
    if (queryResult.query) {
      sourceQuery = queryResult.query;
    } else if (queryResult.details && queryResult.details.query) {
      sourceQuery = queryResult.details.query;
    }
    sourceQuery = sourceQuery.replace(/'/g, "'''");
    
    // Get current user email with error handling
    let userEmail;
    try {
      userEmail = Session.getEffectiveUser().getEmail();
    } catch (sessionError) {
      Logger.log("Warning: Unable to get user email: " + sessionError.toString());
      userEmail = "unknown_user@example.com";
    }
    
    // Insert claim information into the history table
    const insertHistoryQuery = `
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
        '''${sourceQuery}''',
        '${userEmail}'
      )
    `;
    
    // Execute the history tracking query
    const historyRequest = {
      query: insertHistoryQuery,
      useLegacySql: false
    };
    
    try {
      const historyResults = BigQuery.Jobs.query(historyRequest, projectId);
      
      // Verify the results indicate success
      if (historyResults.jobComplete) {
        Logger.log("Claim history recorded in BigQuery successfully");
        return {
          success: true,
          queryRunId: queryRunId,
          historyResults: historyResults
        };
      } else {
        throw new Error("BigQuery job did not complete");
      }
    } catch (bigQueryError) {
      throw new Error("BigQuery API error: " + bigQueryError.toString());
    }
    
  } catch (error) {
    const errorMessage = "Error recording claim history: " + error.toString();
    Logger.log(errorMessage);
    
    // Log additional information for debugging if available
    if (error.stack) {
      Logger.log("Stack trace: " + error.stack);
    }
    
    return {
      success: false,
      message: errorMessage,
      queryRunId: null,
      errorDetails: {
        timestamp: new Date().toISOString(),
        errorType: error.name || "Unknown",
        errorMessage: error.message || error.toString()
      }
    };
  }
}

// Simplified implementation for automatically running the voter targeting query after claims
// This approach requires minimal changes to the existing Code.js file

/**
 * Function to build a voter targeting SQL query using the search result row data
 * @param {Array} resultRowData - Array containing precinct data from the search result:
 *                               [county, precinctName, precinctNumber, municipality]
 * @param {Object} tableConfig - Configuration for BigQuery tables and datasets
 * @param {string} tableConfig.projectId - BigQuery project ID
 * @param {string} tableConfig.districtDataset - Dataset containing district table
 * @param {string} tableConfig.personDataset - Dataset containing person table
 * @param {string} tableConfig.modelsDataset - Dataset containing models table
 * @param {string} tableConfig.historyDataset - Dataset containing history table
 * @return {string} The constructed SQL query
 */
function buildVoterTargetingQuery(resultRowData, tableConfig = {}) {
  // Extract precinct information from the data
  const county = resultRowData[0] || '';
  const precinctName = resultRowData[1] || ''; // Not used in query but available
  const precinctNumber = resultRowData[2] || '';
  const municipality = resultRowData[3] || ''; // Not used in query but available
  
  // Set default project and dataset values if not provided
  const projectId = tableConfig.projectId || BIGQUERY_CONFIG.projectId;
  
  // Allow different datasets for each table
  const districtDataset = tableConfig.districtDataset || BIGQUERY_CONFIG.catalistConfig.districtDataset;
  const personDataset = tableConfig.personDataset || BIGQUERY_CONFIG.catalistConfig.personDataset;
  const modelsDataset = tableConfig.modelsDataset || BIGQUERY_CONFIG.catalistConfig.modelsDataset;
  const historyDataset = tableConfig.historyDataset || BIGQUERY_CONFIG.catalistConfig.historyDataset;
  
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
 * Function to execute the voter targeting query using precinct row data
 * This can be called from the claim functions when a precinct is claimed
 * 
 * @param {Array} resultRowData - Array containing precinct data from the search result:
 *                               [county, precinctName, precinctNumber, municipality]
 * @param {Object} config - Configuration for BigQuery setup (optional)
 * @param {string} config.projectId - BigQuery project ID
 * @param {Object} config.tableConfig - Configuration for BigQuery table datasets
 * @return {Object} The query results and metadata
 */
function executeVoterTargetingQuery(resultRowData, config = {}) {
  try {
    // Validate input parameters
    if (!resultRowData || !Array.isArray(resultRowData)) {
      throw new Error("Missing or invalid resultRowData: must be an array");
    }
    
    // Set up the BigQuery project and dataset information
    const projectId = config.projectId || BIGQUERY_CONFIG.projectId;
    
    // Create table configuration with datasets for each table
    const tableConfig = config.tableConfig || {
      projectId: projectId,
      districtDataset: BIGQUERY_CONFIG.catalistConfig.districtDataset,
      personDataset: BIGQUERY_CONFIG.catalistConfig.personDataset,
      modelsDataset: BIGQUERY_CONFIG.catalistConfig.modelsDataset,
      historyDataset: BIGQUERY_CONFIG.catalistConfig.historyDataset
    };
    
    // Extract precinct information for logging and validation
    const county = resultRowData[0] || '';
    const precinctName = resultRowData[1] || '';
    const precinctNumber = resultRowData[2] || '';
    const municipality = resultRowData[3] || '';
    
    // Additional validation - ensure we have minimum required data
    if (!county && !precinctNumber) {
      throw new Error("Insufficient data: need at least county or precinct number");
    }
    
    // Build the query using the precinct data and table configuration
    try {
      Logger.log("Building voter targeting query for precinct: " + precinctNumber);
      var query = buildVoterTargetingQuery(resultRowData, tableConfig);
      Logger.log("Successfully built query: " + query.substring(0, 100) + "..."); // Log first 100 chars
    } catch (queryBuildError) {
      Logger.log("Error building query: " + queryBuildError.toString());
      throw new Error("Failed to build query: " + queryBuildError.toString());
    }
    
    // Prepare query request
    const request = {
      query: query,
      useLegacySql: false,
      // Add timeout option to prevent long-running queries
      timeoutMs: BIGQUERY_CONFIG.queryTimeoutMs // Timeout from configuration
    };
    
    // FORCE EXECUTION - Add additional logging to ensure execution
    Logger.log("About to execute BigQuery query with request: " + JSON.stringify(request));
    Logger.log("Using projectId: " + projectId);
    
    // Execute the query with error handling
    let queryResults;
    try {
      Logger.log("Executing BigQuery query now...");
      queryResults = BigQuery.Jobs.query(request, projectId);
      Logger.log("BigQuery query execution complete, checking results...");
      
      // Verify the query execution was successful
      if (!queryResults) {
        Logger.log("Error: Query returned null results");
        throw new Error("Query returned no results");
      }
      
      // Check for errors in the query results
      if (queryResults.errors && queryResults.errors.length > 0) {
        Logger.log("Query execution errors: " + JSON.stringify(queryResults.errors));
        throw new Error("Query execution errors: " + JSON.stringify(queryResults.errors));
      }
      
      Logger.log("Query execution validated successfully!");
    } catch (queryError) {
      Logger.log("BigQuery query execution failed: " + queryError.toString());
      throw new Error("BigQuery query execution failed: " + queryError.toString());
    }
    
    // Log the results
    Logger.log("Voter targeting query executed for precinct " + precinctNumber + " in " + county);
    Logger.log("Query returned " + (queryResults.rows ? queryResults.rows.length : 0) + " rows");
    
    // Save query history with enhanced error handling
    try {
      const claimInfo = {
        queryType: 'voter_targeting',
        county: county,
        precinctName: precinctName,
        precinctNumber: precinctNumber,
        municipality: municipality
      };
      saveQueryHistoryWithClaimInfo(queryResults, claimInfo);
      
      // Additional logging to confirm query history is being saved
      Logger.log("Successfully saved BigQuery history with claim info: " + JSON.stringify(claimInfo));
    } catch (historyError) {
      // Log but don't fail the entire operation if history recording fails
      Logger.log("Warning: Failed to save query history: " + historyError.toString());
    }
    
    return {
      success: true,
      message: "Voter targeting query executed successfully",
      details: queryResults,
      queryText: query,
      rowCount: queryResults.rows ? queryResults.rows.length : 0,
      timestamp: new Date().toISOString(),
      executionTime: queryResults.statistics && queryResults.statistics.endTime ? 
                     (new Date(queryResults.statistics.endTime) - new Date(queryResults.statistics.startTime)) / 1000 + " seconds" : 
                     "unknown"
    };
  } catch (error) {
    const errorMessage = "Error executing voter targeting query: " + error.toString();
    Logger.log(errorMessage);
    
    // Log additional debug information
    if (error.stack) {
      Logger.log("Stack trace: " + error.stack);
    }
    
    return {
      success: false,
      message: errorMessage,
      errorDetails: {
        timestamp: new Date().toISOString(),
        errorType: error.name || "Unknown",
        errorMessage: error.message || error.toString(),
        county: resultRowData && resultRowData[0] ? resultRowData[0] : 'unknown',
        precinctNumber: resultRowData && resultRowData[2] ? resultRowData[2] : 'unknown'
      }
    };
  }
}


/**
 * Function to save BigQuery results to another BigQuery table by appending rows
 * @param {Object} queryResult - The results from a BigQuery query
 * @param {Object} options - Options for the save operation
 * @return {Object} Information about the save operation
 */
function saveQueryResultsToBigQueryTable(queryResult, options = {}) {
  try {
    // Validate input parameters
    if (!queryResult) {
      throw new Error("Missing required parameter: queryResult");
    }
    
    // Check if we have valid results to save
    if (!queryResult.success || !queryResult.details || !queryResult.details.rows) {
      return {
        success: false,
        message: "No valid query results to save to BigQuery table",
        errorDetails: {
          timestamp: new Date().toISOString(),
          reason: !queryResult.success ? "Query was unsuccessful" :
                 !queryResult.details ? "Query details missing" :
                 !queryResult.details.rows ? "Query returned no rows" : "Unknown reason"
        }
      };
    }
    
    // Set up the BigQuery project and dataset information with validation
    const projectId = options.projectId || BIGQUERY_CONFIG.projectId;
    if (!projectId) {
      throw new Error("Invalid project ID");
    }
    
    const datasetId = options.datasetId || BIGQUERY_CONFIG.historyDataset;
    if (!datasetId) {
      throw new Error("Invalid dataset ID");
    }
    
    const tableId = options.tableId || BIGQUERY_CONFIG.historyTableId; // Use a consistent table for query history
    const resultsTableId = options.resultsTableId || BIGQUERY_CONFIG.resultsTableId; // Table for the actual query results
    
    // Extract the query that was run and generate unique run ID
    let sourceQuery = "";
    if (queryResult.details && queryResult.details.query) {
      sourceQuery = queryResult.details.query;
    } else if (queryResult.queryText) {
      sourceQuery = queryResult.queryText;
    }
    
    const queryRunId = 'run_' + new Date().getTime(); // Unique ID for this query run
    const timestamp = new Date().toISOString();
    
    // Function to safely escape SQL strings
    const escapeSQL = (value) => {
      if (value === null || value === undefined) return '';
      return String(value).replace(/'/g, "''");
    };
    
    // Get information about the query results with validation
    let schema = [];
    let rows = [];
    let rowCount = 0;
    
    if (queryResult.details && queryResult.details.schema && queryResult.details.schema.fields) {
      schema = queryResult.details.schema.fields;
    } else {
      Logger.log("Warning: Missing schema in query results");
    }
    
    if (queryResult.details && queryResult.details.rows) {
      rows = queryResult.details.rows;
      rowCount = rows.length;
    } else {
      Logger.log("Warning: Missing rows in query results");
    }
    
    // Get organization and claim information if available - with SQL escaping
    const orgName = escapeSQL(options.orgName || '');
    const claimType = escapeSQL(options.claimType || '');
    const county = escapeSQL(options.county || '');
    const precinctName = escapeSQL(options.precinctName || '');
    const precinctNumber = escapeSQL(options.precinctNumber || '');
    const municipality = escapeSQL(options.municipality || '');
    
    // STEP 1: First check if the results table exists and create it if not
    let resultsQuery;
    let needToCreateTable = true;
    
    try {
      // Check if the results table exists
      const checkResultsTableQuery = `
        -- Check if the results table exists
        SELECT table_name 
        FROM \`${projectId}.${datasetId}.INFORMATION_SCHEMA.TABLES\` 
        WHERE table_name = '${resultsTableId}'
      `;
      
      const checkResultsRequest = {
        query: checkResultsTableQuery,
        useLegacySql: false
      };
      
      const checkResultsResponse = BigQuery.Jobs.query(checkResultsRequest, projectId);
      
      // Update flag based on response
      needToCreateTable = !checkResultsResponse.rows || checkResultsResponse.rows.length === 0;
    } catch (tableCheckError) {
      Logger.log("Error checking if results table exists: " + tableCheckError.toString());
      // Assume we need to create table if check fails
      needToCreateTable = true;
    }
    
    // Build query based on available data
    try {
      if (sourceQuery) {
        // If we have the original query, run it and append results to the existing table
        if (needToCreateTable) {
          // Need to create the table first
          resultsQuery = `
            -- Create the results table and insert initial data with run_id and timestamp
            CREATE TABLE \`${projectId}.${datasetId}.${resultsTableId}\` AS
            SELECT 
              '${queryRunId}' as run_id,
              TIMESTAMP('${timestamp}') as timestamp,
              *
            FROM (${sourceQuery})
          `;
        } else {
          // Table exists, append to it
          resultsQuery = `
            -- Append new results to the existing table with run_id and timestamp
            INSERT INTO \`${projectId}.${datasetId}.${resultsTableId}\`
            SELECT 
              '${queryRunId}' as run_id,
              TIMESTAMP('${timestamp}') as timestamp,
              *
            FROM (${sourceQuery})
          `;
        }
      } else if (schema.length > 0 && rows.length > 0) {
        // If we don't have the original query but have schema and rows
        // Get column names and types for table creation
        const columnDefinitions = schema.map(field => `${field.name} ${field.type}`).join(',\n');
        const columnNames = schema.map(field => field.name).join(', ');
        
        // Create values statements for each row with proper error handling
        let valueStatements = [];
        for (let i = 0; i < rows.length; i++) {
          try {
            const row = rows[i];
            // Skip invalid rows
            if (!row || !row.f || row.f.length !== schema.length) {
              Logger.log(`Warning: Skipping row ${i} due to invalid format`);
              continue;
            }
            
            const values = schema.map((field, index) => {
              try {
                const value = row.f[index].v;
                
                // Format the value based on its type
                switch (field.type) {
                  case 'STRING':
                    return value !== null ? `'${String(value).replace(/'/g, "''")}'` : 'NULL'; // Escape single quotes
                  case 'TIMESTAMP':
                    return value !== null ? `TIMESTAMP('${value}')` : 'NULL';
                  default:
                    return value !== null ? value : 'NULL';
                }
              } catch (valueError) {
                Logger.log(`Warning: Error processing value for field ${field.name}: ${valueError.toString()}`);
                return 'NULL';
              }
            }).join(', ');
            
            valueStatements.push(`(${values})`);
          } catch (rowError) {
            Logger.log(`Warning: Error processing row ${i}: ${rowError.toString()}`);
            // Continue with next row
          }
        }
        
        // If we have any valid value statements
        if (valueStatements.length > 0) {
          const valuesString = valueStatements.join(',\n');
          
          if (needToCreateTable) {
            // Need to create the table and insert initial data
            resultsQuery = `
              -- Create the results table with run_id and timestamp columns
              CREATE TABLE \`${projectId}.${datasetId}.${resultsTableId}\` (
                run_id STRING,
                timestamp TIMESTAMP,
                ${columnDefinitions}
              );
              
              -- Insert the query results with run ID and timestamp
              INSERT INTO \`${projectId}.${datasetId}.${resultsTableId}\` (run_id, timestamp, ${columnNames})
              SELECT 
                '${queryRunId}' as run_id,
                TIMESTAMP('${timestamp}') as timestamp,
                *
              FROM UNNEST([
                ${valuesString}
              ]) as temp
            `;
          } else {
            // Table exists, just insert the new data
            resultsQuery = `
              -- Insert the query results with run ID and timestamp
              INSERT INTO \`${projectId}.${datasetId}.${resultsTableId}\` (run_id, timestamp, ${columnNames})
              SELECT 
                '${queryRunId}' as run_id,
                TIMESTAMP('${timestamp}') as timestamp,
                *
              FROM UNNEST([
                ${valuesString}
              ]) as temp
            `;
          }
        } else {
          Logger.log("Warning: No valid rows to insert");
          resultsQuery = null;
        }
      } else {
        Logger.log("No data to save: missing schema or rows");
        resultsQuery = null; // No data to save
      }
    } catch (queryBuildError) {
      Logger.log("Error building results query: " + queryBuildError.toString());
      throw new Error("Failed to build results query: " + queryBuildError.toString());
    }
    
    // STEP 2: Append metadata about this query run to the history table
    
    // Check if the history table exists and create it if not
    let historyTableExists = false;
    try {
      const checkTableQuery = `
        -- Check if the history table exists
        SELECT table_name 
        FROM \`${projectId}.${datasetId}.INFORMATION_SCHEMA.TABLES\` 
        WHERE table_name = '${tableId}'
      `;
      
      const checkRequest = {
        query: checkTableQuery,
        useLegacySql: false
      };
      
      const checkResults = BigQuery.Jobs.query(checkRequest, projectId);
      historyTableExists = checkResults.rows && checkResults.rows.length > 0;
    } catch (historyTableCheckError) {
      Logger.log("Error checking history table: " + historyTableCheckError.toString());
      historyTableExists = false;
    }
    
    // Get user email with error handling
    let userEmail;
    try {
      userEmail = Session.getEffectiveUser().getEmail();
    } catch (sessionError) {
      Logger.log("Warning: Unable to get user email: " + sessionError.toString());
      userEmail = "unknown_user@example.com";
    }
    
    // Escape options JSON for SQL
    let optionsJson;
    try {
      optionsJson = JSON.stringify(options).replace(/'/g, "''");
    } catch (jsonError) {
      Logger.log("Warning: Error stringifying options: " + jsonError.toString());
      optionsJson = "{}";
    }
    
    // Create the history table if it doesn't exist
    let historyResults, queryResults;
    try {
      if (!historyTableExists) {
        const createHistoryTableQuery = `
          -- Create a table to store query history with claim info
          CREATE TABLE \`${projectId}.${datasetId}.${tableId}\` (
            run_id STRING,
            timestamp TIMESTAMP,
            org_name STRING,
            claim_type STRING,
            county STRING,
            precinct_name STRING,
            precinct_number STRING,
            municipality STRING,
            source_query STRING,
            row_count INT64,
            run_by STRING,
            parameters STRING,
            results_table STRING
          )
        `;
        
        const createRequest = {
          query: createHistoryTableQuery,
          useLegacySql: false
        };
        
        BigQuery.Jobs.query(createRequest, projectId);
      }
      
      // Now, insert a record about this query run into the history table
      const insertHistoryQuery = `
        -- Insert metadata about this query run including claim info
        INSERT INTO \`${projectId}.${datasetId}.${tableId}\` 
        (run_id, timestamp, org_name, claim_type, county, precinct_name, precinct_number, municipality, source_query, row_count, run_by, parameters, results_table)
        VALUES(
          '${queryRunId}',
          TIMESTAMP('${timestamp}'),
          '${orgName}',
          '${claimType}',
          '${county}',
          '${precinctName}',
          '${precinctNumber}',
          '${municipality}',
          '''${sourceQuery.replace(/'/g, "'''")}''', -- Triple quote escape for SQL strings
          ${rowCount},
          '${userEmail}',
          '${optionsJson}',
          '${resultsTableId}'
        )
      `;
      
      // Insert into history table
      const historyRequest = {
        query: insertHistoryQuery,
        useLegacySql: false
      };
      
      historyResults = BigQuery.Jobs.query(historyRequest, projectId);
      
      // Verify history insertion completed successfully
      if (!historyResults.jobComplete) {
        Logger.log("Warning: History table insertion job did not complete");
      }
    } catch (historyError) {
      Logger.log("Error inserting into history table: " + historyError.toString());
      throw new Error("Failed to insert into history table: " + historyError.toString());
    }
    
    // Save the results if we have a query
    if (resultsQuery) {
      try {
        const resultsRequest = {
          query: resultsQuery,
          useLegacySql: false,
          // Add timeout to prevent very long queries
          timeoutMs: BIGQUERY_CONFIG.queryTimeoutMs
        };
        
        queryResults = BigQuery.Jobs.query(resultsRequest, projectId);
        
        // Verify query execution completed
        if (!queryResults.jobComplete) {
          Logger.log("Warning: Results table query job did not complete");
        }
      } catch (resultsError) {
        Logger.log("Error saving to results table: " + resultsError.toString());
        // Don't fail the whole operation if results saving fails
        // but we did successfully save to history table
        return {
          success: true,
          message: "Query metadata saved to history table, but results table update failed: " + resultsError.toString(),
          historyTableId: tableId,
          resultsTableId: resultsTableId,
          queryRunId: queryRunId,
          rowCount: rowCount,
          historyResults: historyResults,
          partialSuccess: true
        };
      }
    }
    
    Logger.log("Query metadata with claim info appended to history table: " + tableId);
    if (resultsQuery) {
      Logger.log("Query results appended to results table: " + resultsTableId);
    } else {
      Logger.log("No results saved to results table (no data or query available)");
    }
    
    // Return information about the save operation
    return {
      success: true,
      message: "Query results" + (resultsQuery ? " appended to results table and" : "") + " metadata saved to history table",
      historyTableId: tableId,
      resultsTableId: resultsTableId,
      queryRunId: queryRunId,
      rowCount: rowCount,
      timestamp: timestamp,
      historyResults: historyResults,
      queryResults: queryResults
    };
  } catch (error) {
    const errorMessage = "Error saving query results to BigQuery table: " + error.toString();
    Logger.log(errorMessage);
    
    // Log additional information for debugging
    if (error.stack) {
      Logger.log("Stack trace: " + error.stack);
    }
    
    return {
      success: false,
      message: errorMessage,
      errorDetails: {
        timestamp: new Date().toISOString(),
        errorType: error.name || "Unknown",
        errorMessage: error.message || error.toString()
      }
    };
  }
}

//
// Note: Menu functionality has been removed. 
// The voter targeting query will now only run automatically when claims are successful.
//

/**
 * Override for the original claimItemForOrg function from Code.js
 * You need to modify the onEdit function in Code.js to use this function instead
 * by changing the line: let claimResult = claimItemForOrganization(actualRowIndex, selectedOrg, resultRowData, claimType);
 * to: let claimResult = claimItemForOrganizationWithBigQuery(actualRowIndex, selectedOrg, resultRowData, claimType);
 * 
 * @param {number} originalRowIndex - Row index in the original sheet (priorities)
 * @param {string} orgName - Name of the organization making the claim
 * @param {Array} resultRowData - Data from the search result row
 * @param {string} claimType - Whether this is the "first" or "second" claim
 * @param {Object} bigQueryConfig - Configuration for BigQuery (optional)
 * @return {string} Status of the claim operation
 */
function claimItemForOrganizationWithBigQuery(originalRowIndex, orgName, resultRowData, claimType, bigQueryConfig) {
  try {
    // Validate input parameters
    if (typeof originalRowIndex !== 'number' || originalRowIndex < 1) {
      throw new Error("Invalid row index: " + originalRowIndex);
    }
    
    if (!orgName) {
      throw new Error("Missing organization name");
    }
    
    if (!resultRowData || !Array.isArray(resultRowData) || resultRowData.length < 1) {
      throw new Error("Invalid result row data");
    }
    
    if (!claimType || (claimType !== "first" && claimType !== "second")) {
      throw new Error("Invalid claim type: must be 'first' or 'second'");
    }
    
    // First, call the original claim function with error handling
    let claimResult;
    try {
      claimResult = claimItemForOrganization(originalRowIndex, orgName, resultRowData, claimType);
    } catch (claimError) {
      Logger.log("Error in original claim function: " + claimError.toString());
      throw new Error("Failed to process claim: " + claimError.toString());
    }
    
    // Default BigQuery configuration
    const config = bigQueryConfig || {
      projectId: BIGQUERY_CONFIG.projectId,
      tableConfig: {
        districtDataset: BIGQUERY_CONFIG.catalistConfig.districtDataset,
        personDataset: BIGQUERY_CONFIG.catalistConfig.personDataset,
        modelsDataset: BIGQUERY_CONFIG.catalistConfig.modelsDataset,
        historyDataset: BIGQUERY_CONFIG.catalistConfig.historyDataset
      },
      historyConfig: {
        datasetId: BIGQUERY_CONFIG.historyDataset,
        tableId: BIGQUERY_CONFIG.historyTableId
      },
      resultsConfig: {
        datasetId: BIGQUERY_CONFIG.historyDataset,
        tableId: 'voter_targeting_results' // Specific results table for targeting
      }
    };
    
    // Get user email for notifications - use multiple methods to ensure we get a valid email
    let userEmail = scriptProps.getProperty('EMAIL_FALLBACK') || "gabri@alforward.org"; // Default fallback
    
    // Try different methods to get user email
    try {
      // Method 1: Try getActiveUser
      const activeEmail = Session.getActiveUser().getEmail();
      if (activeEmail && activeEmail.indexOf('@') > 0) {
        userEmail = activeEmail;
        Logger.log("Got email from getActiveUser: " + userEmail);
      } else {
        // Method 2: Try getEffectiveUser
        const effectiveEmail = Session.getEffectiveUser().getEmail();
        if (effectiveEmail && effectiveEmail.indexOf('@') > 0) {
          userEmail = effectiveEmail;
          Logger.log("Got email from getEffectiveUser: " + userEmail);
        } else {
          Logger.log("Both getActiveUser and getEffectiveUser returned invalid emails, using fallback");
        }
      }
    } catch (emailError) {
      Logger.log("Error getting user email: " + emailError.toString());
    }
    
    // Always CC the data team for redundancy
    const ccEmail = (scriptProps.getProperty('EMAIL_RECIPIENTS') || 'datateam@alforward.org').split(',')[0];
    
    Logger.log("Using email address for notifications: " + userEmail);
    
    // If the claim was successful, run the voter targeting query
    if (claimResult === "success") {
      try {
        // Extract precinct information for better error context
        const county = resultRowData[0] || 'unknown';
        const precinctName = resultRowData[1] || 'unknown';
        const precinctNumber = resultRowData[2] || 'unknown';
        const municipality = resultRowData[3] || '';
        
        Logger.log(`Running voter targeting query for ${county}, precinct ${precinctNumber} claimed by ${orgName}`);
        
        // Create claimInfo object to be used for the query history
        const claimInfo = {
          queryType: 'voter_targeting',
          county: county,
          precinctName: precinctName,
          precinctNumber: precinctNumber,
          municipality: municipality,
          orgName: orgName,
          claimType: claimType
        };
        
        // Force execution of the voter targeting query with extra logging
        Logger.log("About to execute voter targeting query - this should run!"); 
        const voterQueryResult = executeVoterTargetingQuery(resultRowData, config);
        Logger.log("Voter targeting query execution complete");
        
        // Send email with query results
        const emailSubject = `BigQuery Results: Precinct ${precinctNumber} in ${county} Claim`;
        const emailBody = `
          <html>
          <body>
            <h2>BigQuery Voter Targeting Query Results</h2>
            <p><strong>Status:</strong> ${voterQueryResult.success ? "SUCCESS" : "FAILED"}</p>
            <p><strong>Organization:</strong> ${orgName}</p>
            <p><strong>Claim Type:</strong> ${claimType}</p>
            <p><strong>County:</strong> ${county}</p>
            <p><strong>Precinct Number:</strong> ${precinctNumber}</p>
            <p><strong>Precinct Name:</strong> ${precinctName}</p>
            <p><strong>Municipality:</strong> ${municipality}</p>
            <p><strong>Results Count:</strong> ${voterQueryResult.rowCount || 0} rows returned</p>
            <p><strong>Execution Time:</strong> ${voterQueryResult.executionTime || "unknown"}</p>
            <p><strong>Timestamp:</strong> ${voterQueryResult.timestamp || new Date().toISOString()}</p>
            <p>This is an automated message from the Precinct Claim BigQuery Integration.</p>
          </body>
          </html>
        `;
        
        // Send the email with debugging info
        try {
          // Log email details before sending
          Logger.log("Preparing to send BigQuery results email:");
          Logger.log("- To: " + userEmail);
          Logger.log("- CC: " + ccEmail);
          Logger.log("- Subject: " + emailSubject);
          
          // Try to determine script identity/permissions
          try {
            const scriptIdentity = Session.getEffectiveUser().getEmail();
            Logger.log("- Script running as: " + scriptIdentity);
          } catch (identityError) {
            Logger.log("- Unable to determine script identity: " + identityError.toString());
          }
          
          // Attempt to send the email
          MailApp.sendEmail({
            to: userEmail,
            cc: ccEmail, // CC the data team
            subject: emailSubject,
            htmlBody: emailBody
          });
          
          Logger.log(`SUCCESS: BigQuery results email sent to ${userEmail}`);
        } catch (emailError) {
          Logger.log("ERROR: Failed to send BigQuery results email: " + emailError.toString());
          
          // Try to determine if it's a permissions issue
          if (emailError.toString().indexOf("permission") > -1 || 
              emailError.toString().indexOf("authorization") > -1) {
            Logger.log("This appears to be a permissions issue. The script may need additional authorization.");
          }
        }
        
        // Save query history with claim information
        saveQueryHistoryWithClaimInfo(voterQueryResult, claimInfo);
        
        // Record results in BigQuery for tracking
        try {
          // Save additional metadata about this claim operation
          saveQueryResultsToBigQueryTable(voterQueryResult, {
            orgName: orgName,
            claimType: claimType,
            county: county,
            precinctName: precinctName,
            precinctNumber: precinctNumber,
            municipality: municipality,
            resultsTableId: config.resultsConfig.tableId,
            operation: 'claim_with_targeting'
          });
        } catch (saveError) {
          // Just log the error, don't change the claim result
          Logger.log("Error saving targeting results: " + saveError.toString());
        }
        
        // Log the result but don't change the return value
        Logger.log("Voter targeting query executed automatically for claimed precinct: " +
                  (voterQueryResult.success ? "Success" : "Failed") +
                  " - Results: " + (voterQueryResult.rowCount || 0));
                  
      } catch (error) {
        // Log detailed error information but don't change the claim result
        Logger.log("Error executing voter targeting query: " + error.toString());
        if (error.stack) {
          Logger.log("Stack trace: " + error.stack);
        }
        
        // Extract precinct information for error context
        const county = resultRowData[0] || 'unknown';
        const precinctName = resultRowData[1] || 'unknown';
        const precinctNumber = resultRowData[2] || 'unknown';
        const municipality = resultRowData[3] || '';
        
        // Send failure email
        const errorEmailSubject = `FAILED: BigQuery for Precinct ${precinctNumber} in ${county}`;
        const errorEmailBody = `
          <html>
          <body>
            <h2>BigQuery Voter Targeting Query Failed</h2>
            <p><strong>Status:</strong> ERROR</p>
            <p><strong>Organization:</strong> ${orgName}</p>
            <p><strong>Claim Type:</strong> ${claimType}</p>
            <p><strong>County:</strong> ${county}</p>
            <p><strong>Precinct Number:</strong> ${precinctNumber}</p>
            <p><strong>Precinct Name:</strong> ${precinctName}</p>
            <p><strong>Error:</strong> ${error.toString()}</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p>Please contact the administrator to resolve this issue.</p>
          </body>
          </html>
        `;
        
        // Send the error email
        try {
          MailApp.sendEmail({
            to: userEmail,
            cc: ccEmail, // CC the data team
            subject: errorEmailSubject,
            htmlBody: errorEmailBody
          });
          Logger.log(`BigQuery error email sent to ${userEmail}`);
        } catch (emailError) {
          Logger.log("Error sending BigQuery error email: " + emailError.toString());
        }
        
        // Try to log the error to BigQuery for tracking
        try {
          saveQueryHistoryWithClaimInfo({
            query: "Failed targeting query",
            error: error.toString()
          }, {
            queryType: 'voter_targeting_error',
            county: county,
            precinctName: precinctName,
            precinctNumber: precinctNumber,
            municipality: municipality,
            orgName: orgName,
            claimType: claimType,
            errorDetails: error.toString()
          });
        } catch (historyError) {
          // Just log the error
          Logger.log("Error logging targeting failure: " + historyError.toString());
        }
      }
    } else {
      // Claim wasn't successful - send notification email
      const county = resultRowData[0] || 'unknown';
      const precinctName = resultRowData[1] || 'unknown';
      const precinctNumber = resultRowData[2] || 'unknown';
      
      const claimStatusEmailSubject = `Claim Status: ${claimResult} - Precinct ${precinctNumber} in ${county}`;
      const claimStatusEmailBody = `
        <html>
        <body>
          <h2>Precinct Claim Status</h2>
          <p><strong>Status:</strong> ${claimResult}</p>
          <p><strong>Organization:</strong> ${orgName}</p>
          <p><strong>Claim Type:</strong> ${claimType}</p>
          <p><strong>County:</strong> ${county}</p>
          <p><strong>Precinct Number:</strong> ${precinctNumber}</p>
          <p><strong>Note:</strong> BigQuery targeting was not run because the claim was not successful.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        </body>
        </html>
      `;
      
      // Send the claim status email
      try {
        MailApp.sendEmail({
          to: userEmail,
          cc: ccEmail, // CC the data team
          subject: claimStatusEmailSubject,
          htmlBody: claimStatusEmailBody
        });
        Logger.log(`Claim status email sent to ${userEmail}`);
      } catch (emailError) {
        Logger.log("Error sending claim status email: " + emailError.toString());
      }
    }
    
    // Return the original claim result
    return claimResult;
    
  } catch (error) {
    // Log detailed error information
    const errorMessage = "Error in claimItemForOrganizationWithBigQuery: " + error.toString();
    Logger.log(errorMessage);
    
    if (error.stack) {
      Logger.log("Stack trace: " + error.stack);
    }
    
    // Try to send error email
    try {
      let criticalEmail = scriptProps.getProperty('EMAIL_FALLBACK') || "gabri@alforward.org"; // Default email for critical errors
      
      // Try to get a valid user email for the error notification
      try {
        const activeEmail = Session.getActiveUser().getEmail();
        if (activeEmail && activeEmail.indexOf('@') > 0) {
          criticalEmail = activeEmail;
        } else {
          const effectiveEmail = Session.getEffectiveUser().getEmail();
          if (effectiveEmail && effectiveEmail.indexOf('@') > 0) {
            criticalEmail = effectiveEmail;
          }
        }
      } catch (emailErr) {
        Logger.log("Using default email for critical error notification");
      }
      
      MailApp.sendEmail({
        to: criticalEmail,
        cc: (scriptProps.getProperty('EMAIL_RECIPIENTS') || 'datateam@alforward.org').split(',')[0],
        subject: "ERROR: BigQuery Precinct Claim Integration",
        htmlBody: `
          <html>
          <body>
            <h2>Critical Error in BigQuery Integration</h2>
            <p><strong>Error:</strong> ${error.toString()}</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p>Please contact the administrator to resolve this issue.</p>
          </body>
          </html>
        `
      });
      Logger.log("Critical error email sent to " + userEmail);
    } catch (emailError) {
      Logger.log("Could not send critical error email: " + emailError.toString());
    }
    
    // Return error status
    return "error";
  }
}