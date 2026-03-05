/**
 * Query Builder - Resolver Functions
 *
 * Converts field plan form values into BQ-compatible values
 *
 * Each function handles one category of resolution:
 *      resolveVanId()          -- Org Name --> VAN Committee ID
 *      resolveCountyName()     -- Form county --> validated uppercase county
 *      resolvePrecinctCode()   -- Form precinct --> zero-padded precinct code
 *      mapRaceDemographics()   -- Form race selections --> Catalist race values
 *      mapAgeDemographics()    -- Form age selections --> SQL "BETWEEN" clauses
 *      generateActivistCode()  -- Org + County + Precinct --> activist code
 * Last Updated: 2026-03-03
 */

/**
 * Resolves an organization name to its VAN committee ID.
 *
 * Reads the van_id_lookup sheet tab and attempts three matching strategies
 * in order:
 *   1. Exact match (case-insensitive)
 *   2. Normalized match (strip punctuation, extra spaces, lowercase)
 *   3. Contains match (one name contains the other)
 *
 * The van_id_lookup sheet must have two columns:
 *   Column A: Organization name (committeename from BigQuery)
 *   Column B: VAN committee ID (committeeid from BigQuery)
 *
 * @param {string} orgName - Organization name from the field plan form
 *   (FieldPlan.memberOrgName, column 2)
 * @returns {Object} Result object with:
 *   - found {boolean}: Whether a match was found
 *   - committeeId {string|null}: The VAN committee ID if found, null otherwise
 *   - committeeName {string|null}: The matched committee name if found
 *   - matchType {string}: 'exact', 'normalized', 'contains', or 'none'
 */
function resolveVanId(orgName) {
    if (!orgName) {
        Logger.log('resolveVanId: orgName is empty or null');
        return { found: false, committeeId: null, committeeName: null, matchType: 'none' };
    }

    try {
        const config = getQueryConfig();
        const sheet = getSheet(config.sheetVanIdLookup);
        const data = sheet.getDataRange().getValues();

        // Parse rows into structured entries, skipping header row (0)
        const entries = data.slice(1).map(row => ({
            name: (row[0] || '').toString().trim(),
            id: (row[1] || '').toString().trim()
        }));

        const orgNameLower = orgName.trim().toLowerCase();
        const orgNameNormalized = normalizeOrgName(orgName);

        // Define strategies in priority order
        const strategies = [
            { type: 'exact', test: e => e.name.toLowerCase() === orgNameLower },
            { type: 'normalized', test: e => normalizeOrgName(e.name) === orgNameNormalized },
            { type: 'contains', test: e =>
                orgNameLower.includes(e.name.toLowerCase())
                    || e.name.toLowerCase().includes(orgNameLower)
            }
        ];

        // Walk strategies in priority order, return first match
        const result = strategies.reduce((found, strategy) => {
            if (found) return found;
            const match = entries.find(strategy.test);
            return match
                ? { found: true, committeeId: match.id, committeeName: match.name, matchType: strategy.type }
                : null;
        }, null);

        if (result) {
            Logger.log(`resolveVanId: ${result.matchType} match found for "${orgName}" -> 
                "${result.committeeName}" ID: ${result.committeeId}`);
            return result;
        }

        Logger.log(`resolveVanId: No match found for "${orgName}"`);
        return { found: false, committeeId: null, committeeName: null, matchType: 'none' };

    } catch (error) {
        Logger.log(`resolveVanId error: ${error.message}`);
        return { found: false, committeeId: null, committeeName: null, matchType: 'none' };
    }
}

/**
 * Normalizes an organization name for fuzzy matching.
 *
 * Strips punctuation, collapses whitespace, and lowercases. This catches
 * differences like "Org, Inc." vs "Org Inc" or "Org  Name" vs "Org Name".
 *
 * @param {string} name - Raw organization name
 * @returns {string} Normalized name (lowercase, no punctuation, single spaces)
 */
function normalizeOrgName(name) {
  if (!name) return '';
  return name
    .toString()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Resolves a field plan county name to a validated uppercase county name.
 *
 * The field plan form stores counties as multi-select values.
 * This function takes a single county string, trims it, and converts
 * to uppercase for use in BigQuery WHERE clauses.
 *
 * @param {string} fieldPlanCounty - A single county name from the form
 * @returns {Object} Result object with:
 *      - valid {boolean}: Whether the county name is non-empty after cleaning
 *      - countyName {string}: Uppercase trimmed county name
 *      - abbreviation {string}: First 4 characters uppercase (for activist code generation)
 *
 * @example
 *      resolveCountyName('   houston  ')
 *      // { valid: true, countyName: 'HOUSTON', abbreviation: 'HOUS'}
 */
function resolveCountyName(fieldPlanCounty) {
    if (!fieldPlanCounty) {
        Logger.log('resolveCountyName: empty county name');
        return { valid: false, countyName: '', abbreviation: '' };
    }

    const cleaned = fieldPlanCounty.toString().trim().toUpperCase();

    if (cleaned.length === 0) {
        Logger.log('resolveCountyName: county name is empty after trimming');
        return { valid: false, countyName: '', abbreviation: '' };
    }

    const abbreviation = cleaned.substring(0, 4);

    Logger.log(`resolveCountyName: "${fieldPlanCounty}" -> "${cleaned}" (abbrev: ${abbreviation})`);
    return { valid: true, countyName: cleaned, abbreviation: abbreviation };
}

/**
 * Loads valid precinct codes for a county from the county_precinct tab.
 * @param {string} countyName - uppercase county name
 * @returns {string[]} Array of zero-padded precinct codes
 */
function getCountyPrecincts(countyName) {
    const config = getQueryConfig();
    const sheet = getSheet(config.sheetCountyPrecinct);
    const data = sheet.getDataRange().getValues();

    // Column B = countyname, Column C = precinctcode (this is based on the current spreadsheet structure)
    return data.slice(1)
        .filter(row => (row[1] || '').toString().trim().toUpperCase() === countyName)
        .map(row => (row[2] || '').toString().trim());
}

/**
 * Resolves a field plan precinct value to a zero-padded precinct code
 * 
 * @param {string} fieldPlanPrecinct - a single precinct value from the form 
 * @param {string} countyName - The resolved uppercanse county name, used for context logging
 * @returns {Object} Result object with:
 *      - valid {boolean}: Whether a numeric precinct code was extracted
 *      - precinctCode {string} : Zero-padded 5-digit precinct code
 *      - rawVale {string}: The original form value (for debugging)
 * 
 * @example
 *      resolvePrecinctCode('182', 'HOUSTON')
 *      // { valid: true, precinctCode: '00182', rawValue: '182' }
 */
function resolvePrecinctCode(fieldPlanPrecinct, countyName) {
    //No precinct, mark as empty in log
    if (!fieldPlanPrecinct) {
        Logger.log('resolvePrecinctCode: empty precinct value');
        return { valid: false, precinctCode: '', rawValue: '', matchType: 'none'};
    }

    const rawValue = fieldPlanPractince.toString().trim();

    //Extract numeric portion only
    const numericOnly = rawValue.replace(/[^0-9]/g, '');

    if (numericOnly.length === 0) {
        Logger.log(`resolvePrecinctCode: no numeric value found in "${rawValue}" for county ${countyName}`);
        return { valid: false, precinctCode: '', rawValue: rawValue, matchType: 'none'};
    }

    //Zero-pad to 5 digits
    const padded = numericOnly.padStart(5, '0')

    //Load valid precincts for this county
    let validPrecincts = [];
    try {
        validPrecincts = getCountyPrecincts(countyName);
    } catch (e) {
        Logger.log(`resolvePrecinctCode: county_precinct lookup failed (${e.message}),
            falling back to unvalidated`);
    }

    //Fallback: if lookup tab is empty or unavailable, return unvalidated
    if (validPrecincts.length === 0) {
        Logger.log(`resolvePrecinctCode: no valid precincts for count ${countyName},
            returning unvalidated`);
        return { valid: true, precinctCode: padded, rawValue: rawValue, matchType: 'unvalidated' };
    }

    //Exact Match - Strategy 1
    if (validPrecincts.includes(padded)) {
        Logger.log(`resolvePrecinctCode: exact match "${rawValue} ->
            "${padded} (county: ${countyName})`)
        return { valid: true, precinctCode: padded, rawValue: rawValue, matchType: 'exact' };
    }

    //Fuzzy numeric match (distance <=2) - Strategy 2
    const inputNum = parseint(numericOnly, 10);
    const fuzzyMatch = validPrecincts
        .map(code => ({ code, distance: Math.abs(inputNum - parseInt(code, 10)) }))
        .filter(entry => !isNaN(entry.distance) && entry.distance <= 2)
        .reduce((best, entry) => (!best || entry.distance < best.distance) ? entry : best, null);
    
    if (fuzzyMatch) {
        Logger.log(`resolvePrecinctCode: fuzzy match "${rawValue}" -> "${fuzzyMatch.code}"
            (distance: ${fuzzyMatch.distance}, county: ${countyName})`);
        return { valid: true, precinctCode: fuzzyMatch.code, rawValue: rawValue, matchType: 'fuzzy'};
    }

    //No match
    Logger.log(`resolvePrecinctCode: no match for "${rawValue}"
        (padded: ${padded} in county ${countyName})`);
    return { valid: false, precinctCode: padded, rawValue: rawValue, matchType: 'not_found'};
}

/**
 * Maps an array of field plan race selections to Catalist race values.
 *
 * Uses the RACE_MAP constant from _query_config.js. Any form value not
 * found in RACE_MAP is excluded from the Catalist filter and tracked in
 * the `unmapped` array.
 *
 * IMPORTANT: Do NOT map unmapped values to 'unknown'. In Catalist,
 * 'unknown' is a real race value meaning "no race data available for
 * this voter," not a catch-all for unrecognized form inputs.
 *
 * If the input array is empty or null, returns hasFilter: false, which
 * signals the SQL builder to omit the race filter entirely.
 * 
 * @param {string[]} demoRaceArray - Array of race selections. Values are normalized
 *      by the FieldPlan constructor first.
 * @returns {Object} Result object with:
 *      - hasFilter {boolean}: Whether any values were mapped ('true' triggers WHERE clause inclusion)
 *      - catalistValues {string[]}: Set array of Catalist race values
 *      - unmappedComment {string}: SQL comment listing unmapped values or empty string
 *  * @example
 *   mapRaceDemographics(['Black / African American', 'Multiracial'])
 *   // {
 *   //   hasFilter: true,
 *   //   catalistValues: ['black'],
 *   //   unmapped: ['Multiracial'],
 *   //   unmappedComment: -- Unmapped race selections: Multiracial 
 */
function mapRaceDemographics(demoRaceArray) {
    if (!demoRaceArray || !Array.isArray(demoRaceArray) || demoRaceArray.length === 0) {
        Logger.log('mapRaceDemographics: no race selections provided, omitting race filter');
        return { hasFilter: false, catalistValues: [], unmapped: [] };
    }

    // Map form values to Catalist values, tracking unmapped entries
    const mapped = demoRaceArray.map(v => {
        const formValue = v.toString().trim();
        const catalistValue = RACE_MAP[formValue] || null;
        return { formValue, catalistValue, isMapped: !!catalistValue };
    });

    const unmapped = mapped.filter(m => !m.isMapped).map(m => m.formValue);
    const catalistValues = [...new Set(
        mapped.filter(m => m.isMapped).map(m => m.catalistValue)
    )];

    unmapped.forEach(v => {
        Logger.log(`mapRaceDemographics: unmapped race "${v}" — excluded from filter (not mapped to "unknown")`);
    });

    // Build SQL comment so query reviewers can see what the org selected
    const unmappedComment = unmapped.length > 0
        ? `-- Unmapped race selections: ${unmapped.join(', ')}`
        : '';

    Logger.log(`mapRaceDemographics: ${demoRaceArray.length} selections -> ${catalistValues.length} Catalist values: ${catalistValues.join(', ')}`);
    return { hasFilter: catalistValues.length > 0, catalistValues: catalistValues, unmapped: unmapped, unmappedComment: unmappedComment };
}


