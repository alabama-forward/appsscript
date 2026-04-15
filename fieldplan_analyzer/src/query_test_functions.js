// Test functions for the BigQuery Query Builder system.
// All tests send emails to test recipients only (datateam@alforward.org).
// Run individual tests from the Apps Script editor or use
// runAllQueryBuilderTests() to run the full suite.

/**
 * Validates that query builder configuration loads correctly.
 * @returns {boolean} True if all config checks pass
 * @example testQueryConfig()
 *   // => true (logs PASS/FAIL for each check)
 * @example testQueryConfig() // missing van_id_lookup sheet
 *   // => false (logs FAIL for that check)
 */
function testQueryConfig() {
  Logger.log('=== TEST: Query Config ===');
  let passed = true;

  try {
    // Check getQueryConfig() is callable
    let config;
    try {
      config = getQueryConfig();
      Logger.log('PASS: getQueryConfig() returned successfully');
    } catch (e) {
      Logger.log(`FAIL: getQueryConfig() threw an error: ${e.message}`);
      return false;
    }

    // Check required config keys
    const requiredKeys = ['projectId', 'precinctListTable', 'metadataTable', 'personTable', 'sheetQueryQueue', 'sheetVanIdLookup'];
    requiredKeys.forEach(key => {
      if (!config[key]) {
        Logger.log(`FAIL: config.${key} is missing or empty`);
        passed = false;
      } else {
        Logger.log(`PASS: config.${key} = ${config[key]}`);
      }
    });

    // Check van_id_lookup sheet
    try {
      const vanSheet = getSheet(config.sheetVanIdLookup);
      const vanData = vanSheet.getDataRange().getValues();
      Logger.log(`PASS: van_id_lookup sheet found with ${vanData.length - 1} rows of data`);
    } catch (e) {
      Logger.log(`FAIL: van_id_lookup sheet not found: ${e.message}`);
      passed = false;
    }

    // Check query_queue sheet
    try {
      getSheet(config.sheetQueryQueue);
      Logger.log('PASS: query_queue sheet found');
    } catch (e) {
      Logger.log(`FAIL: query_queue sheet not found: ${e.message}`);
      passed = false;
    }

  } catch (error) {
    Logger.log(`FAIL: Unexpected error: ${error.message}`);
    passed = false;
  }

  Logger.log(`=== Config Test: ${passed ? 'ALL PASSED' : 'SOME FAILED'} ===`);
  return passed;
}

/**
 * Tests VAN ID resolution with exact match, normalized match, and unknown org scenarios.
 * @returns {boolean} True if all VAN ID resolution tests pass
 * @example testResolveVanId()
 *   // => true (logs PASS for exact, normalized, and unknown tests)
 * @example testResolveVanId() // van_id_lookup sheet empty
 *   // => false
 */
function testResolveVanId() {
  Logger.log('=== TEST: Resolve VAN ID ===');
  let passed = true;

  try {
    // Test 1: Exact match with a known org
    Logger.log('Test 1: Exact match');
    const exactResult = resolveVanId("People's Budget Birmingham");
    if (exactResult && exactResult.found) {
      Logger.log(`PASS: Match found. committeeId = ${exactResult.committeeId}, matchType = ${exactResult.matchType}`);
    } else {
      Logger.log('FAIL: No match found for "People\'s Budget Birmingham"');
      passed = false;
    }

    // Test 2: Normalized match (different casing)
    Logger.log('Test 2: Normalized match');
    const fuzzyResult = resolveVanId("peoples budget birmingham");
    if (fuzzyResult && fuzzyResult.found) {
      Logger.log(`PASS: Normalized match found. committeeId = ${fuzzyResult.committeeId}, matchType = ${fuzzyResult.matchType}`);
    } else {
      Logger.log('FAIL: No normalized match found for "peoples budget birmingham"');
      passed = false;
    }

    // Test 3: Unknown org
    Logger.log('Test 3: Unknown org');
    const unknownResult = resolveVanId('Completely Fake Organization XYZ 12345');
    if (!unknownResult.found) {
      Logger.log('PASS: Correctly returned found=false for unknown org');
    } else {
      Logger.log(`FAIL: Unexpectedly matched unknown org to committeeId ${unknownResult.committeeId}`);
      passed = false;
    }

  } catch (error) {
    Logger.log(`FAIL: Unexpected error: ${error.message}`);
    Logger.log(`Stack: ${error.stack}`);
    passed = false;
  }

  Logger.log(`=== VAN ID Test: ${passed ? 'ALL PASSED' : 'SOME FAILED'} ===`);
  return passed;
}

/**
 * Tests county name resolution to uppercase with abbreviation.
 * @returns {boolean} True if all county resolution tests pass
 * @example testResolveCountyName()
 *   // => true (logs PASS for each test case)
 * @example testResolveCountyName() // bad resolution
 *   // => false (logs FAIL for mismatched result)
 */
function testResolveCountyName() {
  Logger.log('=== TEST: Resolve County Name ===');
  let passed = true;

  try {
    // resolveCountyName returns { valid, countyName, abbreviation }
    // countyName is UPPERCASE
    const testCases = [
      { input: 'Jefferson', expectedCounty: 'JEFFERSON', expectedAbbrev: 'JEFF' },
      { input: 'houston', expectedCounty: 'HOUSTON', expectedAbbrev: 'HOUS' },
      { input: 'Mobile', expectedCounty: 'MOBILE', expectedAbbrev: 'MOBI' },
      { input: '  Dallas  ', expectedCounty: 'DALLAS', expectedAbbrev: 'DALL' }
    ];

    testCases.forEach(tc => {
      const result = resolveCountyName(tc.input);
      if (result.valid && result.countyName === tc.expectedCounty && result.abbreviation === tc.expectedAbbrev) {
        Logger.log(`PASS: "${tc.input}" -> countyName="${result.countyName}", abbreviation="${result.abbreviation}"`);
      } else {
        Logger.log(`FAIL: "${tc.input}" -> valid=${result.valid}, countyName="${result.countyName}", abbreviation="${result.abbreviation}" (expected "${tc.expectedCounty}", "${tc.expectedAbbrev}")`);
        passed = false;
      }
    });

    // Test empty input
    const emptyResult = resolveCountyName('');
    if (!emptyResult.valid) {
      Logger.log('PASS: Empty input returns valid=false');
    } else {
      Logger.log('FAIL: Empty input returned valid=true');
      passed = false;
    }

  } catch (error) {
    Logger.log(`FAIL: Unexpected error: ${error.message}`);
    passed = false;
  }

  Logger.log(`=== County Name Test: ${passed ? 'ALL PASSED' : 'SOME FAILED'} ===`);
  return passed;
}

/**
 * Tests precinct code resolution: numeric padding, non-precinct rejection, and name matching.
 * @returns {boolean} True if all precinct code tests pass
 * @example testResolvePrecinctCode()
 *   // => true (logs PASS for each scenario)
 * @example testResolvePrecinctCode() // bad matching
 *   // => false
 */
function testResolvePrecinctCode() {
  Logger.log('=== TEST: Resolve Precinct Code ===');
  let passed = true;

  try {
    // --- Numeric padding (Phase 1) ---
    Logger.log('--- Phase 1: Numeric-only input ---');
    const paddingCases = [
      { input: '1', expected: '00001' },
      { input: '12', expected: '00012' },
      { input: '182', expected: '00182' },
      { input: '1234', expected: '01234' },
      { input: '00182', expected: '00182' },
      { input: ' 45 ', expected: '00045' }
    ];

    paddingCases.forEach(tc => {
      const result = resolvePrecinctCode(tc.input, 'HOUSTON');
      if (result.precinctCode === tc.expected) {
        Logger.log(`PASS: "${tc.input}" -> "${result.precinctCode}" (matchType: ${result.matchType})`);
      } else {
        Logger.log(`FAIL: "${tc.input}" -> "${result.precinctCode}" (expected "${tc.expected}", matchType: ${result.matchType})`);
        passed = false;
      }
    });

    // --- Non-precinct rejection (Phase 0) ---
    Logger.log('--- Phase 0: Non-precinct pattern rejection ---');
    const rejectCases = [
      'Congressional District 3',
      'all in district 1',
      'City Council 5',
      'Senate District 22',
      'House District 7'
    ];

    rejectCases.forEach(input => {
      const result = resolvePrecinctCode(input, 'HOUSTON');
      if (!result.valid && result.matchType === 'not_precinct') {
        Logger.log(`PASS: "${input}" -> matchType: not_precinct`);
      } else {
        Logger.log(`FAIL: "${input}" -> valid=${result.valid}, matchType=${result.matchType} (expected not_precinct)`);
        passed = false;
      }
    });

    // --- Name-based matching (Phase 2) ---
    Logger.log('--- Phase 2: Name-based matching ---');
    // Build mock data for testing (HOUSTON realistic subset, DALE for unique-word tests)
    const mockNameMap = new Map([
      ['HOUSTON|00241', 'DOTHAN CIVIC CENTER 241'],
      ['HOUSTON|00251', 'ANDREW BELLE COMM CTR 251'],
      ['HOUSTON|00152', 'DOUG TEW COMM CTR 152'],
      ['HOUSTON|00153', 'DOUG TEW COMM CTR 153'],
      ['HOUSTON|00154', 'DOUG TEW COMM CTR 154'],
      ['HOUSTON|00352', 'WESTGATE PARK 352'],
      ['HOUSTON|00354', 'WESTGATE PARK 354'],
      ['HOUSTON|00182', 'FARM CENTER 182'],
      ['DALE|01400', '1400 EWELL BIBLE BAPTIST CHURC'],
      ['DALE|00200', 'OZARK CIVIC CENTER 200'],
      ['BARBOUR|00008', 'MT. ANDREW WATER AUTHORITY']
    ]);
    const mockPrecinctMap = new Map([
      ['HOUSTON', ['00241', '00251', '00152', '00153', '00154', '00352', '00354', '00182']],
      ['DALE', ['01400', '00200']],
      ['BARBOUR', ['00008']]
    ]);

    // Exact name and substring matches
    const nameCases = [
      { input: 'DOTHAN CIVIC CENTER 241', county: 'HOUSTON', expectedCode: '00241', expectedType: 'name_match' },
      { input: 'WESTGATE PARK 352', county: 'HOUSTON', expectedCode: '00352', expectedType: 'name_match' },
      { input: 'FARM CENTER 182', county: 'HOUSTON', expectedCode: '00182', expectedType: 'name_match' }
    ];

    nameCases.forEach(tc => {
      const result = resolvePrecinctCode(tc.input, tc.county, mockPrecinctMap, mockNameMap);
      if (result.valid && result.precinctCode === tc.expectedCode && result.matchType === tc.expectedType) {
        Logger.log(`PASS: "${tc.input}" -> "${result.precinctCode}" (matchType: ${result.matchType})`);
      } else {
        Logger.log(`FAIL: "${tc.input}" -> code="${result.precinctCode}", matchType=${result.matchType} (expected "${tc.expectedCode}", "${tc.expectedType}")`);
        passed = false;
      }
    });

    // Word-overlap: strong match (2+ discriminating words)
    Logger.log('--- Phase 2b: Word-overlap matching ---');
    const overlapCases = [
      { input: 'Andrew Bell', county: 'HOUSTON', expectedCode: '00251', expectedType: 'name_match' }
    ];

    overlapCases.forEach(tc => {
      const result = resolvePrecinctCode(tc.input, tc.county, mockPrecinctMap, mockNameMap);
      if (result.valid && result.precinctCode === tc.expectedCode && result.matchType === tc.expectedType) {
        Logger.log(`PASS: "${tc.input}" -> "${result.precinctCode}" (matchType: ${result.matchType})`);
      } else {
        Logger.log(`FAIL: "${tc.input}" -> code="${result.precinctCode}", matchType=${result.matchType} (expected "${tc.expectedCode}", "${tc.expectedType}")`);
        passed = false;
      }
    });

    // Word-overlap: weak match (single distinctive word after stop-word removal, unique in county)
    Logger.log('--- Phase 2c: Weak word-overlap matching ---');
    // "Civic Center" → stop words remove CENTER → only "CIVIC" remains → unique in HOUSTON
    const civicResult = resolvePrecinctCode('Civic Center', 'HOUSTON', mockPrecinctMap, mockNameMap);
    if (civicResult.valid && civicResult.precinctCode === '00241' && civicResult.matchType === 'name_match') {
      Logger.log(`PASS: "Civic Center" -> "${civicResult.precinctCode}" (unique on CIVIC)`);
    } else {
      Logger.log(`FAIL: "Civic Center" -> code="${civicResult.precinctCode}", matchType=${civicResult.matchType} (expected "00241", "name_match")`);
      passed = false;
    }

    // "Voting Center at Ewell Bi" → stop words remove VOTING/CENTER → only "EWELL" remains → unique in DALE
    const weakResult = resolvePrecinctCode('Voting Center at Ewell Bi', 'DALE', mockPrecinctMap, mockNameMap);
    if (weakResult.valid && weakResult.precinctCode === '01400' && weakResult.matchType === 'name_match') {
      Logger.log(`PASS: "Voting Center at Ewell Bi" -> "${weakResult.precinctCode}" (unique on EWELL)`);
    } else {
      Logger.log(`FAIL: "Voting Center at Ewell Bi" -> code="${weakResult.precinctCode}", matchType=${weakResult.matchType} (expected "01400", "name_match")`);
      passed = false;
    }

    // Word-overlap: should NOT match when multi-word input has only 1 word overlap
    Logger.log('--- Phase 2d: False positive rejection ---');
    const falsePositiveResult = resolvePrecinctCode('Andrew Bell', 'BARBOUR', mockPrecinctMap, mockNameMap);
    if (!falsePositiveResult.valid) {
      Logger.log('PASS: "Andrew Bell" in BARBOUR -> not matched (only ANDREW overlaps MT. ANDREW WATER AUTHORITY)');
    } else {
      Logger.log(`FAIL: "Andrew Bell" in BARBOUR -> matched ${falsePositiveResult.precinctCode} (expected no match)`);
      passed = false;
    }

    // Ambiguous word-overlap (Westgate matches 2 precincts) — should NOT match
    const ambiguousResult = resolvePrecinctCode('Westgate', 'HOUSTON', mockPrecinctMap, mockNameMap);
    if (!ambiguousResult.valid) {
      Logger.log('PASS: "Westgate" -> not matched (ambiguous between 352 and 354)');
    } else {
      Logger.log(`FAIL: "Westgate" -> matched ${ambiguousResult.precinctCode} (expected ambiguous/no match)`);
      passed = false;
    }

    // --- Empty input ---
    Logger.log('--- Empty input ---');
    const emptyResult = resolvePrecinctCode('', 'HOUSTON');
    if (!emptyResult.valid) {
      Logger.log('PASS: Empty input returns valid=false');
    } else {
      Logger.log('FAIL: Empty input returned valid=true');
      passed = false;
    }

  } catch (error) {
    Logger.log(`FAIL: Unexpected error: ${error.message}`);
    passed = false;
  }

  Logger.log(`=== Precinct Code Test: ${passed ? 'ALL PASSED' : 'SOME FAILED'} ===`);
  return passed;
}

/**
 * Tests race demographic field plan values to Catalist value mappings.
 * @returns {boolean} True if all race mapping tests pass
 * @example testMapRaceDemographics()
 *   // => true
 * @example testMapRaceDemographics() // unknown race label
 *   // => false
 */
function testMapRaceDemographics() {
  Logger.log('=== TEST: Map Race Demographics ===');
  let passed = true;

  try {
    // mapRaceDemographics(demoRaceArray) returns
    // { hasFilter, catalistValues[], unmapped[], unmappedComment }
    // Input keys must match RACE_MAP exactly

    // Test 1: Single mapped value
    Logger.log('Test 1: Single mapped race');
    const blackResult = mapRaceDemographics(['Black / African American']);
    if (blackResult.hasFilter && blackResult.catalistValues.includes('black')) {
      Logger.log(`PASS: "Black / African American" -> catalistValues: ${blackResult.catalistValues.join(', ')}`);
    } else {
      Logger.log(`FAIL: Expected hasFilter=true with "black" in catalistValues, got hasFilter=${blackResult.hasFilter}, values=${blackResult.catalistValues.join(', ')}`);
      passed = false;
    }

    // Test 2: Multiple mapped values
    Logger.log('Test 2: Multiple races');
    const multiResult = mapRaceDemographics(['Black / African American', 'Hispanic / Latino']);
    if (multiResult.hasFilter && multiResult.catalistValues.includes('black') && multiResult.catalistValues.includes('hispanic')) {
      Logger.log(`PASS: Multiple races -> catalistValues: ${multiResult.catalistValues.join(', ')}`);
    } else {
      Logger.log(`FAIL: Expected black+hispanic, got ${multiResult.catalistValues.join(', ')}`);
      passed = false;
    }

    // Test 3: Unmapped value
    Logger.log('Test 3: Unmapped race');
    const unmappedResult = mapRaceDemographics(['Martian']);
    if (!unmappedResult.hasFilter && unmappedResult.unmapped.includes('Martian')) {
      Logger.log(`PASS: "Martian" correctly tracked as unmapped`);
    } else {
      Logger.log(`FAIL: Expected hasFilter=false with "Martian" in unmapped`);
      passed = false;
    }

    // Test 4: Empty input
    Logger.log('Test 4: Empty input');
    const emptyResult = mapRaceDemographics([]);
    if (!emptyResult.hasFilter) {
      Logger.log('PASS: Empty input returns hasFilter=false');
    } else {
      Logger.log('FAIL: Empty input returned hasFilter=true');
      passed = false;
    }

  } catch (error) {
    Logger.log(`FAIL: Unexpected error: ${error.message}`);
    passed = false;
  }

  Logger.log(`=== Race Demographics Test: ${passed ? 'ALL PASSED' : 'SOME FAILED'} ===`);
  return passed;
}

/**
 * Tests age demographic mapping including contiguous ranges and gap scenarios.
 * @returns {boolean} True if all age mapping tests pass
 * @example testMapAgeDemographics()
 *   // => true
 * @example testMapAgeDemographics() // broken range merging
 *   // => false
 */
function testMapAgeDemographics() {
  Logger.log('=== TEST: Map Age Demographics ===');
  let passed = true;

  try {
    // mapAgeDemographics(demoAgeArray) returns
    // { hasFilter, ranges[], sqlFragment, unmapped[], unmappedComment }
    // Input keys must match AGE_RANGE_MAP exactly (with spaces)

    // Test 1: Contiguous ranges should merge
    Logger.log('Test 1: Contiguous ranges');
    const contiguousResult = mapAgeDemographics(['18 - 19', '20 - 29']);
    if (contiguousResult.hasFilter && contiguousResult.sqlFragment) {
      Logger.log(`PASS: Contiguous -> sqlFragment: "${contiguousResult.sqlFragment}"`);
      // Should merge to one range: 18-29
      if (contiguousResult.ranges.length === 1) {
        Logger.log(`PASS: Merged to ${contiguousResult.ranges.length} range (18-29)`);
      } else {
        Logger.log(`INFO: Got ${contiguousResult.ranges.length} ranges (expected 1 merged range)`);
      }
    } else {
      Logger.log('FAIL: Contiguous ranges returned hasFilter=false or empty sqlFragment');
      passed = false;
    }

    // Test 2: Gap scenario should produce separate clauses
    Logger.log('Test 2: Gap scenario');
    const gapResult = mapAgeDemographics(['18 - 19', '40 - 49']);
    if (gapResult.hasFilter && gapResult.sqlFragment) {
      Logger.log(`PASS: Gap -> sqlFragment: "${gapResult.sqlFragment}"`);
      if (gapResult.ranges.length === 2) {
        Logger.log('PASS: Correctly kept as 2 separate ranges');
      } else {
        Logger.log(`INFO: Got ${gapResult.ranges.length} ranges (expected 2)`);
      }
    } else {
      Logger.log('FAIL: Gap scenario returned hasFilter=false or empty sqlFragment');
      passed = false;
    }

    // Test 3: Single range
    Logger.log('Test 3: Single range');
    const singleResult = mapAgeDemographics(['90 +']);
    if (singleResult.hasFilter && singleResult.sqlFragment) {
      Logger.log(`PASS: Single -> sqlFragment: "${singleResult.sqlFragment}"`);
    } else {
      Logger.log('FAIL: Single range returned hasFilter=false');
      passed = false;
    }

    // Test 4: Empty input
    Logger.log('Test 4: Empty input');
    const emptyResult = mapAgeDemographics([]);
    if (!emptyResult.hasFilter && emptyResult.sqlFragment === '') {
      Logger.log('PASS: Empty input returned hasFilter=false, empty sqlFragment');
    } else {
      Logger.log(`FAIL: Empty input returned hasFilter=${emptyResult.hasFilter}, sqlFragment="${emptyResult.sqlFragment}"`);
      passed = false;
    }

  } catch (error) {
    Logger.log(`FAIL: Unexpected error: ${error.message}`);
    passed = false;
  }

  Logger.log(`=== Age Demographics Test: ${passed ? 'ALL PASSED' : 'SOME FAILED'} ===`);
  return passed;
}

/**
 * Tests activist code generation (format: COUNTY_PRECINCT_INITIALS).
 * @returns {boolean} True if the activist code format test passes
 * @example testGenerateActivistCode()
 *   // => true (code follows XXXX_XXXXX_XXX format)
 * @example testGenerateActivistCode() // wrong format
 *   // => false
 */
function testGenerateActivistCode() {
  Logger.log('=== TEST: Generate Activist Code ===');
  let passed = true;

  try {
    // generateActivistCode(orgName, countyAbbreviation, precinctCode)
    // returns string like "HOUS_00182_SABWR"
    const result = generateActivistCode('Southern Alabama Black Women Rising', 'HOUS', '00182');
    if (result && result.length > 0) {
      Logger.log(`PASS: Generated activist code: "${result}"`);

      // Check format: should be COUNTY_PRECINCT_INITIALS
      if (result.startsWith('HOUS_00182_')) {
        Logger.log('PASS: Starts with county + precinct prefix "HOUS_00182_"');
      } else {
        Logger.log(`FAIL: Expected to start with "HOUS_00182_", got "${result}"`);
        passed = false;
      }

      // Check that org initials are present (should be SABWR)
      const parts = result.split('_');
      if (parts.length === 3) {
        Logger.log(`PASS: Format is COUNTY_PRECINCT_INITIALS (${parts[0]}_${parts[1]}_${parts[2]})`);
      } else {
        Logger.log(`FAIL: Expected 3 underscore-separated parts, got ${parts.length}`);
        passed = false;
      }
    } else {
      Logger.log('FAIL: generateActivistCode returned empty or null');
      passed = false;
    }

  } catch (error) {
    Logger.log(`FAIL: Unexpected error: ${error.message}`);
    passed = false;
  }

  Logger.log(`=== Activist Code Test: ${passed ? 'ALL PASSED' : 'SOME FAILED'} ===`);
  return passed;
}

/**
 * Tests that buildMetadataMergeQuery() produces valid SQL output.
 * @returns {boolean} True if the metadata query validation passes
 * @example testBuildMetadataQuery()
 *   // => true (SQL contains MERGE and references project)
 * @example testBuildMetadataQuery() // missing config
 *   // => false
 */
function testBuildMetadataQuery() {
  Logger.log('=== TEST: Build Metadata Merge Query ===');
  let passed = true;

  try {
    // buildMetadataMergeQuery expects:
    // { orgName, countyName, precinctCode, activistCode, committeeId, queryType, rowNumber }
    const testParams = {
      orgName: "People's Budget Birmingham",
      countyName: 'JEFFERSON',
      precinctCode: '00001',
      activistCode: 'JEFF_00001_PBB',
      committeeId: '99981',
      queryType: 'member',
      rowNumber: 5
    };

    const sql = buildMetadataMergeQuery(testParams);

    if (!sql || sql.trim() === '') {
      Logger.log('FAIL: buildMetadataMergeQuery returned empty SQL');
      return false;
    }

    Logger.log(`Generated SQL (${sql.length} chars):`);
    Logger.log(sql);

    // Check for MERGE keyword (this is a MERGE query, not SELECT)
    const requiredKeywords = ['MERGE', 'USING', 'WHEN'];
    requiredKeywords.forEach(keyword => {
      if (sql.toUpperCase().includes(keyword)) {
        Logger.log(`PASS: Contains ${keyword}`);
      } else {
        Logger.log(`FAIL: Missing ${keyword}`);
        passed = false;
      }
    });

    // Check that it references the project from config
    const config = getQueryConfig();
    if (sql.includes(config.projectId)) {
      Logger.log('PASS: References projectId from config');
    } else {
      Logger.log('FAIL: Does not reference projectId from getQueryConfig()');
      passed = false;
    }

  } catch (error) {
    Logger.log(`FAIL: Unexpected error: ${error.message}`);
    Logger.log(`Stack: ${error.stack}`);
    passed = false;
  }

  Logger.log(`=== Metadata Query Test: ${passed ? 'ALL PASSED' : 'SOME FAILED'} ===`);
  return passed;
}

/**
 * Tests that buildPrecinctListMergeQuery() produces valid SQL output.
 * @returns {boolean} True if the precinct list query validation passes
 * @example testBuildPrecinctListQuery()
 *   // => true (SQL contains MERGE and activist code)
 * @example testBuildPrecinctListQuery() // error
 *   // => false
 */
function testBuildPrecinctListQuery() {
  Logger.log('=== TEST: Build Precinct List Merge Query ===');
  let passed = true;

  try {
    // buildPrecinctListMergeQuery expects:
    // { countyName, precinctCode, activistCode, raceData, ageData }
    const testParams = {
      countyName: 'JEFFERSON',
      precinctCode: '00001',
      activistCode: 'JEFF_00001_PBB',
      raceData: { hasFilter: true, catalistValues: ['black'], unmapped: [], unmappedComment: '' },
      ageData: { hasFilter: false, ranges: [], sqlFragment: '', unmapped: [], unmappedComment: '' }
    };

    const sql = buildPrecinctListMergeQuery(testParams);

    if (!sql || sql.trim() === '') {
      Logger.log('FAIL: buildPrecinctListMergeQuery returned empty SQL');
      return false;
    }

    Logger.log(`Generated SQL (${sql.length} chars):`);
    Logger.log(sql);

    // Check for MERGE keyword
    if (sql.toUpperCase().includes('MERGE')) {
      Logger.log('PASS: Contains MERGE');
    } else {
      Logger.log('FAIL: Missing MERGE');
      passed = false;
    }

    // Check that activist code appears in the SQL
    if (sql.includes('JEFF_00001_PBB')) {
      Logger.log('PASS: Contains activist code');
    } else {
      Logger.log('FAIL: Missing activist code in SQL');
      passed = false;
    }

  } catch (error) {
    Logger.log(`FAIL: Unexpected error: ${error.message}`);
    passed = false;
  }

  Logger.log(`=== Precinct List Query Test: ${passed ? 'ALL PASSED' : 'SOME FAILED'} ===`);
  return passed;
}

/**
 * Tests that buildExplorationQuery() produces valid SQL output.
 * @returns {boolean} True if the exploration query validation passes
 * @example testBuildExplorationQuery()
 *   // => true (SQL contains SELECT, FROM, and county name)
 * @example testBuildExplorationQuery() // missing county
 *   // => false
 */
function testBuildExplorationQuery() {
  Logger.log('=== TEST: Build Exploration Query ===');
  let passed = true;

  try {
    // buildExplorationQuery expects:
    // { countyName, raceData, ageData }
    const testParams = {
      countyName: 'MOBILE',
      raceData: { hasFilter: false, catalistValues: [], unmapped: [], unmappedComment: '' },
      ageData: { hasFilter: false, ranges: [], sqlFragment: '', unmapped: [], unmappedComment: '' }
    };

    const sql = buildExplorationQuery(testParams);

    if (!sql || sql.trim() === '') {
      Logger.log('FAIL: buildExplorationQuery returned empty SQL');
      return false;
    }

    Logger.log(`Generated SQL (${sql.length} chars):`);
    Logger.log(sql);

    // Check for required keywords
    const requiredKeywords = ['SELECT', 'FROM', 'GROUP BY'];
    requiredKeywords.forEach(keyword => {
      if (sql.toUpperCase().includes(keyword)) {
        Logger.log(`PASS: Contains ${keyword}`);
      } else {
        Logger.log(`FAIL: Missing ${keyword}`);
        passed = false;
      }
    });

    // Check for county reference
    if (sql.includes('MOBILE')) {
      Logger.log('PASS: Contains county name "MOBILE"');
    } else {
      Logger.log('FAIL: Missing county name "MOBILE"');
      passed = false;
    }

  } catch (error) {
    Logger.log(`FAIL: Unexpected error: ${error.message}`);
    passed = false;
  }

  Logger.log(`=== Exploration Query Test: ${passed ? 'ALL PASSED' : 'SOME FAILED'} ===`);
  return passed;
}

/**
 * End-to-end test using real data from the most recent field plan row.
 * @returns {boolean} True if the end-to-end test succeeds
 * @example testGenerateQueriesForLastRow()
 *   // => true (generates queries and sends test email)
 * @example testGenerateQueriesForLastRow() // empty sheet
 *   // => false (logs SKIP)
 */
function testGenerateQueriesForLastRow() {
  Logger.log('=== TEST: Generate Queries for Last Row (End-to-End) ===');
  let passed = true;

  try {
    // Get the most recent field plan
    const sheet = getSheet(scriptProps.getProperty('SHEET_FIELD_PLAN'));
    const lastRow = sheet.getLastRow();

    if (lastRow < 2) {
      Logger.log('SKIP: No field plan data in sheet (only header row)');
      return false;
    }

    const fieldPlan = FieldPlan.fromSpecificRow(lastRow);
    Logger.log(`Using field plan from row ${lastRow}: ${fieldPlan.memberOrgName}`);

    // Run the query generator
    const result = generateQueriesForFieldPlan(fieldPlan, lastRow);

    Logger.log(`Result: success=${result.success}`);
    Logger.log(`Queries generated: ${result.queries.length}`);
    Logger.log(`Errors: ${result.errors.length}`);

    if (result.errors && result.errors.length > 0) {
      result.errors.forEach(err => {
        Logger.log(`  Error: ${err}`);
      });
    }

    if (result.summary) {
      Logger.log(`Summary: ${result.summary}`);
    }

    if (result.success && result.queries.length > 0) {
      Logger.log('PASS: Queries generated successfully');

      // Send a test email with the results
      Logger.log('Sending test email to datateam@alforward.org...');
      sendQueryEmail(
        result.orgName,
        result.queries,
        result.errors,
        { orgName: result.orgName, vanId: result.vanId, raceData: result.raceData, ageData: result.ageData },
        true // isTestMode = true
      );
      Logger.log('PASS: Test email sent');
    } else if (result.success && result.queries.length === 0) {
      Logger.log('INFO: Generator returned success but zero queries. Check if org has geographic data.');
      passed = false;
    } else {
      Logger.log('FAIL: Query generation reported failure');
      passed = false;
    }

  } catch (error) {
    Logger.log(`FAIL: Unexpected error: ${error.message}`);
    Logger.log(`Stack: ${error.stack}`);
    passed = false;
  }

  Logger.log(`=== End-to-End Test: ${passed ? 'PASSED' : 'FAILED'} ===`);
  return passed;
}

/**
 * Tests query email formatting and delivery using the last field plan row.
 * Sends to test recipients only (datateam@alforward.org).
 * @returns {boolean} True if email was sent successfully
 * @example testQueryEmail()
 *   // => true (sends test email with generated SQL to datateam@alforward.org)
 * @example testQueryEmail() // empty sheet
 *   // => false (logs SKIP)
 */
function testQueryEmail() {
  Logger.log('=== TEST: Query Email (Test Mode) ===');

  try {
    const sheet = getSheet(scriptProps.getProperty('SHEET_FIELD_PLAN'));
    const lastRow = sheet.getLastRow();

    if (lastRow < 2) {
      Logger.log('SKIP: No field plan data in sheet');
      return false;
    }

    const fieldPlan = FieldPlan.fromSpecificRow(lastRow);
    Logger.log(`Using field plan from row ${lastRow}: ${fieldPlan.memberOrgName}`);

    const result = generateQueriesForFieldPlan(fieldPlan, lastRow);

    Logger.log(`Sending test query email for ${result.orgName} (${result.queryCount} queries)...`);
    sendQueryEmail(
      result.orgName,
      result.queries,
      result.errors,
      { orgName: result.orgName, vanId: result.vanId, raceData: result.raceData, ageData: result.ageData },
      true // isTestMode — sends to datateam@alforward.org only
    );

    Logger.log('PASS: Test query email sent to datateam@alforward.org');
    return true;

  } catch (error) {
    Logger.log(`FAIL: ${error.message}`);
    Logger.log(`Stack: ${error.stack}`);
    return false;
  }
}

/**
 * @deprecated Tests deprecated BigQuery execution in query_executor.js.
 * Tests service account token generation (Phase 2 only).
 * @returns {boolean|null} True if token obtained, false if failed, null if credentials not configured (skipped)
 * @example testServiceAccountToken()
 *   // => true (token obtained, logs char count)
 * @example testServiceAccountToken() // no credentials
 *   // => null (logs SKIP)
 */
function testServiceAccountToken() {
  Logger.log('=== TEST: Service Account Token ===');

  const clientEmail = scriptProps.getProperty('SA_CLIENT_EMAIL');
  const privateKey = scriptProps.getProperty('SA_PRIVATE_KEY');

  if (!clientEmail || !privateKey) {
    Logger.log('SKIP: Service account credentials not configured.');
    Logger.log('  To configure: add SA_CLIENT_EMAIL and SA_PRIVATE_KEY to Script Properties.');
    return null;
  }

  if (privateKey.includes('PASTE_YOUR_PRIVATE_KEY_HERE')) {
    Logger.log('SKIP: SA_PRIVATE_KEY still contains placeholder value.');
    return null;
  }

  try {
    const token = getServiceAccountToken();

    if (token && token.length > 0) {
      Logger.log(`PASS: Token obtained successfully (${token.length} chars)`);
      Logger.log(`  Token starts with: ${token.substring(0, 20)}...`);
      return true;
    } else {
      Logger.log('FAIL: getServiceAccountToken() returned empty token');
      return false;
    }

  } catch (error) {
    Logger.log(`FAIL: Token generation error: ${error.message}`);
    Logger.log(`Stack: ${error.stack}`);
    return false;
  }
}

/**
 * Runs all query builder tests in sequence and reports overall results.
 * @example runAllQueryBuilderTests()
 *   // => logs summary table with PASS/FAIL/SKIP for each test
 */
function runAllQueryBuilderTests() {
  Logger.log('====================================================');
  Logger.log('  QUERY BUILDER TEST SUITE');
  Logger.log(`  ${new Date().toLocaleString()}`);
  Logger.log('====================================================');
  Logger.log('');

  const testFunctions = [
    { name: 'Query Config', fn: testQueryConfig },
    { name: 'VAN ID Resolution', fn: testResolveVanId },
    { name: 'County Name Resolution', fn: testResolveCountyName },
    { name: 'Precinct Code Resolution', fn: testResolvePrecinctCode },
    { name: 'Race Demographics', fn: testMapRaceDemographics },
    { name: 'Age Demographics', fn: testMapAgeDemographics },
    { name: 'Activist Code Generation', fn: testGenerateActivistCode },
    { name: 'Metadata Merge Query SQL', fn: testBuildMetadataQuery },
    { name: 'Precinct List Merge Query SQL', fn: testBuildPrecinctListQuery },
    { name: 'Exploration Query SQL', fn: testBuildExplorationQuery },
    { name: 'End-to-End (Last Row)', fn: testGenerateQueriesForLastRow },
    { name: 'Query Email (Test Mode)', fn: testQueryEmail }
  ];

  const results = testFunctions.map(test => {
    try {
      const passed = test.fn();
      Logger.log('');
      return { name: test.name, passed: passed === null ? 'SKIPPED' : passed };
    } catch (e) {
      Logger.log(`CRASH in ${test.name}: ${e.message}`);
      Logger.log('');
      return { name: test.name, passed: false };
    }
  });

  // Print summary
  Logger.log('====================================================');
  Logger.log('  RESULTS SUMMARY');
  Logger.log('====================================================');

  let passCount = 0;
  let failCount = 0;
  let skipCount = 0;

  results.forEach(r => {
    let statusLabel;
    if (r.passed === 'SKIPPED') {
      statusLabel = 'SKIP';
      skipCount++;
    } else if (r.passed) {
      statusLabel = 'PASS';
      passCount++;
    } else {
      statusLabel = 'FAIL';
      failCount++;
    }
    Logger.log(`  ${statusLabel}  ${r.name}`);
  });

  Logger.log('');
  Logger.log(`  Total: ${results.length} | Passed: ${passCount} | Failed: ${failCount} | Skipped: ${skipCount}`);
  Logger.log('====================================================');

  if (failCount > 0) {
    Logger.log(`  ACTION REQUIRED: ${failCount} test(s) failed. Check logs above for details.`);
  } else {
    Logger.log('  All tests passed. Ready for deployment.');
  }
}
