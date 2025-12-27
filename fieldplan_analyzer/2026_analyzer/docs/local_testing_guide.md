# Local Testing Guide for Field Plan Analyzer

This guide will help you set up a complete local testing environment where you can:
- ✅ Automatically download Google Sheets data to your VS Code project
- ✅ Run tests locally without affecting production data
- ✅ Test email functionality without sending real emails
- ✅ Debug your code with console logs and breakpoints

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Creating a Google Service Account](#creating-a-google-service-account)
3. [Setting Up Your Environment](#setting-up-your-environment)
4. [Installing Dependencies](#installing-dependencies)
5. [Creating the Data Download Script](#creating-the-data-download-script)
6. [Setting Up Mock Objects](#setting-up-mock-objects)
7. [Writing Tests](#writing-tests)
8. [Running Tests](#running-tests)
9. [Testing Email Functions](#testing-email-functions)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### What You Need Installed

1. **Node.js** (version 16 or higher)
   ```bash
   # Check if you have Node.js installed
   node --version

   # If not installed, download from: https://nodejs.org/
   # Choose the LTS (Long Term Support) version
   ```

2. **VS Code** (you already have this)

3. **Terminal/Command Line Access**
   - On Mac: Use the built-in Terminal app
   - You can open it in VS Code: View → Terminal

---

## Creating a Google Service Account

A service account allows your local scripts to access Google Sheets without manual login.

### Step 1: Access Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Sign in with your Google account (use the same account that owns the spreadsheet)

### Step 2: Create or Select a Project

1. Click the project dropdown at the top (or "Select a project")
2. Click **"NEW PROJECT"**
3. Name it: `field-plan-analyzer-local`
4. Click **"CREATE"**
5. Wait for the project to be created (~30 seconds)
6. Make sure the new project is selected in the dropdown

### Step 3: Enable Google Sheets API

1. In the left sidebar, click **"APIs & Services"** → **"Library"**
2. Search for: `Google Sheets API`
3. Click on **"Google Sheets API"**
4. Click the blue **"ENABLE"** button
5. Wait for it to enable (~10 seconds)

### Step 4: Create Service Account

1. In the left sidebar, click **"APIs & Services"** → **"Credentials"**
2. Click the blue **"+ CREATE CREDENTIALS"** button at the top
3. Select **"Service account"**
4. Fill in the form:
   - **Service account name:** `local-testing-account`
   - **Service account ID:** (auto-filled, leave as is)
   - **Description:** `For local testing and automated data downloads`
5. Click **"CREATE AND CONTINUE"**
6. For "Grant this service account access to project":
   - Skip this (click **"CONTINUE"**)
7. For "Grant users access to this service account":
   - Skip this (click **"DONE"**)

### Step 5: Download Service Account Key

1. You should now see your service account in the list
2. Click on the service account email (looks like: `local-testing-account@field-plan-analyzer-local.iam.gserviceaccount.com`)
3. Click the **"KEYS"** tab at the top
4. Click **"ADD KEY"** → **"Create new key"**
5. Choose **JSON** format
6. Click **"CREATE"**
7. A JSON file will download to your computer
8. **IMPORTANT:** This file contains sensitive credentials - never share it or commit it to git!

### Step 6: Share Your Google Sheet with the Service Account

1. Open the downloaded JSON file in a text editor
2. Find the `client_email` field (looks like: `local-testing-account@....iam.gserviceaccount.com`)
3. **Copy this email address**
4. Open your Google Sheet (the 2026 Field Plan sheet)
5. Click the **Share** button (top right)
6. Paste the service account email
7. Change permission to **"Viewer"** (we only need read access)
8. **Uncheck** "Notify people" (it's a service account, not a person)
9. Click **"Share"**

### Step 7: Get Your Spreadsheet ID

1. Open your Google Sheet
2. Look at the URL in your browser:
   ```
   https://docs.google.com/spreadsheets/d/1a2b3c4d5e6f7g8h9i0j/edit
                                          ^^^^^^^^^^^^^^^^^^^^
                                          This is your Spreadsheet ID
   ```
3. Copy the long string between `/d/` and `/edit`
4. Save this - you'll need it in the next section

---

## Setting Up Your Environment

### Step 1: Organize Your Project

Open Terminal in VS Code (View → Terminal) and run:

```bash
# Navigate to your project directory
cd /Users/richardscc1/alf_dev/appsscript/fieldplan_analyzer/2026_analyzer

# Create directories for local testing
mkdir -p .auth
mkdir -p scripts
mkdir -p test_data
mkdir -p tests
mkdir -p src/mocks

# Move your downloaded service account JSON file
# Replace 'Downloads' with wherever your file downloaded
mv ~/Downloads/field-plan-analyzer-local-*.json .auth/service-account.json
```

### Step 2: Create .gitignore

Prevent sensitive files from being committed to git:

```bash
# Create or update .gitignore
cat >> .gitignore << 'EOL'

# Local testing files
.auth/
service-account.json
credentials.json
token.json

# Test data
test_data/*.json
test_data/*.csv

# Node modules
node_modules/
package-lock.json

# Environment variables
.env
.env.local

# OS files
.DS_Store
EOL
```

### Step 3: Create Configuration File

Create a file to store your configuration:

**config.js:**
```javascript
/**
 * Configuration for local testing
 *
 * IMPORTANT: Never commit sensitive IDs to git!
 * For production, use environment variables.
 */

module.exports = {
  // Your Google Sheet ID (from the URL)
  SPREADSHEET_ID: '1a2b3c4d5e6f7g8h9i0j',  // REPLACE THIS with your actual ID

  // Sheet names
  SHEETS: {
    FIELD_PLAN_2026: '2026_field_plan',
    FIELD_BUDGET_2026: '2026_field_budget'
  },

  // Paths
  PATHS: {
    SERVICE_ACCOUNT: './.auth/service-account.json',
    TEST_DATA_DIR: './test_data',
    TEMP_DIR: './temp'
  },

  // Testing options
  TESTING: {
    DOWNLOAD_ON_TEST: true,      // Auto-download data before tests
    USE_CACHED_DATA: false,      // Use existing data if available
    SAMPLE_ROWS_ONLY: true,      // Only download sample rows (faster)
    SAMPLE_ROW_COUNT: 10,        // Number of sample rows
    MOCK_EMAILS: true            // Don't actually send emails in tests
  },

  // Email settings for tests
  EMAIL: {
    TEST_RECIPIENT: 'datateam@alforward.org',
    FROM_NAME: 'Alabama Forward Data Team'
  }
};
```

**⚠️ IMPORTANT:** Replace `'1a2b3c4d5e6f7g8h9i0j'` with your actual Spreadsheet ID!

---

## Installing Dependencies

### Step 1: Initialize NPM

```bash
# Initialize package.json (press Enter for all prompts)
npm init -y
```

### Step 2: Install Required Packages

```bash
# Install Google APIs
npm install googleapis

# Install testing framework (optional but recommended)
npm install --save-dev mocha chai

# Install utilities
npm install dotenv
```

### Step 3: Update package.json Scripts

Open `package.json` and replace the "scripts" section:

```json
{
  "name": "field-plan-analyzer-2026",
  "version": "1.0.0",
  "description": "Local testing environment for 2026 Field Plan Analyzer",
  "scripts": {
    "download": "node scripts/download_sheet_data.js",
    "download:full": "node scripts/download_sheet_data.js --full",
    "download:sample": "node scripts/download_sheet_data.js --sample",
    "test": "npm run download:sample && node tests/run_all_tests.js",
    "test:no-download": "node tests/run_all_tests.js",
    "test:single": "node tests/test_field_plan.js"
  },
  "dependencies": {
    "dotenv": "^16.3.1",
    "googleapis": "^128.0.0"
  },
  "devDependencies": {
    "chai": "^4.3.10",
    "mocha": "^10.2.0"
  }
}
```

---

## Creating the Data Download Script

Create this file to automatically download your Google Sheets data:

**scripts/download_sheet_data.js:**

```javascript
const fs = require('fs').promises;
const path = require('path');
const { google } = require('googleapis');
const config = require('../config');

/**
 * Downloads Google Sheets data to local files for testing
 *
 * Usage:
 *   node scripts/download_sheet_data.js           (download sample)
 *   node scripts/download_sheet_data.js --full    (download all data)
 *   node scripts/download_sheet_data.js --sample  (download 10 rows)
 */

class SheetDownloader {
  constructor() {
    this.config = config;
  }

  /**
   * Authenticate with service account
   */
  async authenticate() {
    try {
      const auth = new google.auth.GoogleAuth({
        keyFile: this.config.PATHS.SERVICE_ACCOUNT,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });

      this.sheets = google.sheets({ version: 'v4', auth });
      console.log('✅ Authenticated with Google Sheets API');
      return true;
    } catch (error) {
      console.error('❌ Authentication failed:', error.message);
      console.error('\nMake sure:');
      console.error('1. Your service account JSON is at:', this.config.PATHS.SERVICE_ACCOUNT);
      console.error('2. You shared the spreadsheet with the service account email');
      throw error;
    }
  }

  /**
   * Download sheet data
   */
  async downloadSheet(sheetName, maxRows = null) {
    console.log(`\n📥 Downloading: ${sheetName}`);

    try {
      // Determine range
      const range = maxRows
        ? `${sheetName}!A1:BZ${maxRows + 1}`
        : `${sheetName}!A:BZ`;

      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.config.SPREADSHEET_ID,
        range: range,
      });

      const rows = response.data.values;

      if (!rows || rows.length === 0) {
        console.log('⚠️  No data found in sheet');
        return null;
      }

      console.log(`   Downloaded ${rows.length} rows (including header)`);
      return rows;
    } catch (error) {
      console.error(`❌ Failed to download ${sheetName}:`, error.message);

      if (error.message.includes('403')) {
        console.error('\n⚠️  Permission denied. Did you share the sheet with your service account?');
        console.error('   Service account email is in your .auth/service-account.json file');
      } else if (error.message.includes('404')) {
        console.error(`\n⚠️  Sheet "${sheetName}" not found. Check the sheet name in config.js`);
      }

      throw error;
    }
  }

  /**
   * Save data to JSON file
   */
  async saveAsJSON(sheetName, rows, filename) {
    const headers = rows[0];
    const dataRows = rows.slice(1);

    const jsonData = {
      sheetName: sheetName,
      downloadedAt: new Date().toISOString(),
      rowCount: dataRows.length,
      columnCount: headers.length,
      headers: headers,
      rows: rows,
      data: dataRows.map(row => {
        const obj = {};
        headers.forEach((header, i) => {
          obj[header] = row[i] || '';
        });
        return obj;
      })
    };

    // Ensure directory exists
    await fs.mkdir(this.config.PATHS.TEST_DATA_DIR, { recursive: true });

    const filePath = path.join(this.config.PATHS.TEST_DATA_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(jsonData, null, 2));

    console.log(`   ✅ Saved to: ${filePath}`);
    return filePath;
  }

  /**
   * Main download function
   */
  async download(options = {}) {
    const {
      fullData = false,
      sampleOnly = true,
      sampleRows = 10
    } = options;

    console.log('\n🚀 Starting download...\n');
    console.log('Configuration:');
    console.log(`   Spreadsheet ID: ${this.config.SPREADSHEET_ID}`);
    console.log(`   Mode: ${fullData ? 'Full data' : `Sample (${sampleRows} rows)`}`);
    console.log('');

    await this.authenticate();

    const results = [];

    // Download 2026 Field Plan
    const fieldPlanRows = await this.downloadSheet(
      this.config.SHEETS.FIELD_PLAN_2026,
      fullData ? null : sampleRows + 1
    );

    if (fieldPlanRows) {
      const filename = fullData
        ? '2026_field_plan_full.json'
        : '2026_field_plan_sample.json';

      await this.saveAsJSON(
        this.config.SHEETS.FIELD_PLAN_2026,
        fieldPlanRows,
        filename
      );

      results.push({
        sheet: this.config.SHEETS.FIELD_PLAN_2026,
        rows: fieldPlanRows.length - 1,
        file: filename
      });
    }

    console.log('\n✅ Download complete!\n');
    console.log('Summary:');
    results.forEach(r => {
      console.log(`   ${r.sheet}: ${r.rows} rows → ${r.file}`);
    });
    console.log('');

    return results;
  }
}

/**
 * Main execution
 */
async function main() {
  const args = process.argv.slice(2);

  const options = {
    fullData: args.includes('--full'),
    sampleOnly: !args.includes('--full'),
    sampleRows: config.TESTING.SAMPLE_ROW_COUNT
  };

  const downloader = new SheetDownloader();

  try {
    await downloader.download(options);
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Download failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = SheetDownloader;
```

---

## Setting Up Mock Objects

Create mock objects that simulate Google Apps Script's SpreadsheetApp and MailApp:

**src/mocks/google_apps_mocks.js:**

```javascript
/**
 * Mock objects for Google Apps Script services
 * These allow you to test your code locally without Apps Script
 */

const fs = require('fs');
const path = require('path');

/**
 * Mock SpreadsheetApp - simulates Google's SpreadsheetApp
 */
class MockSpreadsheetApp {
  constructor(testDataPath) {
    this.testDataPath = testDataPath;
    this.data = null;
  }

  loadData() {
    if (!this.data) {
      const fullPath = path.resolve(this.testDataPath);
      const fileContent = fs.readFileSync(fullPath, 'utf8');
      this.data = JSON.parse(fileContent);
    }
    return this.data;
  }

  getActive() {
    return new MockSpreadsheet(this);
  }
}

class MockSpreadsheet {
  constructor(app) {
    this.app = app;
  }

  getSheetByName(name) {
    const data = this.app.loadData();
    return new MockSheet(data, name);
  }
}

class MockSheet {
  constructor(data, name) {
    this.data = data;
    this.name = name;
    this.rows = data.rows || [];
    this.headers = data.headers || [];
  }

  getLastRow() {
    return this.rows.length;
  }

  getLastColumn() {
    return this.headers.length;
  }

  getRange(row, col, numRows, numCols) {
    return new MockRange(this, row, col, numRows, numCols);
  }

  getDataRange() {
    return new MockRange(this, 1, 1, this.rows.length, this.headers.length);
  }
}

class MockRange {
  constructor(sheet, row, col, numRows, numCols) {
    this.sheet = sheet;
    this.row = row;
    this.col = col;
    this.numRows = numRows;
    this.numCols = numCols;
  }

  getValues() {
    const result = [];
    const startRow = this.row - 1;
    const startCol = this.col - 1;

    for (let r = 0; r < this.numRows; r++) {
      const rowIndex = startRow + r;
      const sourceRow = this.sheet.rows[rowIndex] || [];
      const resultRow = [];

      for (let c = 0; c < this.numCols; c++) {
        const colIndex = startCol + c;
        resultRow.push(sourceRow[colIndex] || '');
      }

      result.push(resultRow);
    }

    return result;
  }
}

/**
 * Mock MailApp - simulates Google's MailApp
 */
class MockMailApp {
  constructor(config = {}) {
    this.config = config;
    this.sentEmails = [];
    this.mockMode = config.mockEmails !== false;
  }

  sendEmail(options) {
    const email = {
      timestamp: new Date().toISOString(),
      to: options.to || options.recipient,
      subject: options.subject,
      htmlBody: options.htmlBody,
      body: options.body,
      name: options.name,
      replyTo: options.replyTo
    };

    this.sentEmails.push(email);

    if (this.mockMode) {
      console.log('\n📧 [MOCK EMAIL SENT]');
      console.log(`   To: ${email.to}`);
      console.log(`   Subject: ${email.subject}`);
      console.log(`   Body length: ${(email.htmlBody || email.body || '').length} chars`);
      console.log('   (Email not actually sent - running in mock mode)');
    } else {
      console.log('\n📧 [EMAIL SENT]');
      console.log(`   To: ${email.to}`);
      console.log(`   Subject: ${email.subject}`);
    }

    return email;
  }

  getSentEmails() {
    return this.sentEmails;
  }

  clearSentEmails() {
    this.sentEmails = [];
  }

  getLastEmail() {
    return this.sentEmails[this.sentEmails.length - 1] || null;
  }
}

/**
 * Mock Logger - simulates Google's Logger
 */
class MockLogger {
  constructor() {
    this.logs = [];
  }

  log(...args) {
    const message = args.join(' ');
    this.logs.push({
      timestamp: new Date().toISOString(),
      message: message
    });
    console.log('[Logger]', message);
  }

  getLogs() {
    return this.logs;
  }

  clear() {
    this.logs = [];
  }
}

/**
 * Create global mocks for testing
 */
function createGlobalMocks(config) {
  const testDataPath = path.join(
    config.PATHS.TEST_DATA_DIR,
    config.TESTING.SAMPLE_ROWS_ONLY
      ? '2026_field_plan_sample.json'
      : '2026_field_plan_full.json'
  );

  // Create mock instances
  const mockSpreadsheetApp = new MockSpreadsheetApp(testDataPath);
  const mockMailApp = new MockMailApp(config.TESTING);
  const mockLogger = new MockLogger();

  // Make them globally available (like Apps Script does)
  global.SpreadsheetApp = mockSpreadsheetApp;
  global.MailApp = mockMailApp;
  global.Logger = mockLogger;

  return {
    SpreadsheetApp: mockSpreadsheetApp,
    MailApp: mockMailApp,
    Logger: mockLogger
  };
}

module.exports = {
  MockSpreadsheetApp,
  MockMailApp,
  MockLogger,
  createGlobalMocks
};
```

---

## Writing Tests

Create test files to verify your code works:

**tests/test_field_plan.js:**

```javascript
/**
 * Tests for FieldPlan class
 */

const path = require('path');
const config = require('../config');
const { createGlobalMocks } = require('../src/mocks/google_apps_mocks');

// Create mocks before loading your classes
const mocks = createGlobalMocks(config);

// Now load your column mappings (they'll use the mocked SpreadsheetApp)
// Note: You'll need to make your src files compatible with Node.js
// We'll create a loader for this
const FIELD_PLAN_COLUMNS = require('../src/column_mappings_node').FIELD_PLAN_COLUMNS;

console.log('🧪 Testing FieldPlan Class\n');

/**
 * Test 1: Load test data
 */
function testLoadData() {
  console.log('Test 1: Loading test data...');

  try {
    const sheet = SpreadsheetApp.getActive().getSheetByName('2026_field_plan');
    const lastRow = sheet.getLastRow();
    const lastCol = sheet.getLastColumn();

    console.log(`✅ Loaded sheet with ${lastRow} rows and ${lastCol} columns`);
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.message);
    return false;
  }
}

/**
 * Test 2: Read first row of data
 */
function testReadFirstRow() {
  console.log('\nTest 2: Reading first data row...');

  try {
    const sheet = SpreadsheetApp.getActive().getSheetByName('2026_field_plan');
    const data = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];

    console.log(`   Organization: ${data[FIELD_PLAN_COLUMNS.MEMBERNAME]}`);
    console.log(`   Contact Email: ${data[FIELD_PLAN_COLUMNS.CONTACTEMAIL]}`);
    console.log(`   Attended Training: ${data[FIELD_PLAN_COLUMNS.ATTENDEDTRAINING]}`);

    console.log('✅ Successfully read first row');
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.message);
    return false;
  }
}

/**
 * Test 3: Access column mappings
 */
function testColumnMappings() {
  console.log('\nTest 3: Testing column mappings...');

  try {
    console.log(`   MEMBERNAME column: ${FIELD_PLAN_COLUMNS.MEMBERNAME}`);
    console.log(`   ATTENDEDTRAINING column: ${FIELD_PLAN_COLUMNS.ATTENDEDTRAINING}`);
    console.log(`   FIELDNARRATIVE column: ${FIELD_PLAN_COLUMNS.FIELDNARRATIVE}`);

    console.log('✅ Column mappings accessible');
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.message);
    return false;
  }
}

/**
 * Run all tests
 */
function runTests() {
  console.log('=' .repeat(50));
  console.log('FIELD PLAN TESTS');
  console.log('='.repeat(50) + '\n');

  const results = [];

  results.push(testLoadData());
  results.push(testReadFirstRow());
  results.push(testColumnMappings());

  console.log('\n' + '='.repeat(50));
  const passed = results.filter(r => r).length;
  const total = results.length;
  console.log(`RESULTS: ${passed}/${total} tests passed`);
  console.log('='.repeat(50) + '\n');

  return passed === total;
}

// Run tests
const success = runTests();
process.exit(success ? 0 : 1);
```

**tests/test_email_functions.js:**

```javascript
/**
 * Tests for email functionality
 */

const config = require('../config');
const { createGlobalMocks } = require('../src/mocks/google_apps_mocks');

// Create mocks
const mocks = createGlobalMocks(config);

console.log('🧪 Testing Email Functions\n');

/**
 * Test 1: Send a mock email
 */
function testSendEmail() {
  console.log('Test 1: Sending mock email...');

  try {
    MailApp.sendEmail({
      to: config.EMAIL.TEST_RECIPIENT,
      subject: '[TEST] Field Plan Analysis',
      htmlBody: '<h1>Test Email</h1><p>This is a test email from local testing.</p>',
      name: config.EMAIL.FROM_NAME
    });

    const lastEmail = MailApp.getLastEmail();
    console.log(`   Subject: ${lastEmail.subject}`);
    console.log(`   To: ${lastEmail.to}`);
    console.log('✅ Email sent successfully (mock mode)');
    return true;
  } catch (error) {
    console.error('❌ Failed:', error.message);
    return false;
  }
}

/**
 * Test 2: Check email history
 */
function testEmailHistory() {
  console.log('\nTest 2: Checking email history...');

  try {
    // Clear previous emails
    MailApp.clearSentEmails();

    // Send multiple test emails
    for (let i = 1; i <= 3; i++) {
      MailApp.sendEmail({
        to: `test${i}@example.com`,
        subject: `Test Email ${i}`,
        body: `This is test email number ${i}`
      });
    }

    const emails = MailApp.getSentEmails();
    console.log(`   Sent ${emails.length} emails`);

    console.log('✅ Email history working');
    return emails.length === 3;
  } catch (error) {
    console.error('❌ Failed:', error.message);
    return false;
  }
}

/**
 * Test 3: Email formatting
 */
function testEmailFormatting() {
  console.log('\nTest 3: Testing email formatting...');

  try {
    const htmlBody = `
      <div style="font-family: Arial, sans-serif;">
        <h2>Field Plan Analysis</h2>
        <p><strong>Organization:</strong> Test Org</p>
        <p><strong>Contact:</strong> test@example.com</p>
        <hr>
        <h3>Program Details</h3>
        <ul>
          <li>Phone Banking: 1000 attempts</li>
          <li>Door Canvassing: 500 attempts</li>
        </ul>
      </div>
    `;

    MailApp.sendEmail({
      to: config.EMAIL.TEST_RECIPIENT,
      subject: 'Formatted Test Email',
      htmlBody: htmlBody,
      name: config.EMAIL.FROM_NAME
    });

    const email = MailApp.getLastEmail();
    const hasHtml = email.htmlBody && email.htmlBody.includes('<h2>');

    console.log(`   HTML detected: ${hasHtml}`);
    console.log('✅ Email formatting working');
    return hasHtml;
  } catch (error) {
    console.error('❌ Failed:', error.message);
    return false;
  }
}

/**
 * Run all tests
 */
function runTests() {
  console.log('='.repeat(50));
  console.log('EMAIL FUNCTION TESTS');
  console.log('='.repeat(50) + '\n');

  const results = [];

  results.push(testSendEmail());
  results.push(testEmailHistory());
  results.push(testEmailFormatting());

  console.log('\n' + '='.repeat(50));
  const passed = results.filter(r => r).length;
  const total = results.length;
  console.log(`RESULTS: ${passed}/${total} tests passed`);
  console.log('='.repeat(50) + '\n');

  return passed === total;
}

// Run tests
const success = runTests();
process.exit(success ? 0 : 1);
```

**tests/run_all_tests.js:**

```javascript
/**
 * Run all tests
 */

const { execSync } = require('child_process');

console.log('\n🧪 Running All Tests\n');
console.log('='.repeat(60) + '\n');

const tests = [
  'tests/test_field_plan.js',
  'tests/test_email_functions.js'
];

let allPassed = true;

tests.forEach((testFile, index) => {
  console.log(`\n📋 Test Suite ${index + 1}/${tests.length}: ${testFile}\n`);

  try {
    execSync(`node ${testFile}`, { stdio: 'inherit' });
    console.log(`✅ ${testFile} passed\n`);
  } catch (error) {
    console.error(`❌ ${testFile} failed\n`);
    allPassed = false;
  }
});

console.log('\n' + '='.repeat(60));
if (allPassed) {
  console.log('✅ ALL TESTS PASSED');
} else {
  console.log('❌ SOME TESTS FAILED');
}
console.log('='.repeat(60) + '\n');

process.exit(allPassed ? 0 : 1);
```

---

## Running Tests

### Step 1: First Time Setup

```bash
cd /Users/richardscc1/alf_dev/appsscript/fieldplan_analyzer/2026_analyzer

# Download sample data
npm run download:sample
```

You should see output like:
```
🚀 Starting download...

Configuration:
   Spreadsheet ID: 1a2b3c4d5e6f7g8h9i0j
   Mode: Sample (10 rows)

✅ Authenticated with Google Sheets API

📥 Downloading: 2026_field_plan
   Downloaded 11 rows (including header)
   ✅ Saved to: ./test_data/2026_field_plan_sample.json

✅ Download complete!
```

### Step 2: Run Tests

```bash
# Run all tests (downloads fresh data first)
npm test

# Run tests without downloading (uses existing data)
npm run test:no-download

# Run a specific test file
npm run test:single
```

### Step 3: View Test Output

You'll see output like:
```
🧪 Testing FieldPlan Class

==================================================
FIELD PLAN TESTS
==================================================

Test 1: Loading test data...
✅ Loaded sheet with 10 rows and 73 columns

Test 2: Reading first data row...
   Organization: Alabama Voices
   Contact Email: contact@alabamavoices.org
   Attended Training: Yes
✅ Successfully read first row

Test 3: Testing column mappings...
   MEMBERNAME column: 2
   ATTENDEDTRAINING column: 1
   FIELDNARRATIVE column: 19
✅ Column mappings accessible

==================================================
RESULTS: 3/3 tests passed
==================================================
```

---

## Testing Email Functions

### Understanding Mock Emails

When you run tests locally, emails are **mocked** by default:
- ✅ Your code thinks it's sending emails
- ✅ You can verify the email content
- ❌ No actual emails are sent

This is controlled by the `MOCK_EMAILS` setting in `config.js`.

### Example: Testing Field Plan Email

Create this test:

**tests/test_field_plan_email.js:**

```javascript
const config = require('../config');
const { createGlobalMocks } = require('../src/mocks/google_apps_mocks');

// Create mocks
const mocks = createGlobalMocks(config);

console.log('🧪 Testing Field Plan Email Generation\n');

/**
 * Test sending a field plan analysis email
 */
function testFieldPlanEmail() {
  console.log('Test: Generating field plan email...\n');

  try {
    // Get test data
    const sheet = SpreadsheetApp.getActive().getSheetByName('2026_field_plan');
    const rowData = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];

    // Extract some fields (using your actual column indices)
    const orgName = rowData[2];  // MEMBERNAME
    const contactEmail = rowData[5];  // CONTACTEMAIL
    const attendedTraining = rowData[1];  // ATTENDEDTRAINING
    const fieldNarrative = rowData[19];  // FIELDNARRATIVE

    // Build email content
    const subject = `Field Plan Analysis: ${orgName}`;
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2 style="color: #2c5282;">Field Plan Received</h2>

        <div style="background-color: #f7fafc; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Organization Details</h3>
          <p><strong>Organization:</strong> ${orgName}</p>
          <p><strong>Contact Email:</strong> ${contactEmail}</p>
          <p><strong>Attended Training:</strong> ${attendedTraining}</p>
        </div>

        <div style="margin: 20px 0;">
          <h3>Field Program Narrative</h3>
          <p style="white-space: pre-wrap;">${fieldNarrative || 'Not provided'}</p>
        </div>

        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #718096; font-size: 14px;">
            This is an automated message from the Alabama Forward Data Team.
          </p>
        </div>
      </div>
    `;

    // Send email
    MailApp.sendEmail({
      to: contactEmail,
      subject: subject,
      htmlBody: htmlBody,
      name: 'Alabama Forward Data Team'
    });

    // Verify email was "sent"
    const sentEmail = MailApp.getLastEmail();

    console.log('📧 Email Details:');
    console.log(`   To: ${sentEmail.to}`);
    console.log(`   Subject: ${sentEmail.subject}`);
    console.log(`   HTML Length: ${sentEmail.htmlBody.length} characters`);
    console.log(`   Contains org name: ${sentEmail.htmlBody.includes(orgName)}`);
    console.log(`   Contains narrative: ${sentEmail.htmlBody.includes('Field Program Narrative')}`);

    console.log('\n✅ Email generated successfully (mock mode)');
    console.log('\n💡 TIP: Set MOCK_EMAILS to false in config.js to actually send emails');

    return true;
  } catch (error) {
    console.error('❌ Failed:', error.message);
    console.error(error.stack);
    return false;
  }
}

// Run test
const success = testFieldPlanEmail();
process.exit(success ? 0 : 1);
```

Run it:
```bash
node tests/test_field_plan_email.js
```

### Saving Email HTML for Preview

Add this helper to preview emails in your browser:

**tests/helpers/save_email_preview.js:**

```javascript
const fs = require('fs');
const path = require('path');

/**
 * Save email HTML to a file you can open in browser
 */
function saveEmailPreview(htmlBody, filename = 'email_preview.html') {
  const outputPath = path.join(__dirname, '../../temp', filename);

  // Ensure temp directory exists
  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // Write HTML file
  fs.writeFileSync(outputPath, htmlBody);

  console.log(`\n💾 Email preview saved to: ${outputPath}`);
  console.log(`   Open in browser: file://${outputPath}`);

  return outputPath;
}

module.exports = { saveEmailPreview };
```

Use it in your tests:
```javascript
const { saveEmailPreview } = require('./helpers/save_email_preview');

// After generating email
const email = MailApp.getLastEmail();
saveEmailPreview(email.htmlBody, 'field_plan_email.html');
```

---

## Troubleshooting

### Problem: "Authentication failed"

**Solution:**
```bash
# Check if service account file exists
ls -la .auth/service-account.json

# If missing, re-download from Google Cloud Console
# Make sure it's named exactly: service-account.json
```

### Problem: "Permission denied" (403 error)

**Solution:**
1. Open your service account JSON file
2. Find the `client_email` field
3. Copy that email address
4. Go to your Google Sheet
5. Click Share button
6. Add that email with "Viewer" permission
7. Try downloading again

### Problem: "Spreadsheet not found" (404 error)

**Solution:**
Check your Spreadsheet ID in `config.js`:
```javascript
// Wrong: Using the full URL
SPREADSHEET_ID: 'https://docs.google.com/spreadsheets/d/1abc.../edit'

// Correct: Just the ID
SPREADSHEET_ID: '1abc123def456ghi789'
```

### Problem: "Cannot find module"

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### Problem: Test data is outdated

**Solution:**
```bash
# Download fresh data
npm run download:sample

# Or download full dataset
npm run download:full
```

### Problem: Column mapping errors

**Solution:**
Your `src/column_mappings.js` needs to be Node.js compatible. Create a wrapper:

**src/column_mappings_node.js:**
```javascript
// Load the column mappings for Node.js

// Since Apps Script uses global scope, we need to export for Node
const FIELD_PLAN_COLUMNS = {
  SUBMISSIONDATETIME: 0,
  ATTENDEDTRAINING: 1,
  MEMBERNAME: 2,
  // ... rest of your mappings
};

const PROGRAM_COLUMNS = {
  PHONE: {
    PROGRAMLENGTH: 37,
    WEEKLYVOLUNTEERS: 38,
    WEEKLYHOURS: 39,
    HOURLYATTEMPTS: 40
  },
  // ... rest of your mappings
};

module.exports = {
  FIELD_PLAN_COLUMNS,
  PROGRAM_COLUMNS
};
```

---

## Quick Reference

### Download Data

```bash
# Sample data (10 rows) - Fast
npm run download:sample

# Full data - Slower
npm run download:full
```

### Run Tests

```bash
# All tests with fresh data
npm test

# All tests with existing data
npm run test:no-download

# Single test file
node tests/test_field_plan.js
```

### File Locations

```
2026_analyzer/
├── .auth/
│   └── service-account.json    # Your credentials (never commit!)
├── config.js                   # Configuration
├── scripts/
│   └── download_sheet_data.js  # Download script
├── src/
│   ├── mocks/
│   │   └── google_apps_mocks.js  # Mock objects
│   └── column_mappings_node.js   # Column mappings for Node.js
├── test_data/
│   ├── 2026_field_plan_sample.json  # Sample data
│   └── 2026_field_plan_full.json    # Full data
└── tests/
    ├── test_field_plan.js      # Field plan tests
    ├── test_email_functions.js # Email tests
    └── run_all_tests.js        # Run all tests
```

### Workflow

1. **Make code changes** in VS Code
2. **Download fresh data:** `npm run download:sample`
3. **Run tests:** `npm test`
4. **Fix any issues** shown in test output
5. **Repeat** until tests pass
6. **Deploy to Apps Script** when ready

---

## Next Steps

Now that you have local testing set up:

1. ✅ Create tests for your FieldPlan class
2. ✅ Create tests for your FieldProgram/Tactic classes
3. ✅ Test email generation with real field plan data
4. ✅ Add tests for edge cases (missing data, invalid values)
5. ✅ Set up automated testing in your development workflow

**Happy testing! 🎉**
