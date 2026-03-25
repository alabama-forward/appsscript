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
 * Last Updated: 2026-03-24
 */

/**
 * Creates a WHERE clause using resolved county, precinct, race, and age filters.
 * @param {Object} params - Resolved parameters (countyName, precinctCode, raceData, ageData)
 * @returns {string} SQL WHERE clause (with loading newline)
 * @example buildWhereClause({ countyName: 'HOUSTON', precinctCode: '00182', 
 *      raceData: { hasFilter: true, catalistValues: ['black'] }, ageData: { hasFilter: false } })
 *   // => '\nWHERE d.countyname = \'HOUSTON\'\n  AND d.precinctcode = \'00182\'\n  AND ...'
 * @example buildWhereClause({ raceData: { hasFilter: false }, ageData: { hasFilter: false } })
 *   // => '\nWHERE p.voterstatus = \'active\'\n  AND p.deceased = \'f\''
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
    conditions.push("p.deceased = 'f'");

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