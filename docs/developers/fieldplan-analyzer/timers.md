---
layout: default
title: Timer Implementation - FieldPlan Analyzer
---

# Timer Implementation in Apps Script

Learn how to implement automated, time-based execution in Google Apps Script for regular data processing and analysis.

## Timer Architecture

### 1. **Types of Triggers**

Apps Script supports several trigger types:

```javascript
// Time-based triggers
function setupTimers() {
  // Every N minutes (1, 5, 10, 15, or 30)
  ScriptApp.newTrigger('processDataEvery5Minutes')
    .timeBased()
    .everyMinutes(5)
    .create();
  
  // Every N hours (1, 2, 4, 6, 8, or 12)
  ScriptApp.newTrigger('checkForNewRows')
    .timeBased()
    .everyHours(12)
    .create();
  
  // Daily at specific time
  ScriptApp.newTrigger('dailyReport')
    .timeBased()
    .atHour(9) // 9 AM
    .everyDays(1)
    .create();
  
  // Weekly on specific day
  ScriptApp.newTrigger('weeklyAnalysis')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(9)
    .create();
  
  // Monthly on specific date
  ScriptApp.newTrigger('monthlyCleanup')
    .timeBased()
    .onMonthDay(1) // First of month
    .atHour(2) // 2 AM
    .create();
}
```

### 2. **State Management**

Track processing state between trigger runs:

```javascript
class TriggerStateManager {
  static getLastProcessed(key) {
    const props = PropertiesService.getScriptProperties();
    const value = props.getProperty(key);
    
    if (!value) return null;
    
    try {
      return JSON.parse(value);
    } catch (e) {
      return value; // Return as string if not JSON
    }
  }
  
  static setLastProcessed(key, value) {
    const props = PropertiesService.getScriptProperties();
    const storedValue = typeof value === 'object' 
      ? JSON.stringify(value) 
      : String(value);
    
    props.setProperty(key, storedValue);
  }
  
  static getProcessingState() {
    return {
      lastBudgetRow: this.getLastProcessed('LAST_BUDGET_ROW') || 1,
      lastFieldPlanRow: this.getLastProcessed('LAST_FIELD_PLAN_ROW') || 1,
      lastAnalysisTime: this.getLastProcessed('LAST_ANALYSIS_TIME'),
      processingQueue: this.getLastProcessed('PROCESSING_QUEUE') || []
    };
  }
  
  static updateProcessingState(updates) {
    Object.entries(updates).forEach(([key, value]) => {
      this.setLastProcessed(key, value);
    });
  }
}
```

## Core Timer Functions

### 1. **Check for New Rows**

```javascript
function checkForNewRows() {
  const lock = LockService.getScriptLock();
  
  try {
    // Prevent concurrent executions
    lock.waitLock(30000); // 30 seconds
    
    console.log('Starting new row check...');
    
    // Get current state
    const state = TriggerStateManager.getProcessingState();
    
    // Check field plans
    const newFieldPlans = checkNewFieldPlans(state.lastFieldPlanRow);
    
    // Check budgets
    const newBudgets = checkNewBudgets(state.lastBudgetRow);
    
    // Process new items
    if (newFieldPlans.length > 0 || newBudgets.length > 0) {
      processNewItems(newFieldPlans, newBudgets);
    }
    
    // Update state
    TriggerStateManager.updateProcessingState({
      LAST_FIELD_PLAN_ROW: getLastRowNumber('2025_field_plan'),
      LAST_BUDGET_ROW: getLastRowNumber('2025_field_budget'),
      LAST_ANALYSIS_TIME: new Date().toISOString()
    });
    
    console.log(`Processed ${newFieldPlans.length} field plans, ${newBudgets.length} budgets`);
    
  } catch (error) {
    console.error('Error in checkForNewRows:', error);
    notifyError('checkForNewRows', error);
  } finally {
    lock.releaseLock();
  }
}

function checkNewFieldPlans(lastProcessedRow) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('2025_field_plan');
  const lastRow = sheet.getLastRow();
  
  if (lastRow <= lastProcessedRow) {
    return []; // No new rows
  }
  
  const newRows = [];
  const numNewRows = lastRow - lastProcessedRow;
  
  // Get new row data
  const data = sheet.getRange(
    lastProcessedRow + 1, 
    1, 
    numNewRows, 
    sheet.getLastColumn()
  ).getValues();
  
  data.forEach((row, index) => {
    const rowNum = lastProcessedRow + index + 1;
    
    // Skip if already processed
    if (row[FieldPlanParent.COLUMNS.PROCESSED - 1] === 'Yes') {
      return;
    }
    
    const fieldPlan = FieldPlanFactory.create(row);
    fieldPlan.rowIndex = rowNum;
    
    newRows.push(fieldPlan);
  });
  
  return newRows;
}
```

### 2. **Analyze Budgets Timer**

```javascript
function analyzeBudgets() {
  const lock = LockService.getScriptLock();
  
  try {
    lock.waitLock(30000);
    
    console.log('Starting budget analysis...');
    
    // Get pending budgets
    const pendingBudgets = FieldBudget.getAllPending();
    
    if (pendingBudgets.length === 0) {
      console.log('No pending budgets to analyze');
      return;
    }
    
    // Process each budget
    const results = {
      analyzed: 0,
      errors: 0,
      missingFieldPlans: 0
    };
    
    pendingBudgets.forEach(budget => {
      try {
        const result = analyzeSingleBudget(budget);
        
        if (result.success) {
          results.analyzed++;
        } else if (result.missingFieldPlan) {
          results.missingFieldPlans++;
          checkMissingFieldPlanAlert(budget);
        } else {
          results.errors++;
        }
        
      } catch (error) {
        console.error(`Error analyzing budget for ${budget.organization}:`, error);
        results.errors++;
      }
    });
    
    // Log results
    console.log('Budget analysis complete:', results);
    
    // Update tracking
    updateAnalysisTracking(results);
    
  } catch (error) {
    console.error('Error in analyzeBudgets:', error);
    notifyError('analyzeBudgets', error);
  } finally {
    lock.releaseLock();
  }
}

function analyzeSingleBudget(budget) {
  // Look for matching field plan
  const fieldPlan = findMatchingFieldPlan(budget);
  
  if (!fieldPlan) {
    return { 
      success: false, 
      missingFieldPlan: true,
      budget: budget
    };
  }
  
  // Perform analysis
  const analyzer = new BudgetAnalyzer(new CostPerAttemptStrategy());
  const analysis = analyzer.analyze(budget, fieldPlan);
  
  // Generate and send email
  const emailBody = budget.generateEmailBody(fieldPlan, analysis);
  sendAnalysisEmail(budget, emailBody);
  
  // Mark as analyzed
  budget.markAsAnalyzed();
  
  return { 
    success: true, 
    budget: budget,
    analysis: analysis
  };
}
```

### 3. **Weekly Summary Timer**

```javascript
function generateWeeklySummary() {
  try {
    console.log('Generating weekly summary...');
    
    const summary = collectWeeklySummaryData();
    const emailBody = formatWeeklySummary(summary);
    
    // Send summary email
    MailApp.sendEmail({
      to: getConfiguredRecipients('WEEKLY_SUMMARY'),
      subject: `Weekly Analysis Summary - ${formatDate(new Date())}`,
      htmlBody: emailBody
    });
    
    // Archive summary data
    archiveWeeklySummary(summary);
    
    console.log('Weekly summary sent successfully');
    
  } catch (error) {
    console.error('Error generating weekly summary:', error);
    notifyError('generateWeeklySummary', error);
  }
}

function collectWeeklySummaryData() {
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  
  return {
    period: {
      start: oneWeekAgo,
      end: new Date()
    },
    budgets: {
      analyzed: countAnalyzedBudgets(oneWeekAgo),
      pending: countPendingBudgets(),
      total: countTotalBudgets()
    },
    fieldPlans: {
      submitted: countSubmittedFieldPlans(oneWeekAgo),
      processed: countProcessedFieldPlans(oneWeekAgo)
    },
    metrics: {
      averageConfidence: calculateAverageConfidence(oneWeekAgo),
      totalRequested: calculateTotalRequested(oneWeekAgo),
      totalGap: calculateTotalGap(oneWeekAgo)
    },
    alerts: {
      missingFieldPlans: getMissingFieldPlanAlerts(),
      lowConfidence: getLowConfidenceAlerts()
    }
  };
}

function formatWeeklySummary(summary) {
  return `
    <h2>Weekly Budget Analysis Summary</h2>
    <p>Report Period: ${formatDate(summary.period.start)} - ${formatDate(summary.period.end)}</p>
    
    <h3>Budget Analysis Status</h3>
    <ul>
      <li>Budgets Analyzed This Week: ${summary.budgets.analyzed}</li>
      <li>Budgets Pending Analysis: ${summary.budgets.pending}</li>
      <li>Total Budgets: ${summary.budgets.total}</li>
    </ul>
    
    <h3>Field Plan Submissions</h3>
    <ul>
      <li>New Submissions: ${summary.fieldPlans.submitted}</li>
      <li>Processed: ${summary.fieldPlans.processed}</li>
    </ul>
    
    <h3>Key Metrics</h3>
    <ul>
      <li>Average Confidence Level: ${summary.metrics.averageConfidence.toFixed(1)}/10</li>
      <li>Total Funding Requested: $${formatCurrency(summary.metrics.totalRequested)}</li>
      <li>Total Funding Gap: $${formatCurrency(summary.metrics.totalGap)}</li>
    </ul>
    
    ${formatAlerts(summary.alerts)}
  `;
}
```

## Advanced Timer Patterns

### 1. **Retry Logic**

```javascript
class RetryableTimer {
  static async executeWithRetry(fn, maxRetries = 3, delay = 1000) {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        console.error(`Attempt ${attempt} failed:`, error);
        
        if (attempt < maxRetries) {
          // Exponential backoff
          const waitTime = delay * Math.pow(2, attempt - 1);
          Utilities.sleep(waitTime);
        }
      }
    }
    
    throw new Error(`Failed after ${maxRetries} attempts: ${lastError}`);
  }
}

// Usage in timer
function robustTimerFunction() {
  RetryableTimer.executeWithRetry(() => {
    // Your timer logic here
    processDataBatch();
  }, 3, 2000);
}
```

### 2. **Batch Processing**

```javascript
class BatchProcessor {
  constructor(batchSize = 50) {
    this.batchSize = batchSize;
  }
  
  processBatches(items, processFunction) {
    const results = [];
    const errors = [];
    
    for (let i = 0; i < items.length; i += this.batchSize) {
      const batch = items.slice(i, i + this.batchSize);
      
      console.log(`Processing batch ${i / this.batchSize + 1} of ${Math.ceil(items.length / this.batchSize)}`);
      
      batch.forEach(item => {
        try {
          const result = processFunction(item);
          results.push(result);
        } catch (error) {
          errors.push({ item, error });
        }
      });
      
      // Prevent timeout
      if (this.shouldYield()) {
        this.saveProgress(i + batch.length);
        throw new Error('Execution time limit approaching');
      }
    }
    
    return { results, errors };
  }
  
  shouldYield() {
    // Check if we're approaching the 6-minute limit
    const maxRuntime = 5.5 * 60 * 1000; // 5.5 minutes
    const currentRuntime = Date.now() - this.startTime;
    return currentRuntime > maxRuntime;
  }
  
  saveProgress(lastProcessedIndex) {
    PropertiesService.getScriptProperties()
      .setProperty('BATCH_PROGRESS', String(lastProcessedIndex));
  }
}
```

### 3. **Monitoring and Alerting**

```javascript
class TimerMonitor {
  static logExecution(functionName, status, details = {}) {
    const logSheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName('timer_logs') || this.createLogSheet();
    
    logSheet.appendRow([
      new Date(),
      functionName,
      status,
      JSON.stringify(details),
      Session.getActiveUser().getEmail()
    ]);
    
    // Clean old logs
    this.cleanOldLogs(logSheet);
  }
  
  static createLogSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = ss.insertSheet('timer_logs');
    
    sheet.getRange(1, 1, 1, 5)
      .setValues([['Timestamp', 'Function', 'Status', 'Details', 'User']])
      .setFontWeight('bold');
    
    return sheet;
  }
  
  static cleanOldLogs(sheet, daysToKeep = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const data = sheet.getDataRange().getValues();
    let rowsToDelete = 0;
    
    // Find rows older than cutoff
    for (let i = 1; i < data.length; i++) {
      const timestamp = data[i][0];
      if (timestamp < cutoffDate) {
        rowsToDelete++;
      } else {
        break; // Logs are chronological
      }
    }
    
    // Delete old rows
    if (rowsToDelete > 0) {
      sheet.deleteRows(2, rowsToDelete);
    }
  }
  
  static checkHealth() {
    const props = PropertiesService.getScriptProperties();
    const lastRun = props.getProperty('LAST_TIMER_RUN');
    
    if (!lastRun) return;
    
    const lastRunTime = new Date(lastRun);
    const hoursSinceRun = (Date.now() - lastRunTime) / (1000 * 60 * 60);
    
    // Alert if timer hasn't run in expected interval
    if (hoursSinceRun > 13) { // Expected to run every 12 hours
      this.sendHealthAlert(`Timer has not run for ${hoursSinceRun.toFixed(1)} hours`);
    }
  }
  
  static sendHealthAlert(message) {
    MailApp.sendEmail({
      to: getConfiguredRecipients('ADMIN_EMAIL'),
      subject: 'Timer Health Alert',
      body: `Timer health check failed:\n\n${message}\n\nPlease check the system.`
    });
  }
}

// Wrapper for all timer functions
function timerWrapper(functionName, fn) {
  return function() {
    const startTime = Date.now();
    
    try {
      TimerMonitor.logExecution(functionName, 'started');
      
      const result = fn();
      
      const duration = Date.now() - startTime;
      TimerMonitor.logExecution(functionName, 'completed', {
        duration: duration,
        result: result
      });
      
      // Update last run time
      PropertiesService.getScriptProperties()
        .setProperty('LAST_TIMER_RUN', new Date().toISOString());
      
      return result;
      
    } catch (error) {
      const duration = Date.now() - startTime;
      
      TimerMonitor.logExecution(functionName, 'failed', {
        duration: duration,
        error: error.toString()
      });
      
      throw error;
    }
  };
}

// Wrap timer functions
const monitoredCheckForNewRows = timerWrapper('checkForNewRows', checkForNewRows);
const monitoredAnalyzeBudgets = timerWrapper('analyzeBudgets', analyzeBudgets);
```

## Timer Configuration Best Practices

### 1. **Optimal Scheduling**

```javascript
function optimizeTimerSchedule() {
  // Remove all existing triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
  
  // Set up optimized schedule
  
  // High-frequency check during business hours
  ScriptApp.newTrigger('checkForNewRowsBusinessHours')
    .timeBased()
    .everyHours(1)
    .create();
  
  // Less frequent overnight
  ScriptApp.newTrigger('checkForNewRowsOvernight')
    .timeBased()
    .atHour(2)
    .everyDays(1)
    .create();
  
  // Analysis after data collection
  ScriptApp.newTrigger('analyzeBudgets')
    .timeBased()
    .atHour(10)
    .everyDays(1)
    .create();
  
  ScriptApp.newTrigger('analyzeBudgets')
    .timeBased()
    .atHour(16)
    .everyDays(1)
    .create();
  
  // Weekly summary on Monday morning
  ScriptApp.newTrigger('generateWeeklySummary')
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(9)
    .create();
}
```

### 2. **Missing Field Plan Alerts**

```javascript
function checkMissingFieldPlanAlert(budget) {
  const props = PropertiesService.getScriptProperties();
  const alertKey = `MISSING_FP_${budget.organization}`;
  const lastAlert = props.getProperty(alertKey);
  
  if (lastAlert) {
    const lastAlertTime = new Date(lastAlert);
    const hoursSinceAlert = (Date.now() - lastAlertTime) / (1000 * 60 * 60);
    
    // Only alert once per 72 hours
    if (hoursSinceAlert < 72) {
      return;
    }
  }
  
  // Check how long budget has been waiting
  const budgetAge = Date.now() - new Date(budget.timestamp);
  const daysWaiting = budgetAge / (1000 * 60 * 60 * 24);
  
  if (daysWaiting >= 3) {
    sendMissingFieldPlanAlert(budget);
    props.setProperty(alertKey, new Date().toISOString());
  }
}

function sendMissingFieldPlanAlert(budget) {
  const emailBody = `
    <h2>Missing Field Plan Alert</h2>
    <p><strong>Organization:</strong> ${budget.organization}</p>
    <p><strong>Contact:</strong> ${budget.firstName} ${budget.lastName}</p>
    <p><strong>Email:</strong> ${budget.email}</p>
    <p><strong>Budget Submitted:</strong> ${formatDate(budget.timestamp)}</p>
    <p><strong>Days Waiting:</strong> ${Math.floor((Date.now() - new Date(budget.timestamp)) / (1000 * 60 * 60 * 24))}</p>
    
    <p>This organization submitted a budget but has not yet submitted a corresponding field plan. 
    Please follow up to request the field plan submission.</p>
  `;
  
  MailApp.sendEmail({
    to: getConfiguredRecipients('MISSING_FP_ALERTS'),
    subject: `Missing Field Plan: ${budget.organization}`,
    htmlBody: emailBody
  });
}
```

## Debugging Timers

### 1. **Manual Testing**

```javascript
// Test functions that simulate timer behavior
function testCheckForNewRows() {
  // Save current state
  const savedState = TriggerStateManager.getProcessingState();
  
  try {
    // Set test state
    TriggerStateManager.updateProcessingState({
      LAST_FIELD_PLAN_ROW: 10, // Force processing from row 11
      LAST_BUDGET_ROW: 20
    });
    
    // Run function
    checkForNewRows();
    
    console.log('Test completed successfully');
    
  } finally {
    // Restore state
    TriggerStateManager.updateProcessingState(savedState);
  }
}

// Debug logger
function debugLog(message, data = null) {
  const debugSheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName('debug_log') || createDebugSheet();
  
  debugSheet.appendRow([
    new Date(),
    message,
    data ? JSON.stringify(data) : '',
    new Error().stack
  ]);
}
```

### 2. **Performance Monitoring**

```javascript
class PerformanceMonitor {
  constructor(name) {
    this.name = name;
    this.startTime = Date.now();
    this.checkpoints = [];
  }
  
  checkpoint(label) {
    const elapsed = Date.now() - this.startTime;
    this.checkpoints.push({ label, elapsed });
    console.log(`${this.name} - ${label}: ${elapsed}ms`);
  }
  
  end() {
    const totalTime = Date.now() - this.startTime;
    
    console.log(`${this.name} completed in ${totalTime}ms`);
    console.log('Checkpoints:', this.checkpoints);
    
    // Log if too slow
    if (totalTime > 30000) { // 30 seconds
      this.logSlowExecution(totalTime);
    }
    
    return totalTime;
  }
  
  logSlowExecution(totalTime) {
    const details = {
      function: this.name,
      totalTime: totalTime,
      checkpoints: this.checkpoints,
      timestamp: new Date()
    };
    
    // Log to sheet or send alert
    console.warn('Slow execution detected:', details);
  }
}

// Usage
function monitoredFunction() {
  const monitor = new PerformanceMonitor('analyzeBudgets');
  
  monitor.checkpoint('Started');
  
  const budgets = FieldBudget.getAllPending();
  monitor.checkpoint('Loaded budgets');
  
  budgets.forEach(budget => {
    processBudget(budget);
  });
  monitor.checkpoint('Processed all budgets');
  
  monitor.end();
}
```

## Next Steps

- Explore [Email Response Generation](/appsscript/developers/fieldplan-analyzer/email-responses)
- Learn about [Functional Programming](/appsscript/developers/fieldplan-analyzer/functional-programming) patterns
- Master [Spreadsheet Mapping](/appsscript/developers/spreadsheet-mapping/configuration)