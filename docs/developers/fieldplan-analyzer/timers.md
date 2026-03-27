---
layout: default
title: Timer Implementation - FieldPlan Analyzer
---

# Timer Implementation in FieldPlan Analyzer

The FieldPlan Analyzer uses Google Apps Script time-based triggers and an installable onEdit trigger to automate processing. This guide documents the actual trigger functions and patterns used in the codebase.

## Trigger Overview

| Trigger | Handler Function | Schedule | Source File |
|---------|-----------------|----------|-------------|
| Field plan check | `checkForNewRows` | Every 12h | `field_trigger_functions.js` |
| Budget analysis | `analyzeBudgets` | Every 12h | `budget_trigger_functions.js` |
| Weekly summary | `runWeeklySummaryTrigger` | Mondays at 9am | `budget_trigger_functions.js` |
| Reprocess | `onSpreadsheetEdit` | On cell edit | `field_trigger_functions.js` |

## Setting Up Triggers

Each trigger has a setup function that checks for duplicates before creating. Run each once from the Apps Script editor.

### Field Plan Trigger

```javascript
// field_trigger_functions.js
function createSpreadsheetTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  const triggerExists = triggers.some(trigger =>
    trigger.getHandlerFunction() === 'checkForNewRows' &&
    trigger.getEventType() === ScriptApp.EventType.CLOCK
  );

  if (!triggerExists) {
    const triggerHours = parseInt(scriptProps.getProperty('TRIGGER_FIELD_PLAN_CHECK_HOURS'));
    ScriptApp.newTrigger('checkForNewRows')
      .timeBased()
      .everyHours(triggerHours)
      .create();
  }
}
```

### Budget Analysis Trigger

```javascript
// budget_trigger_functions.js
function createBudgetAnalysisTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  const triggerExists = triggers.some(trigger =>
    trigger.getHandlerFunction() === 'analyzeBudgets' &&
    trigger.getEventType() === ScriptApp.EventType.CLOCK
  );

  if (!triggerExists) {
    const triggerHours = parseInt(scriptProps.getProperty('TRIGGER_BUDGET_ANALYSIS_HOURS') || '12');
    ScriptApp.newTrigger('analyzeBudgets')
      .timeBased()
      .everyHours(triggerHours)
      .create();
  }
}
```

### Weekly Summary Trigger

```javascript
// budget_trigger_functions.js
function createWeeklySummaryTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  const triggerExists = triggers.some(trigger =>
    trigger.getHandlerFunction() === 'runWeeklySummaryTrigger' &&
    trigger.getEventType() === ScriptApp.EventType.CLOCK
  );

  if (!triggerExists) {
    const weekDay = scriptProps.getProperty('TRIGGER_WEEKLY_SUMMARY_DAY') || 'MONDAY';
    const hour = parseInt(scriptProps.getProperty('TRIGGER_WEEKLY_SUMMARY_HOUR') || '9');
    ScriptApp.newTrigger('runWeeklySummaryTrigger')
      .timeBased()
      .onWeekDay(ScriptApp.WeekDay[weekDay])
      .atHour(hour)
      .create();
  }
}
```

## Core Timer Functions

### `checkForNewRows()` — Field Plan Processing

Runs every 12 hours. Compares the current last row against `LAST_PROCESSED_ROW` stored in script properties. For each new row:

1. Creates a `FieldPlan` via `FieldPlan.fromSpecificRow(rowNumber)`
2. Sends a field plan notification email
3. Generates BigQuery queries via `generateQueriesForFieldPlan()`
4. Checks for a matching budget; if none, tracks in `MISSING_BUDGET_{orgName}` property
5. If a matching unanalyzed budget exists, triggers `onFieldPlanSubmission()` which calls `processBudget()`

```javascript
// field_trigger_functions.js — simplified from actual source
function checkForNewRows() {
  const sheetName = scriptProps.getProperty('SHEET_FIELD_PLAN');
  const sheet = getSheet(sheetName);
  const currentLastRow = sheet.getLastRow();
  const lastProcessedRow = parseInt(
    PropertiesService.getScriptProperties().getProperty('LAST_PROCESSED_ROW') || '1'
  );

  if (currentLastRow > lastProcessedRow) {
    for (let rowNumber = lastProcessedRow + 1; rowNumber <= currentLastRow; rowNumber++) {
      const fieldPlan = FieldPlan.fromSpecificRow(rowNumber);
      sendFieldPlanEmail(fieldPlan, rowNumber);
      generateQueriesForFieldPlan(fieldPlan, rowNumber);

      const budgetMatch = findMatchingBudget(fieldPlan.memberOrgName);
      if (!budgetMatch) {
        trackMissingBudget(fieldPlan);
      }
      onFieldPlanSubmission(fieldPlan);
    }

    PropertiesService.getScriptProperties()
      .setProperty('LAST_PROCESSED_ROW', currentLastRow.toString());
    checkForMissingBudgets();
  }
}
```

### `analyzeBudgets()` — Budget Processing

Runs every 12 hours. Gets all unanalyzed budgets via `FieldBudget.getUnanalyzedBudgets()`, then for each:

1. Clears missing-budget tracking via `onBudgetSubmission()`
2. Calls `processBudget()` which matches to a field plan, runs cost analysis, sends email, and marks as analyzed
3. After all budgets, calls `checkForMissingFieldPlans()`

```javascript
// budget_trigger_functions.js — simplified from actual source
function analyzeBudgets() {
  const unanalyzedBudgets = FieldBudget.getUnanalyzedBudgets();

  for (const budgetData of unanalyzedBudgets) {
    onBudgetSubmission(budgetData.budget);
    processBudget(budgetData);
  }

  checkForMissingFieldPlans();
}
```

### `runWeeklySummaryTrigger()` — Weekly Summary

Wrapper that fires `generateWeeklySummary(false)` in production mode. The trigger handler is a separate function from the summary generator so the trigger always passes the correct parameters.

## State Management

State is tracked entirely through **script properties** — no external database or custom sheet.

| Property Key | Purpose | Set By |
|-------------|---------|--------|
| `LAST_PROCESSED_ROW` | Last field plan row processed | `checkForNewRows()` |
| `MISSING_BUDGET_{orgName}` | Timestamp when missing budget first detected | `trackMissingBudget()` |
| `MISSING_PLAN_{orgName}` | Timestamp when missing field plan first detected | `trackMissingFieldPlan()` |

### Missing Document Alerts

Both field plans and budgets track missing counterparts. After 72 hours (configurable via `TRIGGER_MISSING_PLAN_THRESHOLD_HOURS`), an alert email is sent and the tracking property is deleted:

```javascript
// field_trigger_functions.js — actual pattern used for both directions
function checkForMissingBudgets() {
  const allProperties = properties.getProperties();
  const thresholdHours = parseInt(
    scriptProps.getProperty('TRIGGER_MISSING_PLAN_THRESHOLD_HOURS') || '72'
  );
  const thresholdMilliseconds = thresholdHours * 60 * 60 * 1000;

  for (const key in allProperties) {
    if (key.startsWith('MISSING_BUDGET_')) {
      const orgName = key.replace('MISSING_BUDGET_', '');
      const timestamp = new Date(allProperties[key]);

      if (currentTime - timestamp > thresholdMilliseconds) {
        sendMissingBudgetNotification(orgName);
        properties.deleteProperty(key);
      }
    }
  }
}
```

## Reprocess Trigger

An installable `onEdit` trigger watches for checkbox changes on the `2026_field_plan` and `2026_field_budget` sheets. This must be an installable trigger (not a simple `onEdit`) because it uses `MailApp`.

```javascript
// field_trigger_functions.js — actual implementation
function onSpreadsheetEdit(e) {
  const sheetName = e.range.getSheet().getName();
  const row = e.range.getRow();
  const col = e.range.getColumn();

  // Field plan reprocess checkbox
  if (sheetName === fieldPlanSheetName &&
      col === FIELD_PLAN_COLUMNS.REPROCESS + 1 && e.value === 'TRUE' && row > 1) {
    reprocessFieldPlanRow(row);
    e.range.setValue(false);
  }

  // Budget reprocess checkbox
  if (sheetName === budgetSheetName &&
      col === BUDGET_COLUMNS.REPROCESS + 1 && e.value === 'TRUE' && row > 1) {
    reprocessBudgetRow(row);
    e.range.setValue(false);
  }

  // Query builder reprocess checkbox
  if (sheetName === fieldPlanSheetName &&
      col === FIELD_PLAN_COLUMNS.REPROCESS_QUERIES + 1 && e.value === 'TRUE' && row > 1) {
    reprocessQueryBuilderRow(row);
    e.range.setValue(false);
  }
}
```

## Bulk Processing Functions

For reprocessing all data (e.g., after a code change):

- `processAllFieldPlans(isTestMode)` — processes every row from 2 to last
- `processAllBudgets(isTestMode)` — processes every budget, skipping those without a field plan match
- `reprocessAllAnalyses(isTestMode)` — runs field plans first, then budgets
- `analyzeSpecificOrganization(orgName, isTestMode)` — analyze one org on demand

## Trigger Configuration Properties

All trigger timing is controlled via script properties set by `setupScriptProperties()` in `_globals.js`:

| Property | Default | Purpose |
|----------|---------|---------|
| `TRIGGER_FIELD_PLAN_CHECK_HOURS` | `12` | Field plan polling interval |
| `TRIGGER_BUDGET_ANALYSIS_HOURS` | `12` | Budget analysis interval |
| `TRIGGER_MISSING_PLAN_THRESHOLD_HOURS` | `72` | Hours before missing-doc alert |
| `TRIGGER_WEEKLY_SUMMARY_DAY` | `MONDAY` | Weekly summary day |
| `TRIGGER_WEEKLY_SUMMARY_HOUR` | `9` | Weekly summary hour (ET) |

## Apps Script Trigger Basics

For reference, Apps Script supports these time-based trigger intervals:

```javascript
// Minutes: 1, 5, 10, 15, or 30
ScriptApp.newTrigger('fn').timeBased().everyMinutes(5).create();

// Hours: 1, 2, 4, 6, 8, or 12
ScriptApp.newTrigger('fn').timeBased().everyHours(12).create();

// Weekly on a specific day and hour
ScriptApp.newTrigger('fn').timeBased()
  .onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(9).create();
```

Key constraints:
- Maximum 20 triggers per script project
- 6-minute execution time limit per run
- `atHour()` runs within a 1-hour window (e.g., `atHour(9)` runs between 9:00-9:59)

## Next Steps

- Learn about [Class Structure](./class-structure) for the data model
