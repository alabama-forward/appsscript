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


/**
 * Builds rows for analysis_org_plans (one row per org).
 * @param {Array[]} fieldPlanData - raw field plan sheet data (includes header at index 0)
 * @param {Array<{name: string, id: string}>} vanEntries - pre-loaded VAN lookup
 * @returns {{headers: string[], rows: Array[]}}
 */
function buildOrgPlansTab(fieldPlanData, vanEntries) {
    const headers = [
        'org_name', 'submission_id', 'submission_date',
        'van_id', 'van_match_type',
        'contact_first', 'contact_last', 'contact_email', 'contact_phone',
        'attended_training', 'data_storage', 'van_committee', 'program_tools',
        'program_start_date', 'program_end_date', 'program_days', 'program_types',
        'field_tactics', 'teach_comfortable', 'field_staff',
        'narrative_raw', 'narrative_keywords', 'demo_notes_raw', 'demo_notes_keywords',
        'knows_precincts', 'special_geo', 'running_for_office', 'reviewed_plan',
        'confidence_reasonable', 'confidence_data', 'confidence_plan',
        'confidence_capacity', 'confidence_skills', 'confidence_goals'
    ];

    const rows = fieldPlanData.slice(1)
        .filter(row => row[FIELD_PLAN_COLUMNS.MEMBERNAME])
        .map(row => {
            const orgName = row[FIELD_PLAN_COLUMNS.MEMBERNAME].toString().trim();
            const van = resolveVanId(orgName, vanEntries);
            const dates = parseProgramDates(row[FIELD_PLAN_COLUMNS.PROGRAMDATES]);
            const narrative = (row[FIELD_PLAN_COLUMNS.FIELDNARRATIVE] || '').toString();
            const demoNotes = (row[FIELD_PLAN_COLUMNS.DEMONOTES] || '').toString();

            return [
                orgName,
                row[FIELD_PLAN_COLUMNS.SUBMISSIONID] || '',
                row[FIELD_PLAN_COLUMNS.SUBMISSIONDATETIME] || '',
                van.committeeId || '',
                van.matchType === 'none' ? '' : van.matchType,
                row[FIELD_PLAN_COLUMNS.FIRSTNAME] || '',
                row[FIELD_PLAN_COLUMNS.LASTNAME] || '',
                row[FIELD_PLAN_COLUMNS.CONTACTEMAIL] || '',
                row[FIELD_PLAN_COLUMNS.CONTACTPHONE] || '',
                row[FIELD_PLAN_COLUMNS.ATTENDEDTRAINING] || '',
                normalizeMultiSelect(row[FIELD_PLAN_COLUMNS.DATASTORAGE]).join(' | '),
                normalizeMultiSelect(row[FIELD_PLAN_COLUMNS.VANCOMMITTEE]).join(' | '),
                normalizeMultiSelect(row[FIELD_PLAN_COLUMNS.PROGRAMTOOLS]).join(' | '),
                dates.startDate,
                dates.endDate,
                dates.days,
                normalizeMultiSelect(row[FIELD_PLAN_COLUMNS.PROGRAMTYPES]).join(' | '),
                normalizeMultiSelect(row[FIELD_PLAN_COLUMNS.FIELDTACTICS]).join(' | '),
                normalizeMultiSelect(row[FIELD_PLAN_COLUMNS.TEACHCOMFORTABLE]).join(' | '),
                normalizeMultiSelect(row[FIELD_PLAN_COLUMNS.FIELDSTAFF]).join(' | '),
                narrative,
                extractKeywords(narrative),
                demoNotes,
                extractKeywords(demoNotes),
                row[FIELD_PLAN_COLUMNS.KNOWSPRECINCTS] || '',
                normalizeMultiSelect(row[FIELD_PLAN_COLUMNS.SPECIALGEO]).join(' | '),
                row[FIELD_PLAN_COLUMNS.RUNNINGFOROFFICE] || '',
                row[FIELD_PLAN_COLUMNS.REVIEWEDPLAN] || '',
                row[FIELD_PLAN_COLUMNS.CONFIDENCEREASONABLE] || '',
                row[FIELD_PLAN_COLUMNS.CONFIDENCEDATA] || '',
                row[FIELD_PLAN_COLUMNS.CONFIDENCEPLAN] || '',
                row[FIELD_PLAN_COLUMNS.CONFIDENCECAPACITY] || '',
                row[FIELD_PLAN_COLUMNS.CONFIDENCESKILLS] || '',
                row[FIELD_PLAN_COLUMNS.CONFIDENCEGOALS] || ''
            ];
        });

    return { headers, rows };
}

/**
 * Builds rows for analysis_org_tactics (one row per org × active tactic).
 * Only includes rows where all 4 input metrics are non-zero.
 * @param {Array[]} fieldPlanData - raw field plan sheet data (includes header at index 0)
 * @returns {{headers: string[], rows: Array[]}}
 */
function buildOrgTacticsTab(fieldPlanData) {
    const headers = [
        'org_name', 'tactic_name',
        'program_length_weeks', 'weekly_volunteers', 'weekly_hours', 'hourly_attempts',
        'total_program_attempts', 'weekly_attempts', 'total_volunteer_hours',
        'expected_contacts_low', 'expected_contacts_high',
        'attempts_per_hour_threshold', 'cost_target'
    ];

    const rows = [];

    fieldPlanData.slice(1).forEach(row => {
        const orgName = (row[FIELD_PLAN_COLUMNS.MEMBERNAME] || '').toString().trim();
        if (!orgName) return;

        Object.entries(TACTIC_CONFIG).forEach(([tacticKey, config]) => {
            if (!config.enabled) return;

            const cols = PROGRAM_COLUMNS[config.columnKey];
            if (!cols) return;

            const programLength = Number(row[cols.PROGRAMLENGTH]) || 0;
            const weeklyVolunteers = Number(row[cols.WEEKLYVOLUNTEERS]) || 0;
            const weeklyHours = Number(row[cols.WEEKLYHOURS]) || 0;
            const hourlyAttempts = Number(row[cols.HOURLYATTEMPTS]) || 0;

            // Skip if any of the 4 metrics is zero — tactic not active
            if (!programLength || !weeklyVolunteers || !weeklyHours || !hourlyAttempts) return;

            const weeklyAttemptsCalc = weeklyVolunteers * weeklyHours * hourlyAttempts;
            const totalProgramAttempts = programLength * weeklyAttemptsCalc;
            const totalVolunteerHours = programLength * weeklyVolunteers * weeklyHours;

            rows.push([
                orgName,
                config.name,
                programLength,
                weeklyVolunteers,
                weeklyHours,
                hourlyAttempts,
                totalProgramAttempts,
                weeklyAttemptsCalc,
                totalVolunteerHours,
                Math.round(totalProgramAttempts * config.contactRange[0]),
                Math.round(totalProgramAttempts * config.contactRange[1]),
                config.reasonableThreshold,
                config.costTarget
            ]);
        });
    });

    return { headers, rows };
}

/**
 * Builds rows for analysis_org_counties (one row per org × county × precinct).
 *
 * Precinct assignment logic:
 *   1. For each org, collect their counties and precincts
 *   2. Try each precinct against each county (exact match first, then fuzzy)
 *   3. Assign each precinct to its best-matching county
 *   4. Counties with assigned precincts get one row per precinct
 *   5. Counties with no assigned precincts get one row with empty precinct columns
 *   6. Orgs that don't know precincts get one row per county with empty precinct columns
 *
 * @param {Array[]} fieldPlanData - raw field plan sheet data (includes header at index 0)
 * @param {Map<string,string>} fipsMap - county → FIPS code
 * @param {Map<string,string[]>} precinctsByCounty - county → [precinctCodes]
 * @param {Map<string,string>} precinctNameMap - "COUNTY|code" → precinct name
 * @returns {{headers: string[], rows: Array[]}}
 */
function buildOrgCountiesTab(fieldPlanData, fipsMap, precinctsByCounty, precinctNameMap) {
    const headers = [
        'org_name', 'county_raw', 'county_name', 'county_fips',
        'precinct_raw', 'precinct_code', 'precinct_name', 'precinct_match_type',
        'willing_other_precincts', 'cities'
    ];

    const rows = [];

    fieldPlanData.slice(1).forEach(row => {
        const orgName = (row[FIELD_PLAN_COLUMNS.MEMBERNAME] || '').toString().trim();
        if (!orgName) return;

        const counties = normalizeMultiSelect(row[FIELD_PLAN_COLUMNS.FIELDCOUNTIES]);
        if (counties.length === 0) return;

        const knowsPrecincts = (row[FIELD_PLAN_COLUMNS.KNOWSPRECINCTS] || '').toString().trim().toLowerCase() === 'yes';
        const rawPrecincts = knowsPrecincts ? normalizeMultiSelect(row[FIELD_PLAN_COLUMNS.FIELDPRECINCTS]) : [];
        const willingOther = row[FIELD_PLAN_COLUMNS.DIFFPRECINCTS] || '';
        const cities = normalizeMultiSelect(row[FIELD_PLAN_COLUMNS.CITIES]).join(' | ');

        // Resolve county names once (resolveCountyName is free — no sheet reads)
        const resolvedCounties = counties.map(raw => {
            const result = resolveCountyName(raw);
            return {
                raw,
                name: result.valid ? result.countyName : raw.toString().trim().toUpperCase()
            };
        });

        // Assign each precinct to its best-matching county
        const precinctAssignments = new Map();

        if (rawPrecincts.length > 0) {
            rawPrecincts.forEach(rawP => {
                let bestMatch = null;

                for (const { name: countyName } of resolvedCounties) {
                    const result = resolvePrecinctCode(rawP, countyName, precinctsByCounty);

                    // Exact match wins immediately
                    if (result.valid && result.matchType === 'exact') {
                        bestMatch = { countyName, ...result };
                        break;
                    }
                    // Fuzzy or unvalidated — keep as fallback if no exact match yet
                    if (result.valid && result.matchType !== 'not_found' && !bestMatch) {
                        bestMatch = { countyName, ...result };
                    }
                }

                if (bestMatch) {
                    if (!precinctAssignments.has(bestMatch.countyName)) {
                        precinctAssignments.set(bestMatch.countyName, []);
                    }
                    precinctAssignments.get(bestMatch.countyName).push({
                        precinctCode: bestMatch.precinctCode,
                        rawValue: bestMatch.rawValue,
                        matchType: bestMatch.matchType
                    });
                }
            });
        }

        // Generate output rows
        resolvedCounties.forEach(({ raw: countyRaw, name: countyName }) => {
            const countyFips = fipsMap.get(countyName) || '';
            const assigned = precinctAssignments.get(countyName) || [];

            if (assigned.length > 0) {
                assigned.forEach(p => {
                    rows.push([
                        orgName, countyRaw, countyName, countyFips,
                        p.rawValue, p.precinctCode,
                        precinctNameMap.get(`${countyName}|${p.precinctCode}`) || '',
                        p.matchType, willingOther, cities
                    ]);
                });
            } else {
                // No precincts assigned — one row with empty precinct columns
                rows.push([
                    orgName, countyRaw, countyName, countyFips,
                    '', '', '', '', willingOther, cities
                ]);
            }
        });
    });

    return { headers, rows };
}

/**
 * Builds rows for analysis_org_demographics (one row per org × category × value).
 * @param {Array[]} fieldPlanData - raw field plan sheet data (includes header at index 0)
 * @returns {{headers: string[], rows: Array[]}}
 */
function buildOrgDemographicsTab(fieldPlanData) {
    const headers = ['org_name', 'demo_category', 'demo_value', 'demo_confidence'];

    const demoFields = [
        { category: 'race', column: FIELD_PLAN_COLUMNS.DEMORACE },
        { category: 'age', column: FIELD_PLAN_COLUMNS.DEMOAGE },
        { category: 'gender', column: FIELD_PLAN_COLUMNS.DEMOGENDER },
        { category: 'affinity', column: FIELD_PLAN_COLUMNS.DEMOAFFINITY }
    ];

    const rows = [];

    fieldPlanData.slice(1).forEach(row => {
        const orgName = (row[FIELD_PLAN_COLUMNS.MEMBERNAME] || '').toString().trim();
        if (!orgName) return;

        const confidence = row[FIELD_PLAN_COLUMNS.DEMOCONFIDENCE] || '';

        demoFields.forEach(({ category, column }) => {
            normalizeMultiSelect(row[column]).forEach(value => {
                rows.push([orgName, category, value, confidence]);
            });
        });
    });

    return { headers, rows };
}

/**
 * Builds rows for analysis_org_budgets (one row per org).
 * Generates 3 columns per line item (requested, total, gap) plus summary totals.
 * @param {Array[]} budgetData - raw budget sheet data (includes header at index 0)
 * @returns {{headers: string[], rows: Array[]}}
 */
function buildOrgBudgetsTab(budgetData) {
    const headers = ['org_name', 'submission_id'];
    BUDGET_LINE_ITEMS.forEach(item => {
        headers.push(`${item}_requested`, `${item}_total`, `${item}_gap`);
    });
    headers.push('requested_total', 'project_total', 'gap_total', 'sum_outreach', 'sum_non_outreach');

    const rows = budgetData.slice(1)
        .filter(row => row[BUDGET_COLUMNS.MEMBERNAME])
        .map(row => {
            const values = [
                (row[BUDGET_COLUMNS.MEMBERNAME] || '').toString().trim(),
                row[BUDGET_COLUMNS.SUBMISSIONID] || ''
            ];

            let sumOutreach = 0;
            let sumNonOutreach = 0;

            BUDGET_LINE_ITEMS.forEach(item => {
                const key = item.toUpperCase();
                const requested = parseFloat(row[BUDGET_COLUMNS[`${key}REQUESTED`]]) || 0;
                const total = parseFloat(row[BUDGET_COLUMNS[`${key}TOTAL`]]) || 0;
                const gap = parseFloat(row[BUDGET_COLUMNS[`${key}GAP`]]) || 0;
                values.push(requested, total, gap);

                if (OUTREACH_ITEMS.has(item)) {
                    sumOutreach += requested;
                } else {
                    sumNonOutreach += requested;
                }
            });

            values.push(
                parseFloat(row[BUDGET_COLUMNS.REQUESTEDTOTAL]) || 0,
                parseFloat(row[BUDGET_COLUMNS.PROJECTTOTAL]) || 0,
                parseFloat(row[BUDGET_COLUMNS.GAPTOTAL]) || 0,
                sumOutreach,
                sumNonOutreach
            );

            return values;
        });

    return { headers, rows };
}

// ========================
// ENTRY POINTS
// ========================

/**
 * Clears and rewrites all 5 analysis tabs from scratch.
 * Reads source data and reference sheets once, then builds each tab.
 * @returns {{orgPlans: number, orgTactics: number, orgCounties: number, orgDemographics: number, orgBudgets: number}}
 * @example rebuildAnalysisTabs()
 *   => { orgPlans: 32, orgTactics: 78, orgCounties: 95, orgDemographics: 210, orgBudgets: 30 }
 * @example rebuildAnalysisTabs() => { orgPlans: 0, ... } (if sheets are empty)
 */
function rebuildAnalysisTabs() {
    Logger.log('=== REBUILDING ANALYSIS TABS ===');
    const startTime = new Date();

    // --- Read all source data once ---
    const fieldPlanSheet = getSheet(scriptProps.getProperty('SHEET_FIELD_PLAN'));
    const fieldPlanData = fieldPlanSheet.getDataRange().getValues();
    Logger.log(`Field plan rows: ${fieldPlanData.length - 1}`);

    const budgetSheet = getSheet(scriptProps.getProperty('SHEET_FIELD_BUDGET'));
    const budgetData = budgetSheet.getDataRange().getValues();
    Logger.log(`Budget rows: ${budgetData.length - 1}`);

    // --- Pre-load reference data (avoids repeated sheet reads) ---
    const vanEntries = loadVanLookup();
    Logger.log(`VAN lookup entries: ${vanEntries.length}`);

    const { fipsMap, precinctsByCounty, precinctNames } = loadCountyPrecinctData();
    Logger.log(`County FIPS entries: ${fipsMap.size}, Counties with precincts: ${precinctsByCounty.size}`);

    // --- Build and write each tab ---
    const plansResult = buildOrgPlansTab(fieldPlanData, vanEntries);
    const orgPlans = writeTab(ANALYSIS_TABS.ORG_PLANS, plansResult.headers, plansResult.rows);

    const tacticsResult = buildOrgTacticsTab(fieldPlanData);
    const orgTactics = writeTab(ANALYSIS_TABS.ORG_TACTICS, tacticsResult.headers, tacticsResult.rows);

    const countiesResult = buildOrgCountiesTab(fieldPlanData, fipsMap, precinctsByCounty, precinctNames);
    const orgCounties = writeTab(ANALYSIS_TABS.ORG_COUNTIES, countiesResult.headers, countiesResult.rows);

    const demosResult = buildOrgDemographicsTab(fieldPlanData);
    const orgDemographics = writeTab(ANALYSIS_TABS.ORG_DEMOGRAPHICS, demosResult.headers, demosResult.rows);

    const budgetsResult = buildOrgBudgetsTab(budgetData);
    const orgBudgets = writeTab(ANALYSIS_TABS.ORG_BUDGETS, budgetsResult.headers, budgetsResult.rows);

    const elapsed = ((new Date() - startTime) / 1000).toFixed(1);
    Logger.log(`=== ANALYSIS TABS COMPLETE (${elapsed}s) ===`);

    return { orgPlans, orgTactics, orgCounties, orgDemographics, orgBudgets };
}

/**
 * Test wrapper for rebuildAnalysisTabs. Logs row counts.
 * Run from the Apps Script editor: Run > testRebuildAnalysisTabs
 */
function testRebuildAnalysisTabs() {
    Logger.log('=== TEST: Rebuilding Analysis Tabs ===');
    try {
        const counts = rebuildAnalysisTabs();
        Logger.log('Row counts:');
        Object.entries(counts).forEach(([tab, count]) => {
            Logger.log(`  ${tab}: ${count}`);
        });
        Logger.log('Test passed — check the spreadsheet for the 5 analysis tabs');
    } catch (error) {
        Logger.log(`Test FAILED: ${error.message}`);
        Logger.log(error.stack);
    }
}
