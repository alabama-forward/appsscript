/**
 * Analysis Tab Builder
 * Builds 5 analysis tabs from raw field plan and budget data
 * for BigQuery ingestion and Hex.tech visualization
 * 
 * Exports these functions:
 *      rebuildAnalysisTabs()       - clears and rewrites all 5 tabs
 *      testRebuildAnalysisTabs()   - test wrapper (logs counts, no emails)
 */

/** Tab names for the analysis tabs */
const ANALYSIS_TABS = {
    ORG_PLANS: 'analysis_org_plans',
    ORG_TACTICS: 'analysis_org_tactics',
    ORG_COUNTIES: 'analysis_org_counties',
    ORG_DEMOGRAPHICS: 'analysis_org_demographics',
    ORG_BUDGETS: 'analysis_org_budgets'
};

/**Keywords matched against narrative and demo notes fields. */
const NARRATIVE_KEYWORDS = [
    'GOTV', 'voter registration', 'voting rights', 'restoration',
    'civic engagement', 'healthcare', 'education', 'economic opportunity',
    'public safety', 'housing', 'criminal justice', 'environmental',
    'faith-based', 'youth', 'seniors', 'rural', 'data-driven',
    'volunteer mobilization', 'door-to-door', 'phone banking',
    'text banking', 'community organizing', 'long-term power' 
]

/**Budget line items keys. Order matches 2026 budget form. */
const BUDGET_LINE_ITEMS = [
    'admin', 'data', 'travel', 'comms', 'design', 'video', 'print',
    'postage', 'training', 'supplies', 'canvass', 'phone', 'text',
    'event', 'digital'
]

/**Outreach line items - the outreach related subset of BUDGET_LINE_ITEMS */
const OUTREACH_ITEMS = new Set(['canvass', 'phone', 'text', 'event', 'digital']);

/**Returns an existing sheet or creates it if it is missing
 * @param {string} name - tab name
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 * @example getOrCreateSheet('analysis_org_plans') => tab
 * @example getOrCreateSheet('new_tab') => creates and returns new tab
 */
function getOrCreateSheet(name) {
    const ss = getSpreadsheet();
    //this AppsScript function retrieves tabs by name
    const sheet = ss.getSheetByName(name);
    if (sheet) return sheet;
    Logger.log(`Created new sheet: ${name}`);
    return ss.insertSheet(name)
}

/**
 * Clears a sheet and writes headers + data rows.
 * @param {string} sheetName - tab name
 * @param {string[]} headers - column headers
 * @param {Array[]} rows - 2D array of row values
 * @returns {number} number of data rows written
 * @example writeTab('analysis_org_plans', ['org_name'], [['NAACP']]) => 1
 * @example writeTab('analysis_org_plans', ['org_name'], []) => 0
 */
function writeTab(sheetName, headers, rows) {
    const sheet = getOrCreateSheet(sheetName);
    sheet.clearContents();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    if (rows.length > 0) {
        sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }
    Logger.log(`${sheetName}: ${rows.length} rows written`);
    return rows.length;
}

/**
 * Splits a multi-select field on newlines (technical debt here: this is
 * the same logic as the FieldPlan constructor's normalizeField. Future 
 * refactoring should consider pulling normalization outsife of FieldPlan
 * to make the function globally available.)
 * @param {*} value - raw cell value
 * @returns {string[]} trimmed non-empty values
 * @example normalizeMultiSelect('Houston\nMobile') => ['Houston', 'Mobile']
 * @example normalizeMultiSelect('') => []
 */
function normalizeMultiSelect(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    const str = value.toString();
    if (str.includes('\n')) {
        return str.split('\n').map(s => s.trim()).filter(Boolean);
    }
    return [str.trim()]
}

/**
 * Parses start date, end date, and day count from the PROGRAMDATES field.
 * @param {string} dateStr — "Start Date: MM/DD/YYYY End Date: MM/DD/YYYY  Difference: X days"
 * @returns {{startDate: Date|null, endDate: Date|null, days: number|null}}
 * @example parseProgramDates('Start Date: 01/28/2026 End Date: 04/30/2026  Difference: 92 days')
 *   => { startDate: 2026-01-28, endDate: 2026-04-30, days: 92 }
 * @example parseProgramDates('') => { startDate: null, endDate: null, days: null }
 */
function parseProgramDates(dateStr) {
    if (!dateStr) return { startDate: null, endDate: null, days: null };
    const str = dateStr.toString();
    const startMatch = str.match(/Start Date:\s*(\d{2}\/\d{2}\/\d{4})/);
    const endMatch = str.match(/End Date:\s*(\d{2}\/\d{2}\/\d{4})/);
    const daysMatch = str.match(/Difference:\s*(\d+)\s*days/i);
    return {
        startDate: startMatch ? new Date(startMatch[1]) : null,
        endDate: endMatch ? new Date(endMatch[1]) : null,
        days: daysMatch ? Number(daysMatch[1]) : null
    };
}

/**
 * Matches keywords against narrative text using word-boundary regex.
 * @param {string} text -  raw narrative text
 * @returns {string} pipe-delimited matched keywords
 * @example extractKeywords('Our GOTV and voter registration program')
 *      => 'GOTV|voter registration'
 * @example extractKeywords('') => ''
 */
function extractKeywords(text) {
    if (!text) return '';
    const str = text.toString();
    return NARRATIVE_KEYWORDS.filter(kw => {
        const escaped = kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        return new RegExp(`\\b${escaped}\\b`, 'i').test(str);
    })
    .join('|');
}

/**
 * Loads VAN ID lookup data from the van_id_lookup sheet
 * @returns {Array<{name: string, id: string}>}
 * @example loadVanLookup() => [{name: NAACP, id: '12345'}, ...]
 * @example loadVanLookup() => [] (if sheet is empty)
 */
function loadVanLookup() {
    const config = getQueryConfig();
    const sheet = getSheet(config.sheetVanIdLookup);
    //getDataRange looks for used cells, so it doesn't return all empty cells
    return sheet.getDataRange().getValues().slice(1)
        .map(row => ({
            name: (row[0] || '').toString().trim(),
            id: (row[1] || '').toString().trim()
        }));
}

/**
 * Loads county_precinct reference data into three lookup structures.
 * @returns {{fipsMap: Map<string,string>, precinctsByCounty: Map<string,string[]>, precinctNames: Map<string,string>}}
 * @example loadCountyPrecinctData().fipsMap.get('HOUSTON')              // => '069'
 * @example loadCountyPrecinctData().precinctsByCounty.get('HOUSTON')    // => ['00182', '00183']
 */
function loadCountyPrecinctData() {
    const config = getQueryConfig();
    const sheet = getSheet(config.sheetCountyPrecinct);
    const data = sheet.getDataRange().getValues();

    const fipsMap = new Map();
    const precinctsByCounty = new Map();
    const precinctNames = new Map();

    // county_precinct layout: [countyFips, countyName, precinctCode, precinctName?, ...]
    // Verify column positions match your sheet — see Part 1, Step 1.2
    data.slice(1).forEach(row => {
        const fips = (row[0] || '').toString().trim();
        const county = (row[1] || '').toString().trim().toUpperCase();
        const code = (row[2] || '').toString().trim();
        const name = row.length > 3 ? (row[3] || '').toString().trim() : '';

        if (!county) return;

        if (fips && !fipsMap.has(county)) fipsMap.set(county, fips);

        if (code) {
            if (!precinctsByCounty.has(county)) precinctsByCounty.set(county, []);
            precinctsByCounty.get(county).push(code);
            if (name) precinctNames.set(`${county}|${code}`, name);
        }
    });

  return { fipsMap, precinctsByCounty, precinctNames };
}