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
 * Resolve an org name to its VAN committee ID via exact, normalized, or contains match.
 * @param {string} orgName - Organization name from the field plan form
 * @returns {{found: boolean, committeeId: string|null, committeeName: string|null, matchType: string}}
 * @example resolveVanId('NAACP') // { found: true, committeeId: '12345', committeeName: 'NAACP', matchType: 'exact' }
 * @example resolveVanId('')      // { found: false, committeeId: null, committeeName: null, matchType: 'none' }
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
 * Normalize an org name for fuzzy matching (lowercase, no punctuation, single spaces).
 * @param {string} name - Raw organization name
 * @returns {string} Normalized name
 * @example normalizeOrgName('Org, Inc.') // 'org inc'
 * @example normalizeOrgName('')          // ''
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
 * Resolve a county name to validated uppercase with 4-char abbreviation.
 * @param {string} fieldPlanCounty - A single county name from the form
 * @returns {{valid: boolean, countyName: string, abbreviation: string}}
 * @example resolveCountyName('houston') // { valid: true, countyName: 'HOUSTON', abbreviation: 'HOUS' }
 * @example resolveCountyName('')        // { valid: false, countyName: '', abbreviation: '' }
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
 * Load valid precinct codes for a county from the county_precinct tab.
 * @param {string} countyName - Uppercase county name
 * @returns {string[]} Array of zero-padded precinct codes
 * @example getCountyPrecincts('HOUSTON') // ['00182', '00183', '00184']
 * @example getCountyPrecincts('FAKE')    // []
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
 * Resolve a precinct value to a zero-padded 5-digit code with county validation.
 * @param {string} fieldPlanPrecinct - A single precinct value from the form
 * @param {string} countyName - Resolved uppercase county name
 * @returns {{valid: boolean, precinctCode: string, rawValue: string, matchType: string}}
 * @example resolvePrecinctCode('182', 'HOUSTON') // { valid: true, precinctCode: '00182', rawValue: '182', matchType: 'exact' }
 * @example resolvePrecinctCode('', 'HOUSTON')    // { valid: false, precinctCode: '', rawValue: '', matchType: 'none' }
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
 * Map form race selections to Catalist race values via RACE_MAP. Unmapped values are excluded, not mapped to 'unknown'.
 * @param {string[]} demoRaceArray - Race selections from the field plan form
 * @returns {{hasFilter: boolean, catalistValues: string[], unmapped: string[], unmappedComment: string}}
 * @example mapRaceDemographics(['Black / African American']) // { hasFilter: true, catalistValues: ['black'], unmapped: [], unmappedComment: '' }
 * @example mapRaceDemographics([])                          // { hasFilter: false, catalistValues: [], unmapped: [] }
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

/**
 * Map form age selections to merged SQL BETWEEN clauses. Contiguous ranges are combined; all-selected omits the filter.
 * @param {string[]} demoAgeArray - Age selections from the field plan form
 * @returns {{hasFilter: boolean, ranges: Array<{min: number, max: number}>, sqlFragment: string, unmapped: string[], unmappedComment: string}}
 * @example mapAgeDemographics(['18 - 19', '20 - 29']) // { hasFilter: true, ranges: [{min:18, max:29}], sqlFragment: 'p.age BETWEEN 18 AND 29', unmapped: [], unmappedComment: '' }
 * @example mapAgeDemographics([])                      // { hasFilter: false, ranges: [], sqlFragment: '', unmapped: [], unmappedComment: '' }
 */
function mapAgeDemographics(demoAgeArray){
    //Member selected no options, no need to filter
    if (!demoAgeArray || !Array.isArray(demoAgeArray) || demoAgeArray.length === 0) {
        Logger.log('mapAgeDemographics: no age selections, omitting age filter');
        return { hasFilter: false, ranges: [], sqlFragment: '', unmapped: [], unmappedComment: '' };
    }

    //Member selected all the age options, no need to filter
    if (demoAgeArray.length >= AGE_RANGE_TOTAL_OPTIONS) {
        Logger.log(`mapAgeDemographics: all ${AGE_RANGE_TOTAL_OPTIONS} age ranges selected,
            omitting age filter`);
        return { hasFilter: false, ranges: [], sqlFragment: '', unmapped: [], unmappedComment: '' };
    }

    const unmapped = [];
    const parsedRanges = demoAgeArray
        .map(v => {
            const formValue = v.toString().trim();
            const range = AGE_RANGE_MAP[formValue];
            if (!range) {
                unmapped.push(formValue);
                Logger.log(`mapAgeDemographics: unrecognized age range "${formValue} - excluded from filter`);
            }
            return range;
        })
        .filter( range => range)
        .sort((a, b) => a.min - b.min)
    
    const unmappedComment = unmapped.length > 0
        ? `--Unmapped age selections: ${unmapped.join(', ')}`
        : '';
    
    if (parsedRanges.length === 0) {
        Logger.log('mapAgeDemographics: no valid age ranges parsed, omitting age filter')
        return { hasFilter: false, ranges: [], sqlFragment: '', unmapped: unmapped, unmappedComment: unmappedComment };
    }

    //Merge contiguous ranges
    const merged = parsedRanges.reduce((acc, range) =>{
        const last = acc[acc.length - 1];
        if (last && range.min <= last.max + 1) {
            last.max = Math.max(last.max, range.max);
        } else {
            acc.push({ min: range.min, max: range.max });
        }
        return acc;
    }, []);

    const clauses = merged.map(r => 'p.age BETWEEN ' + r.min + ' AND ' + r.max);
    const sqlFragment = clauses.length === 1
        ? clauses[0]
        : '(' + clauses.join(' OR ') + ')';
    
    Logger.log(`mapAgeDemographics: ${demoAgeArray.length} selections -> 
        ${merged.length} range(s): ${sqlFragment}`);
    return { hasFilter: true, ranges: merged, sqlFragment: sqlFragment, 
        unmapped: unmapped, unmappedComment: unmappedComment };

}

/**
 * Generate an activist code from org name, county abbreviation, and precinct code.
 * @param {string} orgName - Organization name from the field plan form
 * @param {string} countyAbbreviation - 4-char county abbreviation from resolveCountyName()
 * @param {string} precinctCode - Zero-padded precinct code from resolvePrecinctCode()
 * @returns {string} Activist code (format: XXXX_XXXXX_XXX)
 * @example generateActivistCode('Southern Alabama Black Women Roundtable', 'HOUS', '00182') // 'HOUS_00182_SABWR'
 * @example generateActivistCode('', 'HOUS', '00182')                                        // 'HOUS_00182_ORG'
 */
function generateActivistCode(orgName, countyAbbreviation, precinctCode) {
  // Generate org initials from significant words
  const orgInitials = orgName
    ? orgName.toString().trim().split(/\s+/)
        .map(w => w.toLowerCase().replace(/[^a-z]/g, ''))
        .filter(w => w.length > 0 && !ORG_STOP_WORDS.includes(w))
        .map(w => w.charAt(0).toUpperCase())
        .join('') || 'ORG'
    : 'ORG';

  if (orgInitials === 'ORG') {
    Logger.log(`generateActivistCode: could not extract initials from "${orgName}", using fallback "ORG"`);
  }

  const activistCode = countyAbbreviation + '_' + precinctCode + '_' + orgInitials;
  Logger.log(`generateActivistCode: "${orgName}" + "${countyAbbreviation}" + "${precinctCode}" -> "${activistCode}"`);
  return activistCode;
}
