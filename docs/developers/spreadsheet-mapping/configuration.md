---
layout: default
title: Configuration Guide
parent: Spreadsheet Mapping
grand_parent: For Developers
nav_order: 1
---

# Spreadsheet Configuration Guide

This guide explains how to configure your Google Sheets to work as a database backend for Apps Script applications.

## Sheet Structure Design

### 1. Define Your Data Model

Before creating sheets, plan your data structure:

```javascript
// Example: Project tracking system
const DATA_MODEL = {
  projects: {
    columns: ['ID', 'Name', 'Status', 'Owner', 'Start Date', 'End Date'],
    primaryKey: 'ID'
  },
  tasks: {
    columns: ['ID', 'Project ID', 'Title', 'Assignee', 'Status', 'Due Date'],
    primaryKey: 'ID',
    foreignKey: 'Project ID'
  },
  users: {
    columns: ['Email', 'Name', 'Role', 'Department'],
    primaryKey: 'Email'
  }
};
```

### 2. Create Header Rows

Always use the first row for column headers:

```javascript
function initializeSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create Projects sheet
  const projectSheet = ss.insertSheet('Projects');
  projectSheet.getRange(1, 1, 1, 6).setValues([
    ['ID', 'Name', 'Status', 'Owner', 'Start Date', 'End Date']
  ]);
  
  // Create Tasks sheet
  const taskSheet = ss.insertSheet('Tasks');
  taskSheet.getRange(1, 1, 1, 6).setValues([
    ['ID', 'Project ID', 'Title', 'Assignee', 'Status', 'Due Date']
  ]);
}
```

## Column Mapping Patterns

### Static Column Mapping

Define column positions as constants:

```javascript
// Column indices (0-based)
const COLUMNS = {
  PROJECTS: {
    ID: 0,
    NAME: 1,
    STATUS: 2,
    OWNER: 3,
    START_DATE: 4,
    END_DATE: 5
  },
  TASKS: {
    ID: 0,
    PROJECT_ID: 1,
    TITLE: 2,
    ASSIGNEE: 3,
    STATUS: 4,
    DUE_DATE: 5
  }
};

// Usage
function getProjectById(projectId) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Projects');
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][COLUMNS.PROJECTS.ID] === projectId) {
      return {
        id: data[i][COLUMNS.PROJECTS.ID],
        name: data[i][COLUMNS.PROJECTS.NAME],
        status: data[i][COLUMNS.PROJECTS.STATUS],
        owner: data[i][COLUMNS.PROJECTS.OWNER],
        startDate: data[i][COLUMNS.PROJECTS.START_DATE],
        endDate: data[i][COLUMNS.PROJECTS.END_DATE]
      };
    }
  }
  return null;
}
```

### Dynamic Column Mapping

Use header row to determine column positions:

```javascript
function getColumnMap(sheet) {
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const columnMap = {};
  
  headers.forEach((header, index) => {
    columnMap[header] = index;
  });
  
  return columnMap;
}

// Usage
function getDynamicData(sheetName, filterColumn, filterValue) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  const columnMap = getColumnMap(sheet);
  const data = sheet.getDataRange().getValues();
  const results = [];
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][columnMap[filterColumn]] === filterValue) {
      const row = {};
      Object.keys(columnMap).forEach(key => {
        row[key] = data[i][columnMap[key]];
      });
      results.push(row);
    }
  }
  
  return results;
}
```

## Data Validation

### Setting Up Validation Rules

```javascript
function setupDataValidation() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const projectSheet = ss.getSheetByName('Projects');
  
  // Status dropdown
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Planning', 'Active', 'On Hold', 'Completed'])
    .setAllowInvalid(false)
    .build();
  
  projectSheet.getRange(2, 3, projectSheet.getMaxRows() - 1, 1)
    .setDataValidation(statusRule);
  
  // Date validation
  const dateRule = SpreadsheetApp.newDataValidation()
    .requireDate()
    .setAllowInvalid(false)
    .build();
  
  projectSheet.getRange(2, 5, projectSheet.getMaxRows() - 1, 2)
    .setDataValidation(dateRule);
}
```

### Enforcing Unique IDs

```javascript
function generateUniqueId(sheet, idColumn = 0) {
  const data = sheet.getDataRange().getValues();
  const existingIds = data.slice(1).map(row => row[idColumn]);
  
  let newId;
  do {
    newId = 'ID' + Date.now() + Math.random().toString(36).substr(2, 9);
  } while (existingIds.includes(newId));
  
  return newId;
}
```

## Named Ranges

### Creating Named Ranges

```javascript
function createNamedRanges() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Define data ranges (excluding headers)
  const projectSheet = ss.getSheetByName('Projects');
  const projectDataRange = projectSheet.getRange(
    2, 1, 
    projectSheet.getLastRow() - 1, 
    projectSheet.getLastColumn()
  );
  
  // Create named range
  ss.setNamedRange('ProjectData', projectDataRange);
  
  // Create column header ranges
  const headerRange = projectSheet.getRange(1, 1, 1, projectSheet.getLastColumn());
  ss.setNamedRange('ProjectHeaders', headerRange);
}

// Using named ranges
function getDataFromNamedRange() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const projectData = ss.getRangeByName('ProjectData').getValues();
  const headers = ss.getRangeByName('ProjectHeaders').getValues()[0];
  
  return projectData.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}
```

## Performance Optimization

### Batch Operations

```javascript
// Bad: Multiple individual reads
function inefficientRead(sheet, rowCount) {
  const data = [];
  for (let i = 2; i <= rowCount; i++) {
    data.push(sheet.getRange(i, 1, 1, 6).getValues()[0]);
  }
  return data;
}

// Good: Single batch read
function efficientRead(sheet) {
  return sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn())
    .getValues();
}
```

### Caching Strategies

```javascript
const DataCache = {
  cache: {},
  
  get(sheetName, forceRefresh = false) {
    if (!this.cache[sheetName] || forceRefresh) {
      const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
      this.cache[sheetName] = {
        data: sheet.getDataRange().getValues(),
        timestamp: new Date().getTime()
      };
    }
    return this.cache[sheetName].data;
  },
  
  clear(sheetName = null) {
    if (sheetName) {
      delete this.cache[sheetName];
    } else {
      this.cache = {};
    }
  }
};
```

## Configuration Template

Here's a complete configuration template for your projects:

```javascript
/**
 * Spreadsheet Configuration Template
 * Copy and customize for your project
 */

const SPREADSHEET_CONFIG = {
  // Sheet names
  sheets: {
    MAIN_DATA: 'MainData',
    LOOKUP_VALUES: 'Lookups',
    CONFIGURATION: 'Config',
    LOGS: 'Logs'
  },
  
  // Column mappings
  columns: {
    MAIN_DATA: {
      ID: 0,
      CREATED_DATE: 1,
      MODIFIED_DATE: 2,
      STATUS: 3,
      // Add your columns here
    }
  },
  
  // Validation rules
  validation: {
    STATUS_VALUES: ['New', 'In Progress', 'Completed', 'Archived'],
    REQUIRED_FIELDS: ['ID', 'CREATED_DATE', 'STATUS']
  },
  
  // Named ranges
  namedRanges: {
    MAIN_DATA: 'MainDataRange',
    STATUS_LIST: 'StatusValues'
  }
};

// Initialize spreadsheet with configuration
function initializeSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create sheets
  Object.entries(SPREADSHEET_CONFIG.sheets).forEach(([key, sheetName]) => {
    try {
      ss.insertSheet(sheetName);
    } catch (e) {
      // Sheet already exists
    }
  });
  
  // Set up main data sheet
  const mainSheet = ss.getSheetByName(SPREADSHEET_CONFIG.sheets.MAIN_DATA);
  const headers = Object.keys(SPREADSHEET_CONFIG.columns.MAIN_DATA);
  mainSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  // Apply formatting
  mainSheet.getRange(1, 1, 1, headers.length)
    .setBackground('#4285F4')
    .setFontColor('#FFFFFF')
    .setFontWeight('bold');
  
  // Set up validation
  setupValidation(mainSheet);
  
  // Create named ranges
  createNamedRanges(ss);
}
```

## Next Steps

- Review [Mapping Examples](./examples) for real-world patterns
- Implement error handling for data operations
- Set up automated backups of your spreadsheet data
- Consider implementing audit trails for data changes