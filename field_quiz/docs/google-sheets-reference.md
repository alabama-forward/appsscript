# Pulling Google Spreadsheet Data into Local Project

## Overview
This guide explains how to pull data from a Google Spreadsheet into your local `field_quiz` project folder for reference during development.

## Option 1: Manual Export (Simplest)

### Download as CSV
1. Open your Google Spreadsheet
2. Go to **File > Download > Comma Separated Values (.csv)**
3. Save to `field_quiz/data/` folder
4. Repeat for each sheet/tab you need

### Download as JSON
1. Open your Google Spreadsheet
2. Go to **File > Download > Microsoft Excel (.xlsx)**
3. Convert to JSON using a tool or script (see Option 3)

**Pros**: Simple, no authentication needed
**Cons**: Manual process, need to re-download when data changes

## Option 2: Use Google Sheets Public Link

If your spreadsheet can be public, you can export it via a direct URL.

### Make Sheet Publicly Accessible
1. Open your spreadsheet
2. Click **Share** > **Change to anyone with the link**
3. Set permission to **Viewer**

### Export URLs
Replace `SPREADSHEET_ID` with your sheet ID:

**As CSV (specific tab):**
```
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/export?format=csv&gid=SHEET_GID
```

**As Excel:**
```
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/export?format=xlsx
```

**As JSON (requires Apps Script Web App):**
You'd need to create an Apps Script web app that returns JSON.

### Download Locally
```bash
cd field_quiz/data
curl "https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/export?format=csv&gid=0" -o organizations.csv
```

## Option 3: Google Sheets API (Recommended for Automation)

Use the Google Sheets API to programmatically fetch data and save it locally.

### Setup Steps

1. **Enable Google Sheets API**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Enable Google Sheets API for your project
   - Create OAuth 2.0 credentials or Service Account

2. **Install Google Sheets Node.js Client** (if using Node.js)
   ```bash
   npm install googleapis@105 --save-dev
   ```

3. **Create a Pull Script**

Create `field_quiz/scripts/pull-sheets-data.js`:

```javascript
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// Configure these
const SPREADSHEET_ID = 'YOUR_SPREADSHEET_ID_HERE';
const SHEET_NAME = 'Organizations'; // or 'Sheet1', etc.
const OUTPUT_FILE = path.join(__dirname, '../data/organizations.json');

async function pullSheetData() {
  try {
    // Authenticate (using service account or OAuth)
    const auth = new google.auth.GoogleAuth({
      keyFile: path.join(__dirname, '../credentials.json'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });

    // Fetch data
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${SHEET_NAME}!A:Z`, // Adjust range as needed
    });

    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log('No data found.');
      return;
    }

    // Convert to JSON (assuming first row is headers)
    const headers = rows[0];
    const data = rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index] || '';
      });
      return obj;
    });

    // Ensure data directory exists
    const dataDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    // Save to file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(data, null, 2));
    console.log(`✓ Successfully pulled ${data.length} rows from ${SHEET_NAME}`);
    console.log(`✓ Saved to ${OUTPUT_FILE}`);

  } catch (error) {
    console.error('Error pulling sheet data:', error.message);
  }
}

pullSheetData();
```

4. **Add Script to package.json**

Create or update `field_quiz/package.json`:
```json
{
  "name": "field_quiz",
  "version": "1.0.0",
  "scripts": {
    "pull-data": "node scripts/pull-sheets-data.js"
  },
  "devDependencies": {
    "googleapis": "^105.0.0"
  }
}
```

5. **Run the Script**
```bash
cd field_quiz
npm install
npm run pull-data
```

## Option 4: Using clasp and Apps Script

Since you're using clasp, you can create an Apps Script function that exports data, then run it from the command line.

### Create Export Function in Apps Script

Add to your `src/get_in_field_quiz.js` or create a new file:

```javascript
function exportSheetAsJSON() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Organizations');
  const data = sheet.getDataRange().getValues();

  const headers = data[0];
  const rows = data.slice(1);

  const json = rows.map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i];
    });
    return obj;
  });

  // Log JSON (you can copy this)
  Logger.log(JSON.stringify(json, null, 2));
  return json;
}
```

### Run from Command Line
```bash
cd field_quiz
clasp run exportSheetAsJSON
```

Copy the output and save it to a local JSON file.

## Recommended Folder Structure

```
field_quiz/
├── .clasp.json
├── data/                    # Local reference data
│   ├── organizations.json
│   ├── organizations.csv
│   └── .gitignore          # Add this to prevent committing sensitive data
├── docs/
├── scripts/                 # Helper scripts
│   └── pull-sheets-data.js
└── src/
```

## Security Notes

1. **Never commit credentials** - Add to `.gitignore`:
   ```
   field_quiz/credentials.json
   field_quiz/data/*.csv
   field_quiz/data/*.json
   ```

2. **Service Account** (recommended for automation):
   - Create service account in Google Cloud Console
   - Download credentials JSON
   - Share your spreadsheet with the service account email

3. **OAuth Credentials** (for personal use):
   - Use OAuth 2.0 for user authentication
   - Token stored locally

## Quick Start: Get Your Spreadsheet ID

Your spreadsheet URL looks like:
```
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
```

The `SPREADSHEET_ID` is the long string between `/d/` and `/edit`.

## Next Steps

1. Decide which option works best for your workflow
2. Create a `data/` folder in your field_quiz project
3. Set up authentication if using API
4. Pull your reference data
5. Add data folder to `.gitignore` if it contains sensitive info
