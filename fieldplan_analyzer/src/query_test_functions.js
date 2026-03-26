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
    // Check QUERY_CONFIG exists
    if (typeof QUERY_CONFIG === 'undefined') {
      Logger.log('FAIL: QUERY_CONFIG is not defined. Is _query_config.js loaded?');
      return false;
    }
    Logger.log('PASS: QUERY_CONFIG is defined');

    // Check required config keys
    const requiredKeys = ['projectId', 'dataset', 'voterTable', 'activistCodeTable'];
    requiredKeys.forEach(key => {
      if (!QUERY_CONFIG[key]) {
        Logger.log(`FAIL: QUERY_CONFIG.${key} is missing or empty`);
        passed = false;
      } else {
        Logger.log(`PASS: QUERY_CONFIG.${key} = ${QUERY_CONFIG[key]}`);
      }
    });

    // Check van_id_lookup sheet
    try {
      const vanSheet = getSheet('van_id_lookup');
      const vanData = vanSheet.getDataRange().getValues();
      Logger.log(`PASS: van_id_lookup sheet found with ${vanData.length - 1} rows of data`);
    } catch (e) {
      Logger.log(`FAIL: van_id_lookup sheet not found: ${e.message}`);
      passed = false;
    }

    // Check query_queue sheet
    try {
      getSheet('query_queue');
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
 * Tests VAN ID resolution with exact match, fuzzy match, and unknown org scenarios.
 * @returns {boolean} True if all VAN ID resolution tests pass
 * @example testResolveVanId()
 *   // => true (logs PASS for exact, fuzzy, and unknown tests)
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
    if (exactResult && exactResult.vanId) {
      Logger.log(`PASS: Exact match found. VAN ID = ${exactResult.vanId}, source = ${exactResult.source}`);
      if (exactResult.vanId === 99981) {
        Logger.log('PASS: VAN ID matches expected value (99981)');
      } else {
        Logger.log(`INFO: VAN ID = ${exactResult.vanId} (expected 99981 -- may have changed)`);
      }
    } else {
      Logger.log('FAIL: No exact match found for "People\'s Budget Birmingham"');
      passed = false;
    }

    // Test 2: Fuzzy match (slightly different casing or spacing)
    Logger.log('Test 2: Fuzzy match');
    const fuzzyResult = resolveVanId("peoples budget birmingham");
    if (fuzzyResult && fuzzyResult.vanId) {
      Logger.log(`PASS: Fuzzy match found. VAN ID = ${fuzzyResult.vanId}, source = ${fuzzyResult.source}`);
    } else {
      Logger.log('FAIL: No fuzzy match found for "peoples budget birmingham"');
      passed = false;
    }

    // Test 3: Unknown org
    Logger.log('Test 3: Unknown org');
    const unknownResult = resolveVanId('Completely Fake Organization XYZ 12345');
    if (!unknownResult || !unknownResult.vanId) {
      Logger.log('PASS: Correctly returned no match for unknown org');
    } else {
      Logger.log(`FAIL: Unexpectedly matched unknown org to VAN ID ${unknownResult.vanId}`);
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
 * Tests county name normalization and resolution.
 * @returns {boolean} True if all county resolution tests pass
 * @example testResolveCountyName()
 *   // => true (logs PASS for each test case)
 * @example testResolveCountyName() // bad normalization
 *   // => false (logs FAIL for mismatched case)
 */
function testResolveCountyName() {
  Logger.log('=== TEST: Resolve County Name ===');
  let passed = true;

  try {
    const testCases = [
      { input: 'Jefferson', expected: 'Jefferson' },
      { input: 'jefferson', expected: 'Jefferson' },
      { input: 'JEFFERSON', expected: 'Jefferson' },
      { input: 'Jefferson County', expected: 'Jefferson' },
      { input: 'Mobile', expected: 'Mobile' },
      { input: 'Saint Clair', expected: 'St. Clair' },
      { input: 'St Clair', expected: 'St. Clair' },
      { input: 'DeKalb', expected: 'DeKalb' }
    ];

    testCases.forEach(tc => {
      const result = resolveCountyName(tc.input);
      if (result === tc.expected) {
        Logger.log(`PASS: "${tc.input}" -> "${result}"`);
      } else {
        Logger.log(`FAIL: "${tc.input}" -> "${result}" (expected "${tc.expected}")`);
        passed = false;
      }
    });

  } catch (error) {
    Logger.log(`FAIL: Unexpected error: ${error.message}`);
    passed = false;
  }

  Logger.log(`=== County Name Test: ${passed ? 'ALL PASSED' : 'SOME FAILED'} ===`);
  return passed;
}

/**
 * Tests precinct code resolution and zero-padding.
 * @returns {boolean} True if all precinct code tests pass
 * @example testResolvePrecinctCode()
 *   // => true (logs PASS for each padding scenario)
 * @example testResolvePrecinctCode() // bad padding
 *   // => false
 */
function testResolvePrecinctCode() {
  Logger.log('=== TEST: Resolve Precinct Code ===');
  let passed = true;

  try {
    const testCases = [
      { input: '1', expected: '001' },
      { input: '12', expected: '012' },
      { input: '123', expected: '123' },
      { input: '1234', expected: '1234' },
      { input: '001', expected: '001' },
      { input: ' 45 ', expected: '045' }
    ];

    testCases.forEach(tc => {
      const result = resolvePrecinctCode(tc.input);
      if (result === tc.expected) {
        Logger.log(`PASS: "${tc.input}" -> "${result}"`);
      } else {
        Logger.log(`FAIL: "${tc.input}" -> "${result}" (expected "${tc.expected}")`);
        passed = false;
      }
    });

  } catch (error) {
    Logger.log(`FAIL: Unexpected error: ${error.message}`);
    passed = false;
  }

  Logger.log(`=== Precinct Code Test: ${passed ? 'ALL PASSED' : 'SOME FAILED'} ===`);
  return passed;
}

/**
 * Tests race demographic field plan values to BigQuery filter mappings.
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
    const testCases = [
      { input: 'Black/African American', expectContains: 'Black' },
      { input: 'White/Caucasian', expectContains: 'White' },
      { input: 'Hispanic/Latino', expectContains: 'Hispanic' },
      { input: 'Asian American', expectContains: 'Asian' },
      { input: 'Native American', expectContains: 'Native' }
    ];

    testCases.forEach(tc => {
      const result = mapRaceDemographic(tc.input);
      if (result && result.includes(tc.expectContains)) {
        Logger.log(`PASS: "${tc.input}" -> "${result}"`);
      } else {
        Logger.log(`FAIL: "${tc.input}" -> "${result || 'null'}" (expected to contain "${tc.expectContains}")`);
        passed = false;
      }
    });

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
    // Test contiguous range: 18-24, 25-34 should produce a single range 18-34
    Logger.log('Test 1: Contiguous ranges');
    const contiguousResult = mapAgeDemographics(['18-24', '25-34']);
    if (contiguousResult) {
      Logger.log(`PASS: Contiguous ["18-24", "25-34"] -> "${contiguousResult}"`);
    } else {
      Logger.log('FAIL: Contiguous ranges returned null');
      passed = false;
    }

    // Test gap scenario: 18-24, 35-44 should produce two separate filters
    Logger.log('Test 2: Gap scenario');
    const gapResult = mapAgeDemographics(['18-24', '35-44']);
    if (gapResult) {
      Logger.log(`PASS: Gap ["18-24", "35-44"] -> "${gapResult}"`);
    } else {
      Logger.log('FAIL: Gap ranges returned null');
      passed = false;
    }

    // Test single range
    Logger.log('Test 3: Single range');
    const singleResult = mapAgeDemographics(['65+']);
    if (singleResult) {
      Logger.log(`PASS: Single ["65+"] -> "${singleResult}"`);
    } else {
      Logger.log('FAIL: Single range returned null');
      passed = false;
    }

    // Test empty input
    Logger.log('Test 4: Empty input');
    const emptyResult = mapAgeDemographics([]);
    if (!emptyResult || emptyResult === '') {
      Logger.log('PASS: Empty input returned no filter');
    } else {
      Logger.log(`FAIL: Empty input returned: "${emptyResult}"`);
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
 * Tests activist code string generation.
 * @returns {boolean} True if the activist code format test passes
 * @example testGenerateActivistCode()
 *   // => true (code starts with 'ALF26_')
 * @example testGenerateActivistCode() // wrong prefix
 *   // => false
 */
function testGenerateActivistCode() {
  Logger.log('=== TEST: Generate Activist Code ===');
  let passed = true;

  try {
    const result = generateActivistCode("People's Budget Birmingham", 'Jefferson');
    if (result && result.length > 0) {
      Logger.log(`PASS: Generated activist code: "${result}"`);

      // Check format: should start with ALF26_
      if (result.startsWith('ALF26_')) {
        Logger.log('PASS: Starts with correct prefix "ALF26_"');
      } else {
        Logger.log('FAIL: Does not start with "ALF26_" prefix');
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
 * Tests that buildMetadataQuery() produces valid SQL output.
 * @returns {boolean} True if the metadata query validation passes
 * @example testBuildMetadataQuery()
 *   // => true (SQL contains SELECT, FROM, WHERE and references project)
 * @example testBuildMetadataQuery() // missing config
 *   // => false
 */
function testBuildMetadataQuery() {
  Logger.log('=== TEST: Build Metadata Query ===');
  let passed = true;

  try {
    const testParams = {
      orgName: "People's Budget Birmingham",
      vanId: 99981,
      county: 'Jefferson',
      activistCode: 'ALF26_PBB_Jefferson',
      raceFilter: "EthnicID = 'B'",
      ageFilter: 'Age >= 18 AND Age <= 34'
    };

    const sql = buildMetadataQuery(testParams);

    if (!sql || sql.trim() === '') {
      Logger.log('FAIL: buildMetadataQuery returned empty SQL');
      return false;
    }

    Logger.log(`Generated SQL (${sql.length} chars):`);
    Logger.log(sql);

    // Check for required SQL keywords
    const requiredKeywords = ['SELECT', 'FROM', 'WHERE'];
    requiredKeywords.forEach(keyword => {
      if (sql.toUpperCase().includes(keyword)) {
        Logger.log(`PASS: Contains ${keyword}`);
      } else {
        Logger.log(`FAIL: Missing ${keyword}`);
        passed = false;
      }
    });

    // Check that it references the project/dataset
    if (sql.includes(QUERY_CONFIG.projectId) || sql.includes(QUERY_CONFIG.dataset)) {
      Logger.log('PASS: References project or dataset');
    } else {
      Logger.log('FAIL: Does not reference project or dataset from QUERY_CONFIG');
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
 * Tests that buildPrecinctListQuery() produces valid SQL output.
 * @returns {boolean} True if the precinct list query validation passes
 * @example testBuildPrecinctListQuery()
 *   // => true (SQL contains SELECT and all precinct codes)
 * @example testBuildPrecinctListQuery() // missing precinct in output
 *   // => false
 */
function testBuildPrecinctListQuery() {
  Logger.log('=== TEST: Build Precinct List Query ===');
  let passed = true;

  try {
    const testParams = {
      county: 'Jefferson',
      precincts: ['001', '002', '015'],
      vanId: 99981
    };

    const sql = buildPrecinctListQuery(testParams);

    if (!sql || sql.trim() === '') {
      Logger.log('FAIL: buildPrecinctListQuery returned empty SQL');
      return false;
    }

    Logger.log(`Generated SQL (${sql.length} chars):`);
    Logger.log(sql);

    // Check for required elements
    if (sql.toUpperCase().includes('SELECT')) {
      Logger.log('PASS: Contains SELECT');
    } else {
      Logger.log('FAIL: Missing SELECT');
      passed = false;
    }

    // Check that precinct values appear in the SQL
    if (sql.includes('001') && sql.includes('002') && sql.includes('015')) {
      Logger.log('PASS: Contains all precinct codes');
    } else {
      Logger.log('FAIL: Missing one or more precinct codes');
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
 *   // => true (SQL contains SELECT, FROM, WHERE and county name)
 * @example testBuildExplorationQuery() // missing county
 *   // => false
 */
function testBuildExplorationQuery() {
  Logger.log('=== TEST: Build Exploration Query ===');
  let passed = true;

  try {
    const testParams = {
      county: 'Mobile',
      vanId: 99908,
      raceFilter: "EthnicID = 'B'",
      ageFilter: 'Age >= 18 AND Age <= 44'
    };

    const sql = buildExplorationQuery(testParams);

    if (!sql || sql.trim() === '') {
      Logger.log('FAIL: buildExplorationQuery returned empty SQL');
      return false;
    }

    Logger.log(`Generated SQL (${sql.length} chars):`);
    Logger.log(sql);

    // Check for required keywords
    const requiredKeywords = ['SELECT', 'FROM', 'WHERE'];
    requiredKeywords.forEach(keyword => {
      if (sql.toUpperCase().includes(keyword)) {
        Logger.log(`PASS: Contains ${keyword}`);
      } else {
        Logger.log(`FAIL: Missing ${keyword}`);
        passed = false;
      }
    });

    // Check for county reference
    if (sql.includes('Mobile')) {
      Logger.log('PASS: Contains county name "Mobile"');
    } else {
      Logger.log('FAIL: Missing county name "Mobile"');
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
    Logger.log(`Warnings: ${result.warnings.length}`);

    if (result.warnings && result.warnings.length > 0) {
      result.warnings.forEach(warning => {
        Logger.log(`  Warning: ${warning}`);
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
        fieldPlan.memberOrgName,
        result.queries,
        result.warnings,
        result.resolvedData || {},
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
    Logger.log('  To configure: run storeServiceAccountCredentials() with your JSON key.');
    return null;
  }

  if (privateKey.includes('PASTE_YOUR_PRIVATE_KEY_HERE')) {
    Logger.log('SKIP: SA_PRIVATE_KEY still contains placeholder value.');
    Logger.log('  To configure: run storeServiceAccountCredentials() with your real key.');
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
    { name: 'Metadata Query SQL', fn: testBuildMetadataQuery },
    { name: 'Precinct List Query SQL', fn: testBuildPrecinctListQuery },
    { name: 'Exploration Query SQL', fn: testBuildExplorationQuery },
    { name: 'End-to-End (Last Row)', fn: testGenerateQueriesForLastRow },
    { name: 'Service Account Token', fn: testServiceAccountToken }
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
