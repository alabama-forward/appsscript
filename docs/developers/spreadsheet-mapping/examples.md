---
layout: default
title: Mapping Examples
---

# Spreadsheet Mapping Examples

How the FieldPlan Analyzer classes use column mappings to read spreadsheet data.

## FieldPlan — Reading Contact and Geography

The `FieldPlan` constructor receives a raw row array from `getValues()` and reads each field by its column constant:

```javascript
constructor(rowData) {
    this._memberOrgName = rowData[FIELD_PLAN_COLUMNS.MEMBERNAME];     // column 2
    this._contactEmail = rowData[FIELD_PLAN_COLUMNS.CONTACTEMAIL];    // column 5
    this._fieldCounties = normalizeField(rowData[FIELD_PLAN_COLUMNS.FIELDCOUNTIES]); // column 22
    this._demoRace = normalizeField(rowData[FIELD_PLAN_COLUMNS.DEMORACE]);           // column 28
    // ... 76 columns total
}
```

Multi-select fields (counties, demographics, tactics) come from JotForm as newline-delimited strings. The `normalizeField()` helper splits them into arrays:

```javascript
const normalizeField = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    const str = value.toString();
    if (str.includes('\n')) {
        return str.split('\n').map(item => item.trim()).filter(item => item);
    }
    return [str.trim()];
};
```

## FieldProgram — Reading Per-Tactic Metrics

`FieldProgram` extends `FieldPlan` and reads 4 program metrics for a specific tactic. The tactic key selects which block of `PROGRAM_COLUMNS` to use:

```javascript
class FieldProgram extends FieldPlan {
    constructor(rowData, tacticType) {
        super(rowData);
        const columns = PROGRAM_COLUMNS[tacticType];

        this._programLength = rowData[columns.PROGRAMLENGTH];
        this._weeklyVolunteers = rowData[columns.WEEKLYVOLUNTEERS];
        this._weeklyHours = rowData[columns.WEEKLYHOURS];
        this._hourlyAttempts = rowData[columns.HOURLYATTEMPTS];
    }
}
```

For example, `new FieldProgram(rowData, 'PHONE')` reads columns 37–40, while `new FieldProgram(rowData, 'DOOR')` reads columns 41–44.

## TacticProgram — Iterating All Tactics

`TACTIC_CONFIG` maps tactic keys to their `PROGRAM_COLUMNS` key. The trigger function iterates all tactics to create instances:

```javascript
for (const [tacticKey, config] of Object.entries(TACTIC_CONFIG)) {
    const columns = PROGRAM_COLUMNS[config.columnKey];
    const hasData = [columns.PROGRAMLENGTH, columns.WEEKLYVOLUNTEERS,
                     columns.WEEKLYHOURS, columns.HOURLYATTEMPTS]
        .every(col => rowData[col]);

    if (hasData) {
        tactics.push(new TacticProgram(rowData, tacticKey));
    }
}
```

## FieldBudget — Reading Budget Line Items

`FieldBudget` reads the repeating requested/total/gap pattern:

```javascript
constructor(rowData) {
    this._memberOrgName = rowData[BUDGET_COLUMNS.MEMBERNAME];         // column 4
    this._canvassRequested = rowData[BUDGET_COLUMNS.CANVASSREQUESTED]; // column 35
    this._canvassTotal = rowData[BUDGET_COLUMNS.CANVASSTOTAL];         // column 36
    this._canvassGap = rowData[BUDGET_COLUMNS.CANVASSGAP];             // column 37
    // ... 15 line items x 3 columns each
    this._requestedTotal = rowData[BUDGET_COLUMNS.REQUESTEDTOTAL];     // column 50
    this._projectTotal = rowData[BUDGET_COLUMNS.PROJECTTOTAL];         // column 51
    this._gapTotal = rowData[BUDGET_COLUMNS.GAPTOTAL];                 // column 52
}
```

## Static Factory Methods

All classes use the same pattern for constructing from sheet data:

```javascript
// Read a specific row (1-based row number)
const plan = FieldPlan.fromSpecificRow(5);

// Read the most recent submission
const budget = FieldBudget.fromLastRow();

// Get all unanalyzed budgets
const pending = FieldBudget.getUnanalyzedBudgets();
// Returns: [{ budget: FieldBudget, rowNumber: number }, ...]
```

Each factory calls `getSheet()` with the sheet name from Script Properties, then passes the row array to the constructor. The column constants handle the rest.

## Email Builders — Using COLUMN_QUESTIONS

The email builders use `COLUMN_QUESTIONS` to label data in HTML reports:

```javascript
// Instead of hardcoding question text:
const label = COLUMN_QUESTIONS.FIELDCOUNTIES;
// → "In what counties will you conduct your program?"
```

This keeps email templates in sync with the form — if a question is reworded, update `COLUMN_QUESTIONS` and all emails reflect the change.
