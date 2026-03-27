---
layout: default
title: Class Structure - FieldPlan Analyzer
---

# Class Structure in FieldPlan Analyzer

The FieldPlan Analyzer uses a three-level class hierarchy for field plan data plus a standalone class for budgets. All tactics are handled by a single configuration-driven class — there are no per-tactic subclasses.

## Architecture Overview

```
FieldPlan                → base: contact info, geography, demographics, confidence scores
  └─ FieldProgram        → adds: programLength, weeklyVolunteers, weeklyHours, hourlyAttempts
       └─ TacticProgram  → adds: TACTIC_CONFIG-driven cost analysis (all 7 tactics)

FieldBudget              → standalone: parses budget rows, tracks analyzed status
```

## FieldPlan (`field_plan_parent_class.js`)

Base class constructed from a single spreadsheet row. Reads columns via `FIELD_PLAN_COLUMNS` indices defined in `_column_mappings.js`.

**Key features:**
- Multi-select fields (counties, demographics, tactics) are normalized from JotForm's newline-delimited strings into arrays
- Six confidence self-assessment scores (new in 2026) with `needsCoaching()` method
- Three static factory methods for creating instances from the sheet

```javascript
// Static factories — all use getSheet(scriptProps.getProperty('SHEET_FIELD_PLAN'))
FieldPlan.fromLastRow()
FieldPlan.fromFirstRow()
FieldPlan.fromSpecificRow(rowNumber)  // 1-based row number
```

**Constructor pattern** — reads columns by index, not by header parsing:

```javascript
constructor(rowData) {
  const normalizeField = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    const str = value.toString();
    if (str.includes('\n')) {
      return str.split('\n').map(item => item.trim()).filter(item => item);
    }
    return [str.trim()];
  };

  this._memberOrgName = rowData[FIELD_PLAN_COLUMNS.MEMBERNAME];
  this._fieldCounties = normalizeField(rowData[FIELD_PLAN_COLUMNS.FIELDCOUNTIES]);
  this._demoRace = normalizeField(rowData[FIELD_PLAN_COLUMNS.DEMORACE]);
  // ... 76 columns total
}
```

## FieldProgram (`field_program_extension_class.js`)

Extends `FieldPlan` with per-tactic program metrics. The constructor takes a `tacticType` key (e.g., `'PHONE'`) and reads 4 numeric fields from `PROGRAM_COLUMNS[tacticType]`.

```javascript
class FieldProgram extends FieldPlan {
  constructor(rowData, tacticType) {
    super(rowData);
    const columns = PROGRAM_COLUMNS[tacticType];

    this._programLength = validateColumn(columns.PROGRAMLENGTH, 'Program Length');
    this._weeklyVolunteers = validateColumn(columns.WEEKLYVOLUNTEERS, 'Weekly Volunteers');
    this._weeklyHours = validateColumn(columns.WEEKLYHOURS, 'Weekly Hours');
    this._hourlyAttempts = validateColumn(columns.HOURLYATTEMPTS, 'Hourly Attempts');
  }
}
```

**Calculation methods:**

| Method | Formula |
|--------|---------|
| `programVolunteerHours()` | volunteers x hours x weeks |
| `weekVolunteerHours()` | volunteers x hours |
| `weeklyAttempts()` | volunteers x hours x hourly rate |
| `programAttempts()` | weeks x volunteers x hours x hourly rate |
| `attemptReasonableMessage(threshold, name)` | checks if hourly attempts exceed a threshold |
| `expectedContactsMessage(contactRange, name)` | projects successful contacts using a contact rate range |

## TacticProgram (`field_tactics_extension_class.js`)

Extends `FieldProgram`. A single class handles all 7 tactics — configuration is passed via `TACTIC_CONFIG`:

```javascript
const TACTIC_CONFIG = {
  PHONE: { name: 'Phone Banking', columnKey: 'PHONE', contactRange: [0.05, 0.10],
           reasonableThreshold: 30, costTarget: 0.66, costStdDev: 0.15 },
  DOOR:  { name: 'Door to Door Canvassing', columnKey: 'DOOR', contactRange: [0.05, 0.10],
           reasonableThreshold: 30, costTarget: 1.00, costStdDev: 0.20 },
  OPEN:  { name: 'Open Canvassing / Tabling', columnKey: 'OPEN', contactRange: [0.10, 0.15],
           reasonableThreshold: 40, costTarget: 0.40, costStdDev: 0.10 },
  // ... RELATIONAL, REGISTRATION, TEXT, MAIL
};

class TacticProgram extends FieldProgram {
  constructor(rowData, tacticKey) {
    const config = TACTIC_CONFIG[tacticKey];
    super(rowData, config.columnKey);
    this._tacticKey = tacticKey;
    this._name = config.name;
    this._costTarget = config.costTarget;
    this._costStdDev = config.costStdDev;
    // ...
  }
}
```

**Key method — `analyzeCost(fundingAmount)`:**

```javascript
analyzeCost(fundingAmount) {
  const programAttempts = this.programAttempts();
  const costPerAttempt = programAttempts > 0 ? fundingAmount / programAttempts : 0;
  const lowerBound = this._costTarget - this._costStdDev;
  const upperBound = this._costTarget + this._costStdDev;

  const status = costPerAttempt <= lowerBound ? 'below' :
                 costPerAttempt >= upperBound ? 'above' : 'within';

  return { tacticName, programAttempts, costPerAttempt, targetCost, lowerBound, upperBound, status };
}
```

**Adding a new tactic** requires only adding an entry to `TACTIC_CONFIG` — no new class needed.

## FieldBudget (`budget_class.js`)

Standalone class (not in the FieldPlan hierarchy). Parses 57-column budget rows with requested/total/gap amounts for 15 line items.

```javascript
class FieldBudget {
  constructor(rowData) {
    this._memberOrgName = rowData[BUDGET_COLUMNS.MEMBERNAME];
    this._canvassRequested = rowData[BUDGET_COLUMNS.CANVASSREQUESTED];
    // ... 15 budget categories x 3 columns each
  }
}

// Column indices assigned after class definition
FieldBudget.COLUMNS = BUDGET_COLUMNS;
```

**Static factories:** `fromLastRow()`, `fromFirstRow()`, `fromSpecificRow(rowNumber)`

**Key methods:**
- `sumOutreach()` / `sumNotOutreach()` — proportional spending breakdown
- `needDataStipend()` — calculates stipend hours at $20/hr
- `requestSummary()` — formatted HTML summary
- `markAsAnalyzed(rowNumber)` — writes `true` to the ANALYZED column
- `getUnanalyzedBudgets()` — static, returns all rows where ANALYZED !== true

## How Classes Are Used in Triggers

### Field Plan Processing (`checkForNewRows`)

```javascript
// field_trigger_functions.js — simplified from actual source
const fieldPlan = FieldPlan.fromSpecificRow(rowNumber);
sendFieldPlanEmail(fieldPlan, rowNumber);
generateQueriesForFieldPlan(fieldPlan, rowNumber);
```

### Tactic Instantiation (`getTacticInstances`)

```javascript
// field_trigger_functions.js — iterates TACTIC_CONFIG to create tactics
for (const [tacticKey, config] of Object.entries(TACTIC_CONFIG)) {
  const columns = PROGRAM_COLUMNS[config.columnKey];
  // Check if all 4 fields are filled
  // If complete: tactics.push(new TacticProgram(rowData, tacticKey));
  // If partial: track as incomplete
}
```

### Budget Analysis (`analyzeBudgets`)

```javascript
// budget_trigger_functions.js — simplified from actual source
const unanalyzedBudgets = FieldBudget.getUnanalyzedBudgets();
for (const budgetData of unanalyzedBudgets) {
  const fieldPlanMatch = findMatchingFieldPlan(budgetData.budget.memberOrgName);
  if (fieldPlanMatch) {
    const analysis = analyzeBudgetWithFieldPlan(budgetData.budget, fieldPlanMatch);
    sendBudgetAnalysisEmail(budgetData.budget, fieldPlanMatch.fieldPlan, analysis);
    budgetData.budget.markAsAnalyzed(budgetData.rowNumber);
  }
}
```

## Key Design Principles

1. **Configuration over inheritance** — One `TacticProgram` class + `TACTIC_CONFIG` replaces what would be 7 separate tactic subclasses
2. **Column mappings as single source of truth** — All indices live in `_column_mappings.js`; classes reference constants, not magic numbers
3. **Static factory methods** — `fromLastRow()`, `fromSpecificRow(n)` provide clean construction from sheet data
4. **Script properties for runtime config** — Sheet names, email lists, and trigger intervals are stored in `PropertiesService`, not in code

## Next Steps

- Learn about [Timer Implementation](./timers) for trigger setup and scheduling
