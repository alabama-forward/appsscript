/**
 * Query Builder - SQL Template Functions
 *
 * Builds BigQuery SQL strings from resolved parameters. Each function
 * returns a complete, ready-to-execute SQL string.
 *
 * Functions:
 *      buildWhereClause()                  - shared WHERE clause builder (DRY)
 *      buildVoteHistoryClause()            - configurable vote history JOIN
 *      buildMetadataMergeQuery()           - coordination_metadata MERGE
 *      buildPrecinctListMergeQuery()       - 2026_precinct_lists MERGE
 *      buildDwidSelectQuery()              - VAN upload SELECT
 *      buildExplorationQuery()             - grouped summary (no precinct)
 *      buildCountyLevelTargetingQuery()    - county-wide targeting (no-precincts)
 *
 * All table names are read from getQueryConfig() so they can be changed
 * via script properties.
 *
 * Last Updated: 2026-03-25
 */

/**
 * Creates a WHERE clause using resolved county, precinct, race, and age filters.
 * @param {Object} params - Resolved parameters (countyName, precinctCode, raceData, ageData)
 * @returns {string} SQL WHERE clause (with loading newline)
 * @example buildWhereClause({ countyName: 'HOUSTON', precinctCode: '00182',
 *      raceData: { hasFilter: true, catalistValues: ['black'] }, ageData: { hasFilter: false } })
 *   // => '\nWHERE d.countyname = \'HOUSTON\'\n  AND d.precinctcode = \'00182\'\n  AND ...'
 * @example buildWhereClause({ raceData: { hasFilter: false }, ageData: { hasFilter: false } })
 *   // => '\nWHERE p.voterstatus = \'active\'\n  AND p.deceased = \'N\''
 */
function buildWhereClause(params) {
    const conditions = [];

    //County
    if (params.countyName) {
        conditions.push("d.countyname = '" + params.countyName + "'");
    }

    //Precinct(s)
    if (params.precinctCode) {
        conditions.push("d.precinctcode = '" + params.precinctCode + "'");
    }

    //voter status
    conditions.push("p.voterstatus = 'active'");

    //Deceased
    conditions.push("p.deceased = 'N'");

    //Precinct data quality
    conditions.push('d.precinctcode IS NOT NULL');
    conditions.push('d.precinctname IS NOT NULL');

    //Race
    if (params.raceData && params.raceData.hasFilter && params.raceData.catalistValues.length > 0) {
        const raceValues = params.raceData.catalistValues.map (v => {
            return "'" + v + "'";
        }).join(', ');
        const raceCondition = params.raceData.unmappedComment
            ? params.raceData.unmappedComment + '\n ' + 'm.race IN (' + raceValues + ')'
            : 'm.race IN (' + raceValues + ')';
        conditions.push(raceCondition);
    } else if (params.raceData && params.raceData.unmappedComment) {
        //Triggered when no mapped values but org did select races
        //TRUE allows the query to build without filtering or breaking if nothing mapped
        conditions.push(params.raceData.unmappedComment + '\n TRUE');
    }

    //Age
    if (params.ageData && params.ageData.hasFilter && params.ageData.sqlFragment) {
        const ageCondition = params.ageData.unmappedComment
            ? params.ageData.unmappedComment + '\n ' + params.ageData.sqlFragment
            : params.ageData.sqlFragment;
        conditions.push(ageCondition);
    } else if (params.ageData && params.ageData.unmappedComment) {
        conditions.push(params.ageData.unmappedComment + '\n TRUE');
    }

    if (conditions.length === 0) {
        return '';
    }

    return '\nWHERE ' + conditions.join('\n AND ');
}

/**
 * Builds vote history SELECT clause and LEFT JOIN clauses from column names
 * @param {string[]} [voteHistoryColumns] - Column names to include (defaults to those in config)
 * @returns {{ selectColumns: string, joinClause: string }}
 * @example buildVoteHistoryClause(['e2020gvm', 'e2024gvm'])
 *   // => { selectColumns: 'vh.e2020gvm, vh.e2024gvm', joinClause: 'LEFT JOIN `...Vote_History` vh ON p.DWID = vh.DWID' }
 * @example buildVoteHistoryClause([])
 *   // => uses DEFAULT_VOTE_HISTORY_COLUMNS as fallback
 */
function buildVoteHistoryClause(voteHistoryColumns) {
    const config = getQueryConfig();
    let columns = voteHistoryColumns || config.voteHistoryColumns;

    if (!columns || columns.length === 0) {
        columns = DEFAULT_VOTE_HISTORY_COLUMNS;
    }

    const selectColumns = columns.map(col => {
        return 'vh.' + col.trim();
    }).join(', ')

    const joinClause = 'LEFT JOIN `' + config.projectId + '.' + config.voteHistoryTable + '` vh ON p.DWID = vh.DWID'

    return {
        selectColumns: selectColumns,
        joinClause: joinClause
    };
}

/**
 * Builds a MERGE query for coordination_metadata, upserting org, county, & precinct rows.
 * @param {Object} params - Query parameters (orgName, countyName, precinctCode, activistCode, committeeId, queryType, rowNumber)
 * @returns {string} Complete MERGE SQL statement
 * @example buildMetadataMergeQuery({ orgName: 'SABWR', countyName: 'HOUSTON',
 *      precinctCode: '00182', activistCode: 'HOUS_00182_SABWR', committeeId: '12345', queryType: 'member', rowNumber: 5 })
 *   // => 'MERGE `prod-sv-al-898733e3.alforward.coordination_metadata` T\nUSING ...'
 * @example buildMetadataMergeQuery({ orgName: "O'Brien's Group", countyName: 'MOBILE',
 *      precinctCode: '00010', activistCode: 'MOBI_00010_OBG', committeeId: null, queryType: 'member', rowNumber: 3 })
 *   // => escapes apostrophe in orgName; committeeId renders as NULL
 */
function buildMetadataMergeQuery(params) {
    const config = getQueryConfig();
    const committeeIdValue = params.committeeId ? "'" + params.committeeId + "'" : 'NULL';
    const queryType = params.queryType || config.queryTypeDefault;
    const isCountyLevel = params.precinctCode === '00000';

    // When county-level, add inline comments showing where to replace precinct/activist code
    const precinctLine = isCountyLevel
        ? "  '" + params.precinctCode + "' AS precinct_code,  -- replace 00000 with actual precinct\n"
        : "  '" + params.precinctCode + "' AS precinct_code,\n";
    const activistLine = isCountyLevel
        ? "  '" + params.activistCode + "' AS activist_code,  -- replace _00000_ with actual precinct\n"
        : "  '" + params.activistCode + "' AS activist_code,\n";

    const sql = 'MERGE `' + config.projectId + '.' + config.metadataTable + '` T\n' +
        'USING (SELECT\n' +
        "  '" + params.orgName.replace(/'/g, "\\'") + "' AS org_name,\n" +
        "  '" + params.countyName + "' AS county,\n" +
        precinctLine +
        activistLine +
        '  ' + committeeIdValue + ' AS committee_id,\n' +
        "  '" + queryType + "' AS query_type,\n" +
        '  ' + params.rowNumber + ' AS field_plan_row,\n' +
        '  CURRENT_TIMESTAMP() AS created_at\n' +
        ') S\n' +
        'ON T.org_name = S.org_name\n' +
        '  AND T.county = S.county\n' +
        '  AND T.precinct_code = S.precinct_code\n' +
        'WHEN MATCHED THEN UPDATE SET\n' +
        '  T.activist_code = S.activist_code,\n' +
        '  T.committee_id = S.committee_id,\n' +
        '  T.query_type = S.query_type,\n' +
        '  T.field_plan_row = S.field_plan_row,\n' +
        '  T.updated_at = CURRENT_TIMESTAMP()\n' +
        'WHEN NOT MATCHED THEN INSERT\n' +
        '  (org_name, county, precinct_code, activist_code, committee_id, query_type, field_plan_row, created_at)\n' +
        'VALUES\n' +
        '  (S.org_name, S.county, S.precinct_code, S.activist_code, S.committee_id, S.query_type, S.field_plan_row, S.created_at);';

    return sql;
}

/**
 * Builds a MERGE query for 2026_precinct_lists, upserting matching voters by DWID+activist_code.
 * @param {Object} params - Query parameters (countyName, precinctCode, activistCode, raceData, ageData)
 * @returns {string} Complete MERGE SQL statement
 * @example buildPrecinctListMergeQuery({ countyName: 'HOUSTON', precinctCode: '00182', activistCode: 'HOUS_00182_SABWR', raceData: { hasFilter: true, catalistValues: ['black'] }, ageData: { hasFilter: false } })
 *   // => 'MERGE `prod-sv-al-898733e3.alforward.2026_precinct_lists` T\nUSING ...'
 * @example buildPrecinctListMergeQuery({ countyName: 'MOBILE', precinctCode: '00010', activistCode: 'MOBI_00010_OBG', raceData: { hasFilter: false }, ageData: { hasFilter: false } })
 *   // => MERGE with no race/age filters in WHERE clause
 */
function buildPrecinctListMergeQuery(params) {
    const config = getQueryConfig();
    const voteHistory = buildVoteHistoryClause();
    const whereClause = buildWhereClause(params);

    const sql = 'MERGE `' + config.projectId + '.' + config.precinctListTable + '` T\n' +
        'USING (\n' +
        '  SELECT\n' +
        '    p.DWID,\n' +
        "    '" + params.activistCode + "' AS activist_code,\n" +
        '    d.countyname,\n' +
        '    d.precinctcode,\n' +
        '    d.precinctname,\n' +
        '    p.regaddrcity,\n' +
        '    m.race,\n' +
        '    p.age,\n' +
        '    ' + voteHistory.selectColumns + '\n' +
        '  FROM `' + config.projectId + '.' + config.districtTable + '` d\n' +
        '  JOIN `' + config.projectId + '.' + config.personTable + '` p ON d.DWID = p.DWID\n' +
        '  JOIN `' + config.projectId + '.' + config.modelsTable + '` m ON p.DWID = m.DWID\n' +
        '  ' + voteHistory.joinClause + '\n' +
        '  ' + whereClause + '\n' +
        ') S\n' +
        'ON T.DWID = S.DWID AND T.activist_code = S.activist_code\n' +
        'WHEN MATCHED THEN UPDATE SET\n' +
        '  T.countyname = S.countyname,\n' +
        '  T.precinctcode = S.precinctcode,\n' +
        '  T.precinctname = S.precinctname,\n' +
        '  T.regaddrcity = S.regaddrcity,\n' +
        '  T.race = S.race,\n' +
        '  T.age = S.age,\n' +
        '  T.updated_at = CURRENT_TIMESTAMP()\n' +
        'WHEN NOT MATCHED THEN INSERT\n' +
        '  (DWID, activist_code, countyname, precinctcode, precinctname, regaddrcity, race, age, created_at)\n' +
        'VALUES\n' +
        '  (S.DWID, S.activist_code, S.countyname, S.precinctcode, S.precinctname, S.regaddrcity, S.race, S.age, CURRENT_TIMESTAMP());';

    return sql;
}

/**
 * Builds a SELECT query returning DWIDs from precinct_lists for VAN upload.
 * @param {string} activistCode - The activist code to look up
 * @returns {string} Complete SELECT SQL statement
 * @example buildDwidSelectQuery('HOUS_00182_SABWR')
 *   // => 'SELECT DWID, activist_code, ... FROM `...2026_precinct_lists` WHERE activist_code = \'HOUS_00182_SABWR\' ORDER BY DWID;'
 * @example buildDwidSelectQuery('MOBI_00000_OBG')
 *   // => county-level activist code returns all voters for that org+county
 */
function buildDwidSelectQuery(activistCode) {
    const config = getQueryConfig();

    const sql = 'SELECT\n' +
        '  DWID,\n' +
        '  activist_code,\n' +
        '  countyname,\n' +
        '  precinctcode,\n' +
        '  precinctname,\n' +
        '  regaddrcity,\n' +
        '  race,\n' +
        '  age\n' +
        'FROM `' + config.projectId + '.' + config.precinctListTable + '`\n' +
        "WHERE activist_code = '" + activistCode + "'\n" +
        'ORDER BY DWID;';

    return sql;
}

/**
 * Builds an exploration query grouping voters by precinct, municipality, race, and status.
 * @param {Object} params - Query parameters (countyName, raceData, ageData)
 * @returns {string} Complete SELECT SQL statement with GROUP BY
 * @example buildExplorationQuery({ countyName: 'HOUSTON', raceData: { hasFilter: true, catalistValues: ['black'] }, ageData: { hasFilter: false } })
 *   // => 'SELECT d.precinctcode, ... GROUP BY ... ORDER BY d.precinctcode, voter_count DESC;'
 * @example buildExplorationQuery({ countyName: 'MOBILE', raceData: { hasFilter: false }, ageData: { hasFilter: false } })
 *   // => exploration with no demographic filters — shows all voters grouped by precinct
 */
function buildExplorationQuery(params) {
    const config = getQueryConfig();

    // Exploration queries never filter by precinct
    const whereParams = {
        countyName: params.countyName,
        raceData: params.raceData,
        ageData: params.ageData
    };

    const whereClause = buildWhereClause(whereParams);

    const sql = '-- Exploration query for ' + params.countyName + '\n' +
        '-- Helps org identify which precincts to target\n' +
        'SELECT\n' +
        '  d.precinctcode,\n' +
        '  d.precinctname,\n' +
        '  p.regaddrcity AS municipality,\n' +
        '  m.race,\n' +
        '  p.voterstatus,\n' +
        '  COUNT(DISTINCT p.DWID) AS voter_count\n' +
        'FROM `' + config.projectId + '.' + config.districtTable + '` d\n' +
        'JOIN `' + config.projectId + '.' + config.personTable + '` p ON d.DWID = p.DWID\n' +
        'JOIN `' + config.projectId + '.' + config.modelsTable + '` m ON p.DWID = m.DWID\n' +
        whereClause + '\n' +
        'GROUP BY\n' +
        '  d.precinctcode,\n' +
        '  d.precinctname,\n' +
        '  p.regaddrcity,\n' +
        '  m.race,\n' +
        '  p.voterstatus\n' +
        'HAVING voter_count >= 100\n' +
        'ORDER BY\n' +
        '  d.precinctcode,\n' +
        '  voter_count DESC;';

    return sql;
}

/**
 * Builds a county-level voter SELECT (no precinct filter) for orgs without precincts.
 * @param {Object} params - Query parameters (countyName, activistCode, raceData, ageData)
 * @returns {string} Complete SELECT SQL statement
 * @example buildCountyLevelTargetingQuery({ countyName: 'HOUSTON', activistCode: 'HOUS_00000_SABWR', raceData: { hasFilter: true, catalistValues: ['black'] }, ageData: { hasFilter: false } })
 *   // => 'SELECT p.DWID, ... FROM ... WHERE d.countyname = \'HOUSTON\' ... ORDER BY d.precinctcode, p.DWID;'
 * @example buildCountyLevelTargetingQuery({ countyName: 'MOBILE', activistCode: 'MOBI_00000_OBG', raceData: { hasFilter: false }, ageData: { hasFilter: false } })
 *   // => county-level query with no demographic filters
 */
function buildCountyLevelTargetingQuery(params) {
    const config = getQueryConfig();
    const voteHistory = buildVoteHistoryClause();

    // County-level: no precinct in WHERE
    const whereParams = {
        countyName: params.countyName,
        raceData: params.raceData,
        ageData: params.ageData
    };
    const whereClause = buildWhereClause(whereParams);

    // Inline precinct filter comment for manual use after exploration
    const precinctComment = '\n -- AND d.precinctcode IN ()  -- add precincts from exploration results';

    const sql = '-- County-level targeting for ' + params.countyName + '\n' +
        '-- No precincts specified, targeting full county\n' +
        'SELECT\n' +
        '  p.DWID,\n' +
        "  '" + params.activistCode + "' AS activist_code,\n" +
        '  d.countyname,\n' +
        '  d.precinctcode,\n' +
        '  d.precinctname,\n' +
        '  p.regaddrcity,\n' +
        '  m.race,\n' +
        '  p.age,\n' +
        '  ' + voteHistory.selectColumns + '\n' +
        'FROM `' + config.projectId + '.' + config.districtTable + '` d\n' +
        'JOIN `' + config.projectId + '.' + config.personTable + '` p ON d.DWID = p.DWID\n' +
        'JOIN `' + config.projectId + '.' + config.modelsTable + '` m ON p.DWID = m.DWID\n' +
        '' + voteHistory.joinClause + '\n' +
        whereClause + precinctComment + '\n' +
        'ORDER BY\n' +
        '  d.precinctcode,\n' +
        '  p.DWID;';

    return sql;
}
