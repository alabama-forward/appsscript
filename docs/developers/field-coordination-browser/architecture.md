---
layout: default
title: Field Coordination Browser - Architecture
---

# Field Coordination Browser Architecture

The Field Coordination Browser demonstrates how to build a sophisticated web application using Google Apps Script, with a spreadsheet serving as the backend database.

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Web Browser   │────▶│  Apps Script     │────▶│ Google Sheets   │
│  (Client-side)  │◀────│  (Server-side)   │◀────│   (Database)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                         │                         │
        │                         │                         │
    HTML/CSS/JS            Business Logic            Data Storage
    User Interface         Authentication            State Management
    Event Handling         Data Processing           Email Mappings
```

## Core Components

### 1. **Server-Side (Code.gs)**

The server-side code handles all business logic and data access:

```javascript
// Main entry point for web app
function doGet() {
  const userEmail = Session.getActiveUser().getEmail();
  const template = HtmlService.createTemplateFromFile('index');
  template.userEmail = userEmail;
  
  return template.evaluate()
    .setTitle('Field Coordination Browser')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Include external files
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
```

### 2. **Client-Side Architecture**

The client interface is split into modular components:

- **index.html**: Main HTML structure
- **styles.html**: CSS styling
- **client-side.html**: JavaScript functionality

### 3. **Data Layer**

Spreadsheet sheets serve different purposes:

```javascript
const SHEETS = {
  PRIORITIES: 'priorities',      // Main data
  SEARCH: 'search',             // Search interface
  ORG_CONTACTS: 'orgContacts',  // Email mappings
  USER_SELECTIONS: 'userSelections' // Active claims
};
```

## Key Design Patterns

### 1. **Server-Client Communication**

Use `google.script.run` for asynchronous communication:

```javascript
// Client-side call
google.script.run
  .withSuccessHandler(handleSuccess)
  .withFailureHandler(handleError)
  .getDataFromServer(parameters);

// Server-side handler
function getDataFromServer(parameters) {
  try {
    // Process request
    const data = fetchData(parameters);
    return { success: true, data: data };
  } catch (error) {
    return { success: false, error: error.toString() };
  }
}
```

### 2. **Session Management**

Track user sessions and state:

```javascript
function getUserSession() {
  const email = Session.getActiveUser().getEmail();
  const temp = Session.getTemporaryActiveUserKey();
  
  return {
    email: email,
    sessionId: temp,
    timestamp: new Date()
  };
}

function trackUserAction(action, data) {
  const session = getUserSession();
  const logSheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('activityLog');
  
  logSheet.appendRow([
    session.timestamp,
    session.email,
    action,
    JSON.stringify(data)
  ]);
}
```

### 3. **Real-Time Updates**

Implement claim system with instant feedback:

```javascript
function claimItem(itemId, userEmail) {
  const lock = LockService.getScriptLock();
  
  try {
    // Get exclusive lock to prevent race conditions
    lock.waitLock(10000);
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(SHEETS.PRIORITIES);
    const data = sheet.getDataRange().getValues();
    
    // Find and claim item
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === itemId && !data[i][COLUMNS.CLAIMED_BY]) {
        sheet.getRange(i + 1, COLUMNS.CLAIMED_BY + 1).setValue(userEmail);
        sheet.getRange(i + 1, COLUMNS.CLAIM_TIME + 1).setValue(new Date());
        
        // Send notification
        sendClaimNotification(data[i], userEmail);
        
        return { success: true, message: 'Item claimed successfully' };
      }
    }
    
    return { success: false, message: 'Item already claimed' };
    
  } catch (e) {
    return { success: false, message: 'Error claiming item: ' + e.toString() };
  } finally {
    lock.releaseLock();
  }
}
```

### 4. **Search Implementation**

Efficient search across multiple fields:

```javascript
function searchData(searchTerm) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(SHEETS.PRIORITIES);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const results = [];
  
  // Define searchable columns
  const searchableColumns = [
    COLUMNS.NAME,
    COLUMNS.DESCRIPTION,
    COLUMNS.LOCATION,
    COLUMNS.CATEGORY
  ];
  
  // Search through data
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    let match = false;
    
    for (const col of searchableColumns) {
      if (row[col] && row[col].toString().toLowerCase()
          .includes(searchTerm.toLowerCase())) {
        match = true;
        break;
      }
    }
    
    if (match) {
      results.push({
        id: row[COLUMNS.ID],
        data: row,
        rowIndex: i + 1
      });
    }
  }
  
  return results;
}
```

## Performance Optimization

### 1. **Batch Operations**

Minimize API calls by batching operations:

```javascript
function updateMultipleRows(updates) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(SHEETS.PRIORITIES);
  
  // Sort updates by row for efficiency
  updates.sort((a, b) => a.row - b.row);
  
  // Group consecutive rows
  const batches = [];
  let currentBatch = null;
  
  updates.forEach(update => {
    if (!currentBatch || update.row !== currentBatch.endRow + 1) {
      currentBatch = {
        startRow: update.row,
        endRow: update.row,
        values: [update.values]
      };
      batches.push(currentBatch);
    } else {
      currentBatch.endRow = update.row;
      currentBatch.values.push(update.values);
    }
  });
  
  // Apply batches
  batches.forEach(batch => {
    const range = sheet.getRange(
      batch.startRow, 
      1, 
      batch.values.length, 
      batch.values[0].length
    );
    range.setValues(batch.values);
  });
}
```

### 2. **Caching Strategy**

Implement client-side caching:

```javascript
// Client-side cache
const DataCache = {
  cache: {},
  ttl: 5 * 60 * 1000, // 5 minutes
  
  set: function(key, data) {
    this.cache[key] = {
      data: data,
      timestamp: Date.now()
    };
  },
  
  get: function(key) {
    const item = this.cache[key];
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      delete this.cache[key];
      return null;
    }
    
    return item.data;
  },
  
  clear: function() {
    this.cache = {};
  }
};

// Use cache before server call
function getData(forceRefresh = false) {
  const cacheKey = 'mainData';
  
  if (!forceRefresh) {
    const cached = DataCache.get(cacheKey);
    if (cached) {
      displayData(cached);
      return;
    }
  }
  
  google.script.run
    .withSuccessHandler(data => {
      DataCache.set(cacheKey, data);
      displayData(data);
    })
    .withFailureHandler(handleError)
    .getDataFromServer();
}
```

### 3. **Lazy Loading**

Load data progressively:

```javascript
function getDataPage(pageNumber, pageSize = 50) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(SHEETS.PRIORITIES);
  
  const startRow = 2 + (pageNumber - 1) * pageSize;
  const numRows = pageSize;
  
  const dataRange = sheet.getRange(
    startRow, 
    1, 
    numRows, 
    sheet.getLastColumn()
  );
  
  const data = dataRange.getValues();
  const totalRows = sheet.getLastRow() - 1;
  const totalPages = Math.ceil(totalRows / pageSize);
  
  return {
    data: data,
    page: pageNumber,
    totalPages: totalPages,
    hasMore: pageNumber < totalPages
  };
}
```

## Security Considerations

### 1. **Authentication**

```javascript
function requireAuth() {
  const email = Session.getActiveUser().getEmail();
  
  if (!email) {
    throw new Error('Authentication required');
  }
  
  // Check if user is authorized
  const authSheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('authorizedUsers');
  const authorizedEmails = authSheet.getRange('A:A').getValues()
    .flat().filter(e => e);
  
  if (!authorizedEmails.includes(email)) {
    throw new Error('Unauthorized access');
  }
  
  return email;
}
```

### 2. **Input Validation**

```javascript
function validateInput(input, rules) {
  const errors = [];
  
  // Required fields
  if (rules.required && !input) {
    errors.push('Field is required');
  }
  
  // Email validation
  if (rules.email && input) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input)) {
      errors.push('Invalid email format');
    }
  }
  
  // Length validation
  if (rules.minLength && input.length < rules.minLength) {
    errors.push(`Minimum length is ${rules.minLength}`);
  }
  
  if (rules.maxLength && input.length > rules.maxLength) {
    errors.push(`Maximum length is ${rules.maxLength}`);
  }
  
  return errors;
}
```

### 3. **Rate Limiting**

```javascript
const RateLimiter = {
  attempts: {},
  maxAttempts: 100,
  windowMs: 60 * 1000, // 1 minute
  
  check: function(userId) {
    const now = Date.now();
    const userAttempts = this.attempts[userId] || [];
    
    // Remove old attempts
    const recentAttempts = userAttempts.filter(
      time => now - time < this.windowMs
    );
    
    if (recentAttempts.length >= this.maxAttempts) {
      throw new Error('Rate limit exceeded. Please try again later.');
    }
    
    // Record new attempt
    recentAttempts.push(now);
    this.attempts[userId] = recentAttempts;
    
    return true;
  }
};
```

## Deployment Considerations

### 1. **Web App Settings**

Configure deployment for optimal performance:

```javascript
// Deployment configuration
const DEPLOYMENT_CONFIG = {
  executeAs: 'USER_ACCESSING', // or 'USER_DEPLOYING'
  access: 'DOMAIN',            // or 'ANYONE', 'MYSELF'
  
  // Custom headers
  headers: {
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff'
  }
};
```

### 2. **Error Handling**

Comprehensive error handling:

```javascript
function handleRequest(request) {
  try {
    // Validate request
    if (!request || !request.action) {
      throw new Error('Invalid request');
    }
    
    // Route to appropriate handler
    switch (request.action) {
      case 'getData':
        return handleGetData(request.params);
      case 'claimItem':
        return handleClaimItem(request.params);
      default:
        throw new Error('Unknown action: ' + request.action);
    }
    
  } catch (error) {
    console.error('Request error:', error);
    
    // Log to spreadsheet
    logError(error, request);
    
    // Return user-friendly error
    return {
      success: false,
      error: sanitizeError(error)
    };
  }
}

function sanitizeError(error) {
  // Don't expose internal details
  const message = error.toString();
  
  if (message.includes('ScriptError')) {
    return 'An internal error occurred';
  }
  
  return message;
}
```

## Next Steps

- Learn about [Spreadsheet as Database](/appsscript/developers/field-coordination-browser/spreadsheet-as-database) patterns
- Explore [Web Deployment](/appsscript/developers/field-coordination-browser/web-deployment) strategies
- Review [Spreadsheet Mapping](/appsscript/developers/spreadsheet-mapping/configuration) techniques