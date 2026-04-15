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
 * @param {Array<{name: string, id: string}>|null} [preloadedEntries=null] - Pre-loaded VAN entries; if null, reads from sheet
 * @returns {{found: boolean, committeeId: string|null, committeeName: string|null, matchType: string}}
 * @example resolveVanId('NAACP') // { found: true, committeeId: '12345', committeeName: 'NAACP', matchType: 'exact' }
 * @example resolveVanId('')      // { found: false, committeeId: null, committeeName: null, matchType: 'none' }
 */
function resolveVanId(orgName, preloadedEntries = null) {
    if (!orgName) {
        Logger.log('resolveVanId: orgName is empty or null');
        return { found: false, committeeId: null, committeeName: null, matchType: 'none' };
    }

    try {
        // Use pre-loaded entries if provided, otherwise read from sheet
        const entries = preloadedEntries || (() => {
            const config = getQueryConfig();
            const sheet = getSheet(config.sheetVanIdLookup);
            const data = sheet.getDataRange().getValues();
            return data.slice(1).map(row => ({
                name: (row[0] || '').toString().trim(),
                id: (row[1] || '').toString().trim()
            }));
        })();

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
 * @param {Map<string, string[]>|null} [preloadedMap=null] - Pre-loaded county→precincts map; if null, reads from sheet
 * @returns {string[]} Array of zero-padded precinct codes
 * @example getCountyPrecincts('HOUSTON') // ['00182', '00183', '00184']
 * @example getCountyPrecincts('FAKE')    // []
 */
function getCountyPrecincts(countyName, preloadedMap = null) {
    if (preloadedMap) return preloadedMap.get(countyName) || [];

    const config = getQueryConfig();
    const sheet = getSheet(config.sheetCountyPrecinct);
    const data = sheet.getDataRange().getValues();

    // Column B = countyname, Column C = precinctcode (this is based on the current spreadsheet structure)
    return data.slice(1)
        .filter(row => (row[1] || '').toString().trim().toUpperCase() === countyName)
        .map(row => (row[2] || '').toString().trim());
}

/**
 * Load precinct names for a county from the county_precinct tab.
 * @param {string} countyName - Uppercase county name
 * @param {Map<string, string>|null} [preloadedNameMap=null] - Pre-loaded "COUNTY|code" → name map; if null, reads from sheet
 * @returns {Map<string, string>} Map of precinctCode → precinctName
 * @example getCountyPrecinctNames('HOUSTON') // Map { '00182' => 'DOTHAN CIVIC CENTER 241', ... }
 * @example getCountyPrecinctNames('FAKE')    // Map {}
 */
function getCountyPrecinctNames(countyName, preloadedNameMap = null) {
    if (preloadedNameMap) {
        const result = new Map();
        for (const [key, name] of preloadedNameMap) {
            if (key.startsWith(`${countyName}|`)) {
                result.set(key.split('|')[1], name);
            }
        }
        return result;
    }

    const config = getQueryConfig();
    const sheet = getSheet(config.sheetCountyPrecinct);
    const data = sheet.getDataRange().getValues();

    const result = new Map();
    data.slice(1).forEach(row => {
        const county = (row[1] || '').toString().trim().toUpperCase();
        const code = (row[2] || '').toString().trim();
        const name = row.length > 3 ? (row[3] || '').toString().trim() : '';
        if (county === countyName && code && name) {
            result.set(code, name);
        }
    });
    return result;
}

/** Patterns that indicate a non-precinct geographic reference */
const NON_PRECINCT_PATTERNS = /\b(congressional|district|city council|council district|ward|senate|house)\b/i;

/**
 * Resolve a precinct value to a zero-padded 5-digit code with county validation.
 *
 * Matching phases:
 *   0. Reject non-precinct patterns (congressional district, ward, etc.)
 *   1. Numeric-only input → pad and match against valid codes
 *   2. Name-based match → compare against precinct names for the county
 *   3. Trailing-number extraction → extract last number from text input
 *   4. No match
 *
 * @param {string} fieldPlanPrecinct - A single precinct value from the form
 * @param {string} countyName - Resolved uppercase county name
 * @param {Map<string, string[]>|null} [preloadedPrecinctMap=null] - Pre-loaded county→precincts map; if null, reads from sheet
 * @param {Map<string, string>|null} [preloadedNameMap=null] - Pre-loaded "COUNTY|code"→name map; if null, reads from sheet when needed
 * @returns {{valid: boolean, precinctCode: string, rawValue: string, matchType: string}}
 * @example resolvePrecinctCode('182', 'HOUSTON') // { valid: true, precinctCode: '00182', rawValue: '182', matchType: 'exact' }
 * @example resolvePrecinctCode('Congressional District 3', 'HOUSTON') // { valid: false, precinctCode: '', rawValue: 'Congressional District 3', matchType: 'not_precinct' }
 */
function resolvePrecinctCode(fieldPlanPrecinct, countyName, preloadedPrecinctMap = null, preloadedNameMap = null) {
    if (!fieldPlanPrecinct) {
        Logger.log('resolvePrecinctCode: empty precinct value');
        return { valid: false, precinctCode: '', rawValue: '', matchType: 'none' };
    }

    const rawValue = fieldPlanPrecinct.toString().trim();

    // Phase 0 — Reject non-precinct patterns
    if (NON_PRECINCT_PATTERNS.test(rawValue)) {
        Logger.log(`resolvePrecinctCode: rejected non-precinct input "${rawValue}" for county ${countyName}`);
        return { valid: false, precinctCode: '', rawValue, matchType: 'not_precinct' };
    }

    // Load valid precincts for this county (shared across phases)
    let validPrecincts = [];
    try {
        validPrecincts = getCountyPrecincts(countyName, preloadedPrecinctMap);
    } catch (e) {
        Logger.log(`resolvePrecinctCode: county_precinct lookup failed (${e.message}), falling back to unvalidated`);
    }

    // Determine if input is purely numeric (digits, optional leading zeros/spaces)
    const isNumericOnly = /^\s*\d+\s*$/.test(rawValue);

    // Phase 1 — Numeric-only input
    if (isNumericOnly) {
        const numericOnly = rawValue.replace(/[^0-9]/g, '');
        const padded = numericOnly.padStart(5, '0');

        if (validPrecincts.length === 0) {
            Logger.log(`resolvePrecinctCode: no valid precincts for county ${countyName}, returning unvalidated`);
            return { valid: true, precinctCode: padded, rawValue, matchType: 'unvalidated' };
        }

        if (validPrecincts.includes(padded)) {
            Logger.log(`resolvePrecinctCode: exact match "${rawValue}" -> "${padded}" (county: ${countyName})`);
            return { valid: true, precinctCode: padded, rawValue, matchType: 'exact' };
        }

        const inputNum = parseInt(numericOnly, 10);
        const fuzzyMatch = validPrecincts
            .map(code => ({ code, distance: Math.abs(inputNum - parseInt(code, 10)) }))
            .filter(entry => !isNaN(entry.distance) && entry.distance <= 2)
            .reduce((best, entry) => (!best || entry.distance < best.distance) ? entry : best, null);

        if (fuzzyMatch) {
            Logger.log(`resolvePrecinctCode: fuzzy match "${rawValue}" -> "${fuzzyMatch.code}" (distance: ${fuzzyMatch.distance}, county: ${countyName})`);
            return { valid: true, precinctCode: fuzzyMatch.code, rawValue, matchType: 'fuzzy' };
        }

        Logger.log(`resolvePrecinctCode: no match for numeric input "${rawValue}" (padded: ${padded}) in county ${countyName}`);
        return { valid: false, precinctCode: padded, rawValue, matchType: 'not_found' };
    }

    // Phase 2 — Name-based match (input contains letters)
    const precinctNames = getCountyPrecinctNames(countyName, preloadedNameMap);
    if (precinctNames.size > 0) {
        const inputUpper = rawValue.toUpperCase();

        // Try exact name match
        for (const [code, name] of precinctNames) {
            if (inputUpper === name.toUpperCase()) {
                Logger.log(`resolvePrecinctCode: name match "${rawValue}" -> "${code}" (exact name, county: ${countyName})`);
                return { valid: true, precinctCode: code, rawValue, matchType: 'name_match' };
            }
        }

        // Try substring containment
        const substringMatches = [];
        for (const [code, name] of precinctNames) {
            const nameUpper = name.toUpperCase();
            if (inputUpper.includes(nameUpper) || nameUpper.includes(inputUpper)) {
                substringMatches.push({ code, name });
            }
        }

        if (substringMatches.length === 1) {
            Logger.log(`resolvePrecinctCode: name match "${rawValue}" -> "${substringMatches[0].code}" (substring, county: ${countyName})`);
            return { valid: true, precinctCode: substringMatches[0].code, rawValue, matchType: 'name_match' };
        }

        if (substringMatches.length > 1) {
            // Prefer match where trailing number in input matches the code's numeric portion
            const trailingNum = rawValue.match(/(\d+)\s*$/);
            if (trailingNum) {
                const trailingPadded = trailingNum[1].padStart(5, '0');
                const preferred = substringMatches.find(m => m.code === trailingPadded);
                if (preferred) {
                    Logger.log(`resolvePrecinctCode: name match "${rawValue}" -> "${preferred.code}" (substring + trailing number, county: ${countyName})`);
                    return { valid: true, precinctCode: preferred.code, rawValue, matchType: 'name_match' };
                }
            }
            // Multiple matches, no clear winner — fall through to word overlap
            Logger.log(`resolvePrecinctCode: ${substringMatches.length} name substring matches for "${rawValue}", trying word overlap`);
        }

        // Try word-overlap matching (handles truncated/partial precinct names)
        const PRECINCT_STOP_WORDS = new Set(['at', 'the', 'of', 'in', 'and', 'for']);
        const inputTokens = inputUpper.split(/\s+/)
            .filter(w => w.length >= 3 && !PRECINCT_STOP_WORDS.has(w.toLowerCase()));

        if (inputTokens.length >= 1) {
            const overlapResults = [];
            for (const [code, name] of precinctNames) {
                const nameTokens = name.toUpperCase().split(/\s+/);
                const matches = inputTokens.filter(inputWord =>
                    nameTokens.some(nameWord =>
                        nameWord.startsWith(inputWord) || inputWord.startsWith(nameWord)
                    )
                );
                if (matches.length >= 1) {
                    overlapResults.push({ code, name, score: matches.length, longestMatch: Math.max(...matches.map(m => m.length)) });
                }
            }

            // Strong overlap (2+ words) — take best match
            const strongMatches = overlapResults.filter(r => r.score >= 2);
            if (strongMatches.length === 1) {
                Logger.log(`resolvePrecinctCode: name match "${rawValue}" -> "${strongMatches[0].code}" (word overlap ${strongMatches[0].score} words, county: ${countyName})`);
                return { valid: true, precinctCode: strongMatches[0].code, rawValue, matchType: 'name_match' };
            }
            if (strongMatches.length > 1) {
                const sorted = strongMatches.sort((a, b) => b.score - a.score);
                if (sorted[0].score > sorted[1].score) {
                    Logger.log(`resolvePrecinctCode: name match "${rawValue}" -> "${sorted[0].code}" (word overlap ${sorted[0].score} words, county: ${countyName})`);
                    return { valid: true, precinctCode: sorted[0].code, rawValue, matchType: 'name_match' };
                }
            }

            // Weak overlap (1 distinctive word, 4+ chars, unique match)
            if (overlapResults.length === 1 && overlapResults[0].longestMatch >= 4) {
                Logger.log(`resolvePrecinctCode: name match "${rawValue}" -> "${overlapResults[0].code}" (word overlap, unique on "${overlapResults[0].name}", county: ${countyName})`);
                return { valid: true, precinctCode: overlapResults[0].code, rawValue, matchType: 'name_match' };
            }

            if (overlapResults.length > 1) {
                Logger.log(`resolvePrecinctCode: ${overlapResults.length} word-overlap matches for "${rawValue}" in ${countyName}, ambiguous`);
            }
        }
    }

    // Phase 3 — Trailing-number extraction (fallback for text inputs)
    const trailingMatch = rawValue.match(/(\d+)\s*$/);
    if (trailingMatch) {
        const padded = trailingMatch[1].padStart(5, '0');

        if (validPrecincts.length === 0) {
            Logger.log(`resolvePrecinctCode: no valid precincts for county ${countyName}, returning unvalidated (trailing number)`);
            return { valid: true, precinctCode: padded, rawValue, matchType: 'unvalidated' };
        }

        if (validPrecincts.includes(padded)) {
            Logger.log(`resolvePrecinctCode: exact match via trailing number "${rawValue}" -> "${padded}" (county: ${countyName})`);
            return { valid: true, precinctCode: padded, rawValue, matchType: 'exact' };
        }

        const inputNum = parseInt(trailingMatch[1], 10);
        const fuzzyMatch = validPrecincts
            .map(code => ({ code, distance: Math.abs(inputNum - parseInt(code, 10)) }))
            .filter(entry => !isNaN(entry.distance) && entry.distance <= 2)
            .reduce((best, entry) => (!best || entry.distance < best.distance) ? entry : best, null);

        if (fuzzyMatch) {
            Logger.log(`resolvePrecinctCode: fuzzy match via trailing number "${rawValue}" -> "${fuzzyMatch.code}" (distance: ${fuzzyMatch.distance}, county: ${countyName})`);
            return { valid: true, precinctCode: fuzzyMatch.code, rawValue, matchType: 'fuzzy' };
        }

        Logger.log(`resolvePrecinctCode: no match for trailing number in "${rawValue}" (padded: ${padded}) in county ${countyName}`);
        return { valid: false, precinctCode: padded, rawValue, matchType: 'not_found' };
    }

    // Phase 4 — No match
    Logger.log(`resolvePrecinctCode: no match for "${rawValue}" in county ${countyName}`);
    return { valid: false, precinctCode: '', rawValue, matchType: 'not_found' };
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
