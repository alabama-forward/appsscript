/**
 * Query Builder — Orchestration
 *
 * Main entry point for generating BigQuery queries from a field plan.
 * This file coordinates the resolvers (query_resolvers.js) and SQL
 * template builders (query_sql_templates.js) to produce complete
 * query sets for each field plan submission.
 *
 * The only function other files need to call is:
 *   generateQueriesForFieldPlan(fieldPlan, rowNumber)
 *
 * Everything else in this file is an implementation detail.
 *
 * Output channels:
 *   1. Email: SQL in <pre> blocks sent to the data team
 *   2. query_queue sheet: one row per precinct with SQL + metadata
 *   3. field_plan sheet: summary + status written to the submission row
 *
 * Last Updated: 2026-02-23
 */

// =============================================================================
// MAIN ENTRY POINT
// =============================================================================

/**
 * Generates all BigQuery queries for a single field plan submission and writes results to sheets.
 * @param {FieldPlan} fieldPlan - A FieldPlan instance from the current row
 * @param {number} rowNumber - 1-based row number in the field plan sheet
 * @returns {{ success: boolean, orgName: string, queryCount: number, queries: Array, summary: string, vanId: Object, errors: string[] }}
 * @example generateQueriesForFieldPlan(FieldPlan.fromSpecificRow(5), 5)
 *   // => { success: true, orgName: 'SABWR', queryCount: 9, queries: [...], summary: '...', vanId: { found: true, committeeId: '12345' }, errors: [] }
 * @example generateQueriesForFieldPlan(FieldPlan.fromSpecificRow(2), 2)
 *   // => { success: true, orgName: 'Unknown Org', queryCount: 0, queries: [], summary: '...', vanId: { found: false }, errors: ['No counties specified...'] }
 */
function generateQueriesForFieldPlan(fieldPlan, rowNumber) {
  const result = {
    success: false,
    orgName: fieldPlan.memberOrgName || 'Unknown Org',
    queryCount: 0,
    queries: [],
    summary: '',
    vanId: null,
    errors: []
  };

  try {
    Logger.log(`=== GENERATING QUERIES FOR: ${result.orgName} (row ${rowNumber}) ===`);

    // Step 1: Resolve VAN committee ID
    const vanId = resolveVanId(result.orgName);
    result.vanId = vanId;
    if (!vanId.found) {
      result.errors.push(`No VAN committee ID found for "${result.orgName}". Queries will be generated without committee ID.`);
      Logger.log(`WARNING: No VAN ID match for "${result.orgName}"`);
    }

    // Step 2: Resolve demographics
    const raceData = mapRaceDemographics(fieldPlan.demoRace || []);
    const ageData = mapAgeDemographics(fieldPlan.demoAge || []);

    // Step 3: Build resolved data object shared by both paths
    const resolvedData = {
      orgName: result.orgName,
      vanId: vanId,
      raceData: raceData,
      ageData: ageData,
      rowNumber: rowNumber,
      queryType: getQueryConfig().queryTypeDefault
    };

    // Step 4: Route to correct query path
    const knowsPrecincts = fieldPlan.knowsPrecincts || '';
    const hasPrecincts = knowsPrecincts.toString().trim().toLowerCase().includes('yes');

    if (hasPrecincts && fieldPlan.fieldPrecincts && fieldPlan.fieldPrecincts.length > 0) {
      Logger.log(`Path: PRECINCT-LEVEL queries (${fieldPlan.fieldPrecincts.length} precincts)`);
      const precinctQueries = generatePrecinctQueries(fieldPlan, resolvedData);
      result.queries = precinctQueries.queries;
      result.errors = result.errors.concat(precinctQueries.errors);
    } else {
      Logger.log('Path: EXPLORATION queries (no precincts specified)');
      const explorationQueries = generateExplorationQueries(fieldPlan, resolvedData);
      result.queries = explorationQueries.queries;
      result.errors = result.errors.concat(explorationQueries.errors);
    }

    result.queryCount = result.queries.length;

    // Step 5: Write to query_queue sheet
    result.queries.forEach((query, i) => {
      try {
        writeToQueryQueue(query);
      } catch (queueError) {
        result.errors.push(`Failed to write query ${i + 1} to queue: ${queueError.message}`);
        Logger.log(`Error writing to query queue: ${queueError.message}`);
      }
    });

    // Step 6: Build summary and write to field plan sheet
    result.summary = formatQuerySummary(resolvedData, result.queries, result.errors);

    try {
      writeToFieldPlanSheet(rowNumber, result.summary);
    } catch (sheetError) {
      result.errors.push(`Failed to write summary to field plan sheet: ${sheetError.message}`);
      Logger.log(`Error writing to field plan sheet: ${sheetError.message}`);
    }

    result.success = true;
    Logger.log(`=== QUERY GENERATION COMPLETE: ${result.queryCount} queries for ${result.orgName} ===`);

  } catch (error) {
    result.errors.push(`Critical error: ${error.message}`);
    result.summary = `ERROR: Query generation failed for ${result.orgName}. ${error.message}`;
    Logger.log(`CRITICAL ERROR in generateQueriesForFieldPlan: ${error.message}`);
  }

  return result;
}

// =============================================================================
// PRECINCT-LEVEL QUERY GENERATION
// =============================================================================

/**
 * Generates 3 queries (metadata MERGE, precinct list MERGE, DWID SELECT) per precinct.
 * @param {FieldPlan} fieldPlan - The field plan instance
 * @param {Object} resolvedData - Shared resolved data from the main function
 * @returns {{ queries: Array, errors: string[] }}
 * @example generatePrecinctQueries(fieldPlan, resolvedData)
 *   // => { queries: [{ type: 'metadata_merge', sql: '...', county: 'HOUSTON', precinct: '00182' }, ...], errors: [] }
 * @example generatePrecinctQueries(fieldPlanWithBadCounty, resolvedData)
 *   // => { queries: [], errors: ['Invalid county "HOUTON" for precinct "00182", skipping'] }
 */
function generatePrecinctQueries(fieldPlan, resolvedData) {
  const counties = fieldPlan.fieldCounties || [];
  const precincts = fieldPlan.fieldPrecincts || [];

  Logger.log(`Generating precinct queries: ${counties.length} counties, ${precincts.length} precincts`);

  // Resolve county once (all precincts use the first county)
  const countyForPrecinct = counties.length > 0 ? counties[0] : '';
  const countyResult = resolveCountyName(countyForPrecinct);

  // Map each precinct to a result object with queries and errors
  const results = precincts.map(rawPrecinct => {
    if (!countyResult.valid) {
      return { queries: [], errors: [`Invalid county "${countyForPrecinct}" for precinct "${rawPrecinct}", skipping`] };
    }

    const precinctResult = resolvePrecinctCode(rawPrecinct, countyResult.countyName);
    if (!precinctResult.valid) {
      return { queries: [], errors: [`Invalid precinct "${rawPrecinct}" in county ${countyResult.countyName}, skipping`] };
    }

    // Warn on fuzzy matches but continue generating queries
    const precinctWarnings = [];
    if (precinctResult.matchType === 'fuzzy') {
      precinctWarnings.push(`Precinct "${rawPrecinct}" not found exactly; matched to ${precinctResult.precinctCode} — please verify`);
    }

    const activistCode = generateActivistCode(
      resolvedData.orgName,
      countyResult.abbreviation,
      precinctResult.precinctCode
    );

    const precinctParams = {
      orgName: resolvedData.orgName,
      countyName: countyResult.countyName,
      precinctCode: precinctResult.precinctCode,
      activistCode: activistCode,
      committeeId: resolvedData.vanId.committeeId,
      queryType: resolvedData.queryType,
      rowNumber: resolvedData.rowNumber,
      raceData: resolvedData.raceData,
      ageData: resolvedData.ageData
    };

    // Shared fields for all query objects from this precinct
    const sharedFields = {
      county: countyResult.countyName,
      precinct: precinctResult.precinctCode,
      activistCode: activistCode,
      orgName: resolvedData.orgName,
      committeeId: resolvedData.vanId.committeeId,
      rowNumber: resolvedData.rowNumber
    };

    // Build all three query types, catching errors individually
    const perPrecinctErrors = [];
    const queries = [
      { builder: buildMetadataMergeQuery, type: 'metadata_merge', args: precinctParams },
      { builder: buildPrecinctListMergeQuery, type: 'precinct_list_merge', args: precinctParams },
      { builder: buildDwidSelectQuery, type: 'dwid_select', args: activistCode }
    ].reduce((acc, item) => {
      try {
        acc.push(Object.assign({ type: item.type, sql: item.builder(item.args) }, sharedFields));
      } catch (e) {
        perPrecinctErrors.push(`${item.type} failed for precinct ${precinctResult.precinctCode}: ${e.message}`);
      }
      return acc;
    }, []);

    return { queries, errors: precinctWarnings.concat(perPrecinctErrors) };
  });

  const allQueries = results.flatMap(r => r.queries);
  const allErrors = results.flatMap(r => r.errors);

  Logger.log(`Precinct queries generated: ${allQueries.length} queries, ${allErrors.length} errors`);
  return { queries: allQueries, errors: allErrors };
}

// =============================================================================
// EXPLORATION QUERY GENERATION (NO PRECINCTS)
// =============================================================================

/**
 * Generates exploration and county-level targeting queries (2 per county, precinct='00000').
 * @param {FieldPlan} fieldPlan - The field plan instance
 * @param {Object} resolvedData - Shared resolved data from the main function
 * @returns {{ queries: Array, errors: string[] }}
 * @example generateExplorationQueries(fieldPlan, resolvedData)
 *   // => { queries: [{ type: 'exploration', sql: '...', county: 'HOUSTON' }, { type: 'county_targeting', ... }], errors: [] }
 * @example generateExplorationQueries(fieldPlanNoCounties, resolvedData)
 *   // => { queries: [], errors: ['No counties specified in field plan for SABWR'] }
 */
function generateExplorationQueries(fieldPlan, resolvedData) {
  const counties = fieldPlan.fieldCounties || [];

  if (counties.length === 0) {
    Logger.log('WARNING: No counties found for exploration queries');
    return { queries: [], errors: [`No counties specified in field plan for ${resolvedData.orgName}`] };
  }

  Logger.log(`Generating exploration queries for ${counties.length} counties`);

  // Map each county to a result object with queries and errors
  const results = counties.map(rawCounty => {
    const countyResult = resolveCountyName(rawCounty);

    if (!countyResult.valid) {
      return { queries: [], errors: [`Invalid county "${rawCounty}", skipping`] };
    }

    // Activist code with 00000 precinct placeholder
    const activistCode = generateActivistCode(
      resolvedData.orgName,
      countyResult.abbreviation,
      '00000'
    );

    const countyParams = {
      countyName: countyResult.countyName,
      activistCode: activistCode,
      raceData: resolvedData.raceData,
      ageData: resolvedData.ageData
    };

    const sharedFields = {
      county: countyResult.countyName,
      precinct: '00000',
      activistCode: activistCode,
      orgName: resolvedData.orgName,
      committeeId: resolvedData.vanId.committeeId,
      rowNumber: resolvedData.rowNumber
    };

    // Build both query types, catching errors individually
    const perCountyErrors = [];
    const queries = [
      { builder: buildExplorationQuery, type: 'exploration' },
      { builder: buildCountyLevelTargetingQuery, type: 'county_targeting' }
    ].reduce((acc, item) => {
      try {
        acc.push(Object.assign({ type: item.type, sql: item.builder(countyParams) }, sharedFields));
      } catch (e) {
        perCountyErrors.push(`${item.type} query failed for county ${countyResult.countyName}: ${e.message}`);
      }
      return acc;
    }, []);

    return { queries, errors: perCountyErrors };
  });

  const allQueries = results.flatMap(r => r.queries);
  const allErrors = results.flatMap(r => r.errors);

  Logger.log(`Exploration queries generated: ${allQueries.length} queries, ${allErrors.length} errors`);
  return { queries: allQueries, errors: allErrors };
}

// =============================================================================
// QUERY QUEUE SHEET WRITER
// =============================================================================

/**
 * Appends a single query row to the query_queue sheet (creates header if empty).
 * @param {Object} queryData - Query object (type, sql, county, precinct, activistCode, orgName, committeeId, rowNumber)
 * @example writeToQueryQueue({ type: 'precinct_list_merge', sql: 'MERGE ...', county: 'HOUSTON', precinct: '00182', activistCode: 'HOUS_00182_SABWR', orgName: 'SABWR', committeeId: '12345', rowNumber: 5 })
 *   // => appends row: [Timestamp, 'SABWR', 'HOUSTON', '00182', 'HOUS_00182_SABWR', 'precinct_list_merge', 'MERGE ...', 'pending', 5, '12345', user@email]
 * @example writeToQueryQueue({ type: 'exploration', sql: 'SELECT ...', county: 'MOBILE', precinct: '00000', activistCode: 'MOBI_00000_OBG', orgName: 'OBG', committeeId: null, rowNumber: 3 })
 *   // => committeeId column is empty string when null
 */
function writeToQueryQueue(queryData) {
  const config = getQueryConfig();
  const sheet = getSheet(config.sheetQueryQueue);

  // Write header row if sheet is empty
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(QUERY_QUEUE_HEADERS);
    Logger.log('writeToQueryQueue: wrote header row to query_queue sheet');
  }

  const row = [
    new Date(),                          // Timestamp
    queryData.orgName || '',             // Org Name
    queryData.county || '',              // County
    queryData.precinct || '',            // Precinct
    queryData.activistCode || '',        // Activist Code
    queryData.type || '',                // Query Type
    queryData.sql || '',                 // SQL
    'pending',                           // Status (pending until executed)
    queryData.rowNumber || '',           // Row Number
    queryData.committeeId || '',         // VAN Committee ID
    Session.getActiveUser().getEmail()   // Submitted By
  ];

  sheet.appendRow(row);
  Logger.log(`writeToQueryQueue: appended ${queryData.type} for ${queryData.activistCode}`);
}

// =============================================================================
// FIELD PLAN SHEET WRITER
// =============================================================================

/**
 * Writes the query generation summary to column 74 of the field plan sheet row.
 * @param {number} rowNumber - 1-based row number in the field plan sheet
 * @param {string} summary - Human-readable summary string
 * @example writeToFieldPlanSheet(5, 'Query Builder: SABWR\nQueries generated: 9')
 *   // => writes summary to row 5, column 74; adds 'Query Builder Status' header if missing
 * @example writeToFieldPlanSheet(2, 'ERROR: Query generation failed for Unknown Org.')
 *   // => writes error summary to row 2
 */
function writeToFieldPlanSheet(rowNumber, summary) {
  const sheetName = scriptProps.getProperty('SHEET_FIELD_PLAN');
  const sheet = getSheet(sheetName);

  // Write to the column after the last data column
  // FIELD_PLAN_COLUMNS goes up to index 72, so column 74 (1-based) is safe
  const summaryColumn = 74;

  // Write header if cell is empty in row 1
  const headerCell = sheet.getRange(1, summaryColumn);
  if (!headerCell.getValue()) {
    headerCell.setValue('Query Builder Status');
  }

  sheet.getRange(rowNumber, summaryColumn).setValue(summary);
  Logger.log(`writeToFieldPlanSheet: wrote summary to row ${rowNumber}, column ${summaryColumn}`);
}

// =============================================================================
// SUMMARY FORMATTER
// =============================================================================

/**
 * Formats a multi-line summary of org, VAN ID, query count, counties, precincts, and filters.
 * @param {Object} resolvedData - The shared resolved data object
 * @param {Array} queries - Array of generated query objects
 * @param {string[]} errors - Array of error messages
 * @returns {string} Multi-line summary string
 * @example formatQuerySummary(resolvedData, queries, [])
 *   // => 'Query Builder: SABWR\nGenerated: 3/24/2026...\nVAN ID: 12345 (exact match)\nQueries generated: 9\n...'
 * @example formatQuerySummary(resolvedData, [], ['No counties specified'])
 *   // => '...Queries generated: 0\n...\nWARNINGS (1):\n  - No counties specified'
 */
function formatQuerySummary(resolvedData, queries, errors) {
  const lines = [];

  lines.push('Query Builder: ' + resolvedData.orgName);
  lines.push('Generated: ' + new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }));

  // VAN ID status
  if (resolvedData.vanId && resolvedData.vanId.found) {
    lines.push('VAN ID: ' + resolvedData.vanId.committeeId + ' (' + resolvedData.vanId.matchType + ' match)');
  } else {
    lines.push('VAN ID: NOT FOUND - manual lookup required');
  }

  // Query count
  lines.push('Queries generated: ' + queries.length);

  // Counties and precincts — extract unique values with Set
  const counties = [...new Set(queries.map(q => q.county).filter(Boolean))];
  const precincts = [...new Set(queries.map(q => q.precinct).filter(p => p && p !== '00000'))];

  lines.push('Counties: ' + counties.join(', '));

  if (precincts.length > 0) {
    lines.push('Precincts: ' + precincts.join(', '));
  } else {
    lines.push('Precincts: None specified (exploration mode)');
  }

  // Demographics
  if (resolvedData.raceData && resolvedData.raceData.hasFilter) {
    lines.push('Race filter: ' + resolvedData.raceData.catalistValues.join(', '));
  } else {
    lines.push('Race filter: none (all races)');
  }

  if (resolvedData.ageData && resolvedData.ageData.hasFilter) {
    lines.push('Age filter: ' + resolvedData.ageData.sqlFragment);
  } else {
    lines.push('Age filter: none (all ages)');
  }

  // Errors
  if (errors && errors.length > 0) {
    lines.push('');
    lines.push('WARNINGS (' + errors.length + '):');
    errors.forEach(err => {
      lines.push('  - ' + err);
    });
  }

  return lines.join('\n');
}
