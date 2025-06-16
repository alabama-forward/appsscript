---
layout: default
title: Getting Started - Developer Guide
---

# Getting Started with Apps Script Development

This guide will help you set up your development environment and understand the basics of working with Google Apps Script.

## Setting Up Your Environment

### 1. **Access the Apps Script Editor**

There are several ways to create a new Apps Script project:

**From Google Drive:**
1. Go to [drive.google.com](https://drive.google.com)
2. Click "New" → "More" → "Google Apps Script"
3. Name your project

**From Google Sheets:**
1. Open a Google Sheet
2. Click "Extensions" → "Apps Script"
3. The script will be bound to this sheet

**Direct Access:**
1. Visit [script.google.com](https://script.google.com)
2. Click "New Project"
3. Start coding immediately

### 2. **Understanding the Editor**

The Apps Script editor includes:
- **Code Editor**: Write your JavaScript code
- **Project Settings**: Configure project properties
- **Triggers**: Set up automated execution
- **Executions**: View logs and debug
- **Libraries**: Add external dependencies

### 3. **Project Structure**

A typical Apps Script project contains:
```
MyProject/
├── Code.gs           # Server-side code
├── index.html        # Client-side HTML
├── stylesheet.html   # CSS styles
├── javascript.html   # Client-side JavaScript
└── appsscript.json  # Project manifest
```

## Core Concepts

### 1. **Server vs Client Code**

**Server-side (`.gs` files):**
- Runs on Google's servers
- Has access to Google services
- Cannot use browser APIs
- Executes synchronously

**Client-side (`.html` files):**
- Runs in the user's browser
- Can use HTML, CSS, JavaScript
- Communicates with server via `google.script.run`
- Handles user interactions

### 2. **Google Services**

Apps Script provides built-in services:

```javascript
// Spreadsheet Service
const sheet = SpreadsheetApp.getActiveSheet();
const data = sheet.getDataRange().getValues();

// Gmail Service
GmailApp.sendEmail(
  'recipient@example.com',
  'Subject',
  'Body'
);

// Drive Service
const folder = DriveApp.getFolderById('folder-id');
const files = folder.getFiles();

// Calendar Service
const calendar = CalendarApp.getDefaultCalendar();
const events = calendar.getEventsForDay(new Date());
```

### 3. **Authorization and Scopes**

Apps Script requires authorization for accessing Google services:

```json
// appsscript.json
{
  "timeZone": "America/New_York",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "oauthScopes": [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/gmail.send",
    "https://www.googleapis.com/auth/script.external_request"
  ]
}
```

## Your First Apps Script Project

### Step 1: Create a Simple Spreadsheet Function

```javascript
// Code.gs
function onOpen() {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu('Custom Menu')
    .addItem('Process Data', 'processData')
    .addToUi();
}

function processData() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = sheet.getDataRange().getValues();
  
  // Skip header row
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const name = row[0];
    const value = row[1];
    
    // Process each row
    const processed = `Processed: ${name} - ${value}`;
    sheet.getRange(i + 1, 3).setValue(processed);
  }
  
  SpreadsheetApp.getUi().alert('Processing complete!');
}
```

### Step 2: Add a Web Interface

```javascript
// Code.gs
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('My First Web App');
}

function getData() {
  const sheet = SpreadsheetApp.openById('YOUR_SPREADSHEET_ID')
    .getSheetByName('Sheet1');
  return sheet.getDataRange().getValues();
}
```

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
  </style>
</head>
<body>
  <h1>Data Viewer</h1>
  <div id="content">Loading...</div>
  
  <script>
    // Call server function
    google.script.run
      .withSuccessHandler(showData)
      .withFailureHandler(showError)
      .getData();
    
    function showData(data) {
      let html = '<table>';
      data.forEach((row, index) => {
        html += '<tr>';
        row.forEach(cell => {
          const tag = index === 0 ? 'th' : 'td';
          html += `<${tag}>${cell}</${tag}>`;
        });
        html += '</tr>';
      });
      html += '</table>';
      document.getElementById('content').innerHTML = html;
    }
    
    function showError(error) {
      document.getElementById('content').innerHTML = 
        'Error: ' + error.message;
    }
  </script>
</body>
</html>
```

### Step 3: Deploy as Web App

1. Click "Deploy" → "New Deployment"
2. Choose "Web app" as the type
3. Configure:
   - Execute as: "Me"
   - Who has access: "Anyone" (or restrict as needed)
4. Click "Deploy"
5. Copy the web app URL

## Development Tips

### 1. **Use the Logger**

```javascript
function debugExample() {
  const data = [1, 2, 3, 4, 5];
  
  // Log to console
  console.log('Data:', data);
  
  // Use Logger service
  Logger.log('Processing started');
  data.forEach(item => {
    Logger.log('Item: ' + item);
  });
  
  // View logs: View → Logs
}
```

### 2. **Handle Errors Gracefully**

```javascript
function safeOperation() {
  try {
    // Risky operation
    const sheet = SpreadsheetApp.openById('some-id');
    const data = sheet.getDataRange().getValues();
    return { success: true, data: data };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: error.toString() };
  }
}
```

### 3. **Use Script Properties**

```javascript
// Store configuration
function setConfig() {
  const scriptProperties = PropertiesService.getScriptProperties();
  scriptProperties.setProperties({
    'SPREADSHEET_ID': 'your-spreadsheet-id',
    'EMAIL_RECIPIENT': 'admin@example.com',
    'API_KEY': 'your-api-key'
  });
}

// Retrieve configuration
function getConfig() {
  const scriptProperties = PropertiesService.getScriptProperties();
  return scriptProperties.getProperties();
}
```

### 4. **Optimize Spreadsheet Operations**

```javascript
// Bad: Multiple API calls
function slowWrite() {
  const sheet = SpreadsheetApp.getActiveSheet();
  for (let i = 0; i < 100; i++) {
    sheet.getRange(i + 1, 1).setValue(i); // 100 API calls!
  }
}

// Good: Batch operation
function fastWrite() {
  const sheet = SpreadsheetApp.getActiveSheet();
  const values = [];
  for (let i = 0; i < 100; i++) {
    values.push([i]);
  }
  sheet.getRange(1, 1, values.length, 1).setValues(values); // 1 API call
}
```

## Common Patterns

### 1. **Column Mapping**

```javascript
const COLUMNS = {
  NAME: 0,
  EMAIL: 1,
  STATUS: 2,
  DATE: 3
};

function processRow(row) {
  const name = row[COLUMNS.NAME];
  const email = row[COLUMNS.EMAIL];
  const status = row[COLUMNS.STATUS];
  
  // Process data using named columns
  if (status === 'Active') {
    sendEmail(email, `Hello ${name}`);
  }
}
```

### 2. **Configuration Object**

```javascript
const CONFIG = {
  SPREADSHEET_ID: 'your-id-here',
  SHEET_NAMES: {
    DATA: 'Data',
    CONFIG: 'Config',
    LOG: 'Log'
  },
  EMAIL: {
    RECIPIENTS: ['admin@example.com'],
    SUBJECT_PREFIX: '[AutoReport]'
  }
};
```

### 3. **Factory Functions**

```javascript
class DataModel {
  constructor(row) {
    this.name = row[0];
    this.value = row[1];
    this.date = row[2];
  }
  
  static fromRow(row) {
    return new DataModel(row);
  }
  
  static fromSheet(sheetName) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(sheetName);
    const data = sheet.getDataRange().getValues();
    return data.slice(1).map(row => DataModel.fromRow(row));
  }
}
```

## Next Steps

Now that you understand the basics:

1. Explore the [Field Coordination Browser Architecture](/appsscript/developers/field-coordination-browser/architecture)
2. Learn about [Class-Based Structures](/appsscript/developers/fieldplan-analyzer/class-structure)
3. Master [Spreadsheet Mapping](/appsscript/developers/spreadsheet-mapping/configuration)
4. Implement [Timer-Based Automation](/appsscript/developers/fieldplan-analyzer/timers)

## Troubleshooting

### Common Issues

**"You do not have permission to call X"**
- Add the required scope to appsscript.json
- Re-authorize the script

**"Exceeded maximum execution time"**
- Apps Script has a 6-minute limit for executions
- Break long operations into smaller chunks
- Use time-based triggers for batch processing

**"Service invoked too many times"**
- Batch your API calls
- Use caching where appropriate
- Implement exponential backoff for retries

Remember: Start simple, test often, and gradually add complexity as you become comfortable with the platform!