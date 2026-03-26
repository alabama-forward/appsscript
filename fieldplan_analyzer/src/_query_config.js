/**
 * Query Builder Configuration
 * 
 * Centralizes all constants, BigQuery settings, and configuration
 * for the query builder module. Other query files read from
 * this file instead of defining their own copies.
 * 
 * Last Updated: 2026-02-23
 */

/**
 * Returns BigQuery config object
 * 
 * Reads all BQ-related settings from script props. Will fail
 * if script properties have not been set. This is so we don't
 * expose the values
 * 
 * @returns {Object} Config object with projectID, tables, vote history
 *  columns, query type, and service account credentials.
 * 
 * @example
 *  const config = getQueryConfig();
 *  Logger.log(config.projectId);
 *  // Shows projectId
 */
function getQueryConfig(){
    const props = PropertiesService.getScriptProperties();

    return {
        projectId: props.getProperty('BQ_PROJECT_ID'),
        precinctListTable: props.getProperty('BQ_PRECINCT_LIST_TABLE'),
        metadataTable: props.getProperty('BQ_METADATA_TABLE'),
        voteHistoryColumns: (props.getProperty('BQ_VOTE_HISTORY_COLUMNS').split(',')),
        queryTypeDefault: props.getProperty('BQ_QUERY_TYPE_DEFAULT'),
        saClientEmail: props.getProperty('SA_CLIENT_EMAIL'),
        saPrivateKey: props.getProperty('SA_PRIVATE_KEY'),
        sheetQueryQueue: props.getProperty('SHEET_QUERY_QUEUE'),
        sheetVanIdLookup: props.getProperty('SHEET_VAN_ID_LOOKUP'),
        sheetCountyPrecinct: props.getProperty('SHEET_COUNTY_PRECINCT'),
        runQueriesInBigQuery: props.getProperty('BQ_EXECUTE_ENABLED') === 'true',
        districtTable: 'catalist_AL.District',
        personTable: 'catalist_AL.Person',
        modelsTable: 'catalist_AL.Models',
        voteHistoryTable: 'catalist_AL.Vote_History'
    };
}

const RACE_MAP = {
    'Black / African American': 'black',
    'Hispanic / Latino': 'hispanic',
    'White (non-Hispanic)': 'caucasian',
    'Asian / Pacific Islander': 'asian',
    'Native American / Indigenous': 'nativeAmerican'
}

const AGE_RANGE_MAP = {
    '18 - 19': { min: 18, max: 19 },
    '20 - 29': { min: 20, max: 29 },
    '30 - 39': { min: 30, max: 39 },
    '40 - 49': { min: 40, max: 49 },
    '50 - 59': { min: 50, max: 59 },
    '60 - 69': { min: 60, max: 69 },
    '70 - 79': { min: 70, max: 79 },
    '80 - 89': { min: 80, max: 89 },
    '90 +': { min: 90, max: 120 }
}

/**
 * Detects "all selected" which causes code to omit age filter entirely
 */
const AGE_RANGE_TOTAL_OPTIONS = Object.keys(AGE_RANGE_MAP).length;

/**
 * Words to exclude when generating organization initials for activist codes
 */
const ORG_STOP_WORDS = ['the', 'of', 'and', 'for', 'in', 'a', 'an', 'to', 'at', 'by']

const QUERY_QUEUE_HEADERS = [
    'Timestamp',
    'Org Name',
    'County',
    'Precinct',
    'Activist Code',
    'Query Type',
    'SQL',
    'Status',
    'Row Number',
    'VAN Committee ID',
    'Submitted By'  
];