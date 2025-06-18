---
layout: default
title: Field Coordination Browser - Architecture
---

# Field Coordination Browser Architecture

The Field Coordination Browser is a precinct claim management system built with Google Apps Script, using Google Sheets as the backend database.

## Architecture Overview

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Web Browser   │────▶│  Apps Script     │────▶│ Google Sheets   │
│  (Client-side)  │◀────│  (Server-side)   │◀────│   (Database)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
        │                         │                         │
        │                         │                         │
    HTML Interface         Basic Logic            Data Storage
    Form Submission        Claim Processing      Precinct Data
    Manual Refresh         Conflict Check        Claim Records
```

## Core Components

### 1. **Server-Side (server-side.js)**

The server-side code handles basic claim processing:

```javascript
// Main entry point for web app
function doGet() {
  return HtmlService.createTemplateFromFile('index')
    .evaluate()
    .setTitle('Alabama Forward Field Coordination 2025')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

// Include CSS and JavaScript files
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
```

### 2. **Client-Side Components**

The interface consists of three files:

- **index.html**: Main HTML structure with search form and results table
- **styles.html**: CSS styling for visual appearance
- **client-side.html**: JavaScript for form handling and UI updates

### 3. **Data Layer**

The application uses these Google Sheets:

```javascript
// Actual sheets used (from script properties or defaults)
const SHEETS = {
  PRIORITIES: 'priorities',           // Master precinct list
  SEARCH: 'search',                  // Search results
  ORG_CONTACTS: 'orgContacts',       // Organization list
  USER_SELECTIONS: 'userSelections'  // Active selections
};
```

## Actual Implementation Details

### 1. **Search Functionality**

The search is basic and only searches by precinct number:

```javascript
function performSearch(county, precinctName, precinctNumber) {
  const searchSheet = ss.getSheetByName(searchSheetName);
  
  // Clear previous results
  searchSheet.getRange('A7:J282').clearContent();
  
  // Set search criteria
  if (county) searchSheet.getRange('B3').setValue(county);
  if (precinctName) searchSheet.getRange('B4').setValue(precinctName);
  if (precinctNumber) searchSheet.getRange('B5').setValue(precinctNumber);
  
  // Force recalculation
  SpreadsheetApp.flush();
  
  // Get filtered results
  const results = searchSheet.getRange('A7:J282').getValues();
  return results.filter(row => row[0]); // Non-empty rows
}
```

### 2. **Claim Processing**

Claims are processed without any locking mechanism:

```javascript
function submitClaim(precinctDetails, selectedOrg, claimType) {
  const prioritiesSheet = ss.getSheetByName(prioritiesSheetName);
  const data = prioritiesSheet.getDataRange().getValues();
  
  // Find the precinct row
  for (let i = 1; i < data.length; i++) {
    if (data[i][2] == precinctNumber) {
      // Check for existing claims
      const firstClaim = data[i][13];
      const secondClaim = data[i][15];
      
      // Validate claim
      if (claimType === 'first' && firstClaim) {
        return { success: false, message: 'Already claimed' };
      }
      
      // Make the claim
      const claimColumn = claimType === 'first' ? 14 : 16;
      const timeColumn = claimType === 'first' ? 15 : 17;
      
      prioritiesSheet.getRange(i + 1, claimColumn).setValue(selectedOrg);
      prioritiesSheet.getRange(i + 1, timeColumn).setValue(new Date());
      
      return { success: true };
    }
  }
}
```

### 3. **Conflict Prevention**

Basic conflict prevention using userSelections sheet:

```javascript
function recordUserSelection(precinctId, organization, claimType) {
  const selectionsSheet = ss.getSheetByName(userSelectionsSheetName);
  
  // Add selection with timestamp
  selectionsSheet.appendRow([
    Session.getActiveUser().getEmail(),
    precinctId,
    organization,
    claimType,
    new Date()
  ]);
  
  // Clean old selections (> 5 minutes)
  const now = new Date();
  const data = selectionsSheet.getDataRange().getValues();
  
  for (let i = data.length - 1; i > 0; i--) {
    const selectionTime = data[i][4];
    if (now - selectionTime > 300000) { // 5 minutes
      selectionsSheet.deleteRow(i + 1);
    }
  }
}
```

### 4. **Email Notifications**

The application sends confirmation emails when claims are made:

```javascript
function sendConfirmationEmail(precinctDetails, selectedOrg, claimType) {
  const recipients = PropertiesService.getScriptProperties()
    .getProperty('EMAIL_RECIPIENTS') || 'datateam@alforward.org,sherri@alforward.org';
  
  const userEmail = Session.getActiveUser().getEmail();
  const allRecipients = recipients + ',' + userEmail;
  
  // Get other organization's email if applicable
  const otherOrgEmail = getEmailForOrganization(otherOrgName);
  if (otherOrgEmail) {
    allRecipients += ',' + otherOrgEmail;
  }
  
  const subject = `Precinct Claim Confirmation - ${precinctDetails.county} ${precinctDetails.precinctName}`;
  
  // HTML email body with styling
  const htmlBody = generateEmailHTML(precinctDetails, selectedOrg, claimType);
  const plainBody = generatePlainTextEmail(precinctDetails, selectedOrg, claimType);
  
  MailApp.sendEmail({
    to: allRecipients,
    subject: subject,
    body: plainBody,
    htmlBody: htmlBody
  });
}

function getEmailForOrganization(orgName) {
  const orgSheet = ss.getSheetByName(orgContactsSheetName);
  const data = orgSheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === orgName) {
      return data[i][1]; // Email in column B
    }
  }
  return null;
}
```

Email recipients include:
- Configured administrators (datateam@alforward.org, sherri@alforward.org)
- The user making the claim
- Other organizations that have claimed the same precinct

## Key Limitations

### 1. **No Real-Time Updates**
- Users must manually refresh to see changes
- No WebSocket or push notifications
- No automatic polling mechanism

### 2. **Basic Search**
- Only searches by precinct number
- No multi-field search
- No advanced filtering

### 3. **No Session Management**
- Relies solely on Google authentication
- No activity tracking
- No user preferences

### 4. **Race Conditions**
- No LockService implementation
- Possible simultaneous claims
- No transaction support

## Security Considerations

### Current Security
- Google account authentication only
- Spreadsheet sharing permissions
- No additional validation

### Missing Security Features
- No input validation
- No rate limiting
- No audit logging
- No error sanitization

## Performance Characteristics

### Current Implementation
- Loads all data at once (up to 282 rows)
- No pagination
- No caching
- Manual refresh required

### Performance Issues
- All operations require full sheet reads
- No batch operations
- No lazy loading
- Limited to ~280 rows hardcoded

## Deployment Configuration

### Web App Settings
```javascript
// Current deployment approach
- Execute as: User accessing the web app
- Access: Anyone (or restricted by domain)
- No custom headers or security settings
```

### Required Script Properties
```
SPREADSHEET_ID - ID of the Google Sheet
EMAIL_RECIPIENTS - Comma-separated emails (not used)
SHEET_PRIORITIES - Name of priorities sheet
SHEET_SEARCH - Name of search sheet
SHEET_ORG_CONTACTS - Name of organizations sheet
SHEET_USER_SELECTIONS - Name of selections sheet
```

## Development Considerations

### Current State
1. **BigQuery Integration** - Code exists in /developing but not integrated
2. **Email Notifications** - Referenced in UI but not implemented
3. **Advanced Features** - Many planned features not implemented

### Code Organization
```
field_coordination_browser/
├── src/
│   ├── appsscript.json      # Manifest file
│   ├── server-side.js       # Server logic
│   ├── index.html           # Main HTML
│   ├── client-side.html     # Client JavaScript
│   └── styles.html          # CSS styles
└── developing/
    └── bigquery-integration.js  # Future features
```

## Testing Approach

### Manual Testing
- Use Script Editor's test functions
- Deploy as test deployment
- Check claim functionality
- Verify search results

### No Automated Tests
- No unit tests
- No integration tests
- Manual verification only

## Next Steps

For developers looking to enhance this application:

1. **Add Real Functionality**
   - Implement email notifications
   - Add real-time updates
   - Improve search capabilities

2. **Improve Architecture**
   - Add proper locking
   - Implement caching
   - Add error handling

3. **Enhance Security**
   - Add input validation
   - Implement rate limiting
   - Add audit logging

## Related Documentation

- Learn about [Spreadsheet as Database](/appsscript/developers/field-coordination-browser/spreadsheet-as-database) patterns
- Explore [Web Deployment](/appsscript/developers/field-coordination-browser/web-deployment) strategies
- Review [Spreadsheet Mapping](/appsscript/developers/spreadsheet-mapping/configuration) techniques