---
layout: default
title: Troubleshooting
---

# Troubleshooting Guide

This guide helps you resolve common issues with the Field Coordination Browser and FieldPlan Analyzer applications.

## Common Issues

### Authentication and Access

#### "You don't have permission to access this app"

**Cause**: Your Google account doesn't have access to the web app.

**Solutions**:
1. Contact your administrator to grant access
2. Ensure you're logged into the correct Google account
3. Clear browser cache and cookies, then try again
4. Try accessing in an incognito/private browser window

#### "Authorization required" error

**Cause**: The script needs permissions to access Google services.

**Solutions**:
1. Click "Review Permissions" when prompted
2. Sign in with your Google account
3. Click "Advanced" → "Go to [App Name] (unsafe)"
4. Review and accept the required permissions

### Field Coordination Browser Issues

#### Search returns no results

**Possible causes and solutions**:

1. **Empty search index**
   - Check if data exists in the main spreadsheet
   - Verify the search configuration sheet is set up correctly
   
2. **Case sensitivity**
   - Try searching with different case combinations
   - Check if the search is case-sensitive in the code

3. **Special characters**
   - Remove special characters from search terms
   - Try searching for partial terms

#### Claims not working

**Error: "Item already claimed"**

**Solutions**:
1. Refresh the page to see updated claim status
2. Check if someone else claimed it simultaneously
3. Verify your email is properly configured

**Error: "Failed to claim item"**

**Solutions**:
1. Check your internet connection
2. Verify you have edit permissions on the spreadsheet
3. Look for any lock conflicts in the Apps Script editor

#### Page loads slowly

**Solutions**:
1. **Optimize data loading**
   - Implement pagination for large datasets
   - Load only necessary columns
   - Cache frequently accessed data

2. **Check spreadsheet size**
   - Remove unnecessary historical data
   - Archive old records to a separate sheet
   - Limit the number of formulas in the spreadsheet

### FieldPlan Analyzer Issues

#### Emails not being sent

**Common causes**:

1. **Email quota exceeded**
   ```
   Error: Service invoked too many times for one day: email
   ```
   **Solution**: Google has daily email limits. Wait 24 hours or upgrade to Google Workspace.

2. **Invalid email addresses**
   - Check for typos in recipient emails
   - Verify email format is correct
   - Remove any extra spaces or special characters

3. **Script not authorized**
   - Re-authorize the script with Gmail permissions
   - Check Apps Script project OAuth scopes

#### Analysis not running automatically

**Troubleshooting steps**:

1. **Check triggers**
   - Go to Apps Script Editor → Triggers
   - Verify triggers are enabled and not failing
   - Check trigger execution history

2. **Review logs**
   ```javascript
   // Add this function to check recent executions
   function checkTriggerLogs() {
     const logs = SpreadsheetApp.getActiveSpreadsheet()
       .getSheetByName('timer_logs');
     
     if (logs) {
       const recentLogs = logs.getRange(
         logs.getLastRow() - 9, 1, 10, 5
       ).getValues();
       
       console.log('Recent trigger executions:');
       recentLogs.forEach(log => console.log(log));
     }
   }
   ```

3. **Verify state management**
   - Check Script Properties for last processed rows
   - Reset state if necessary:
   ```javascript
   function resetProcessingState() {
     PropertiesService.getScriptProperties().deleteAllProperties();
     console.log('Processing state reset');
   }
   ```

#### Budget analysis errors

**"Cannot find matching field plan"**

**Solutions**:
1. Verify organization names match exactly
2. Check for extra spaces or special characters
3. Ensure field plan was submitted and processed

**"Invalid budget data"**

**Solutions**:
1. Check for missing required fields
2. Verify numeric fields contain valid numbers
3. Remove any formula errors in the spreadsheet

### Google Apps Script Execution Logger

#### Understanding the Execution Logger

The Apps Script editor provides detailed execution logs:

1. **Access the logger**
   - Open Apps Script editor
   - Click "Executions" in the left sidebar
   - Select a function execution to see details

2. **Log levels**
   - `console.log()`: General information
   - `console.error()`: Error messages
   - `console.warn()`: Warnings
   - `console.time()/timeEnd()`: Performance timing

3. **Common log messages**

   **Successful execution**:
   ```
   [timestamp] Starting budget analysis...
   [timestamp] Found 5 pending budgets
   [timestamp] Analysis complete: {analyzed: 3, errors: 0, missingFieldPlans: 2}
   ```

   **Error execution**:
   ```
   [timestamp] Error in analyzeBudgets: TypeError: Cannot read property 'length' of undefined
   [timestamp] Stack trace: at analyzeBudgets (Code:45:15)
   ```

#### Debugging with logs

Add detailed logging to troubleshoot:

```javascript
function debugAnalysis() {
  console.log('=== Debug Analysis Started ===');
  
  try {
    // Log environment
    console.log('User:', Session.getActiveUser().getEmail());
    console.log('Spreadsheet:', SpreadsheetApp.getActiveSpreadsheet().getName());
    
    // Check data
    const sheet = SpreadsheetApp.getActiveSheet();
    console.log('Active sheet:', sheet.getName());
    console.log('Last row:', sheet.getLastRow());
    console.log('Last column:', sheet.getLastColumn());
    
    // Test specific function
    const testData = sheet.getRange('A2:Z2').getValues()[0];
    console.log('Test row data:', testData);
    
    // Process with detailed logging
    const budget = FieldBudget.fromRow(testData);
    console.log('Parsed budget:', {
      organization: budget.organization,
      email: budget.email,
      totalRequest: budget.totalRequest
    });
    
  } catch (error) {
    console.error('Debug failed:', error);
    console.error('Stack trace:', error.stack);
  }
  
  console.log('=== Debug Analysis Complete ===');
}
```

### Performance Issues

#### Script running slowly

**Solutions**:

1. **Batch operations**
   ```javascript
   // Instead of this (slow):
   for (let i = 0; i < 100; i++) {
     sheet.getRange(i + 1, 1).setValue(data[i]);
   }
   
   // Do this (fast):
   const values = data.map(item => [item]);
   sheet.getRange(1, 1, values.length, 1).setValues(values);
   ```

2. **Minimize API calls**
   - Cache spreadsheet data in variables
   - Use batch gets/sets for ranges
   - Avoid repeated calls to getRange()

3. **Implement pagination**
   ```javascript
   function loadDataWithPagination(page = 1, pageSize = 50) {
     const startRow = (page - 1) * pageSize + 2; // Skip header
     const sheet = SpreadsheetApp.getActiveSheet();
     
     return sheet.getRange(
       startRow, 1, pageSize, sheet.getLastColumn()
     ).getValues();
   }
   ```

#### "Exceeded maximum execution time"

Apps Script has a 6-minute execution limit. Solutions:

1. **Break into smaller chunks**
   ```javascript
   function processLargeDataset() {
     const BATCH_SIZE = 100;
     const props = PropertiesService.getScriptProperties();
     const startIndex = parseInt(props.getProperty('PROCESS_INDEX') || '0');
     
     const data = getAllData();
     const endIndex = Math.min(startIndex + BATCH_SIZE, data.length);
     
     // Process batch
     for (let i = startIndex; i < endIndex; i++) {
       processItem(data[i]);
     }
     
     if (endIndex < data.length) {
       // Save progress and create trigger for next batch
       props.setProperty('PROCESS_INDEX', endIndex.toString());
       
       ScriptApp.newTrigger('processLargeDataset')
         .timeBased()
         .after(1000) // 1 second
         .create();
     } else {
       // Cleanup
       props.deleteProperty('PROCESS_INDEX');
     }
   }
   ```

2. **Use time-based triggers**
   - Split processing across multiple executions
   - Save state between runs
   - Use Properties Service for checkpointing

### Data Issues

#### Spreadsheet formulas causing errors

**Solutions**:
1. Replace volatile formulas with static values where possible
2. Use Apps Script to calculate instead of spreadsheet formulas
3. Limit the use of IMPORTRANGE and other external data functions

#### Data validation failures

**Common validation issues**:

1. **Email validation**
   ```javascript
   function validateEmail(email) {
     const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
     
     if (!regex.test(email)) {
       console.error('Invalid email:', email);
       return false;
     }
     
     return true;
   }
   ```

2. **Number parsing**
   ```javascript
   function parseNumber(value) {
     // Handle various formats
     if (!value) return 0;
     
     const cleaned = value.toString()
       .replace(/[$,]/g, '') // Remove currency symbols
       .replace(/[^\d.-]/g, '') // Keep only digits, dots, and minus
       .trim();
     
     const num = parseFloat(cleaned);
     
     if (isNaN(num)) {
       console.warn('Failed to parse number:', value);
       return 0;
     }
     
     return num;
   }
   ```

### Error Recovery

#### Implementing error recovery

```javascript
function robustProcess() {
  const errors = [];
  const processed = [];
  
  const items = getItemsToProcess();
  
  items.forEach((item, index) => {
    try {
      const result = processItem(item);
      processed.push(result);
      
    } catch (error) {
      console.error(`Error processing item ${index}:`, error);
      
      errors.push({
        item: item,
        index: index,
        error: error.toString(),
        timestamp: new Date()
      });
      
      // Continue processing other items
    }
  });
  
  // Log errors for review
  if (errors.length > 0) {
    logErrors(errors);
    notifyAdminOfErrors(errors);
  }
  
  return {
    successful: processed.length,
    failed: errors.length,
    errors: errors
  };
}

function logErrors(errors) {
  const errorSheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('error_log') || createErrorLogSheet();
  
  const rows = errors.map(e => [
    e.timestamp,
    e.index,
    JSON.stringify(e.item),
    e.error
  ]);
  
  errorSheet.getRange(
    errorSheet.getLastRow() + 1, 
    1, 
    rows.length, 
    4
  ).setValues(rows);
}
```

## Getting Help

### Before asking for help

1. **Check the logs**
   - Review Apps Script execution logs
   - Look for error messages and stack traces
   - Note the timestamp of the error

2. **Isolate the problem**
   - Test with a small dataset
   - Try manual execution vs triggered
   - Check if the issue is consistent

3. **Gather information**
   - Error messages (exact text)
   - Steps to reproduce
   - Recent changes made
   - Browser and OS information

### Contacting support

When reporting issues, include:

1. **Error details**
   ```
   Error message: [exact error text]
   Function name: [where error occurred]
   Timestamp: [when it happened]
   User affected: [email]
   ```

2. **Context**
   - What were you trying to do?
   - Has this worked before?
   - Any recent changes?

3. **Screenshots**
   - Error messages
   - Execution logs
   - Relevant spreadsheet data (sanitized)

### Self-service resources

1. **Google Apps Script Documentation**
   - [Official Documentation](https://developers.google.com/apps-script)
   - [Stack Overflow - Apps Script](https://stackoverflow.com/questions/tagged/google-apps-script)
   - [Google Apps Script Community](https://groups.google.com/g/google-apps-script-community)

2. **This documentation**
   - Review relevant sections
   - Check code examples
   - Follow best practices

3. **Test environment**
   - Create a copy of the spreadsheet
   - Test changes in isolation
   - Use console.log() liberally

Remember: Most issues can be resolved by carefully reading error messages and checking logs!