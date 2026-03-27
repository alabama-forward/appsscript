---
layout: default
title: Configuration Guide
---

# Spreadsheet Mapping Configuration

All column indices live in `_column_mappings.js`. This is the single source of truth — when the spreadsheet structure changes, only this file needs updating.

## File Structure

`_column_mappings.js` defines three column mapping objects and one question-text mapping:

| Object | Purpose | Used by |
|--------|---------|---------|
| `FIELD_PLAN_COLUMNS` | 76-column field plan sheet (columns 0–75) | `FieldPlan` class |
| `BUDGET_COLUMNS` | 57-column budget sheet (columns 0–56) | `FieldBudget` class |
| `PROGRAM_COLUMNS` | Per-tactic program metrics (4 columns each, 7 tactics) | `FieldProgram` class |
| `COLUMN_QUESTIONS` | Maps column names to their JotForm question text | Email builders |

## FIELD_PLAN_COLUMNS

Maps the `2026_field_plan` sheet. Columns are grouped by section:

```javascript
const FIELD_PLAN_COLUMNS = {
    // Meta
    SUBMISSIONDATETIME: 0,
    // Contact
    MEMBERNAME: 2,
    FIRSTNAME: 3,
    LASTNAME: 4,
    CONTACTEMAIL: 5,
    CONTACTPHONE: 6,
    // Data & Tools
    DATASTORAGE: 7,
    DATASTIPEND: 8,
    // ... columns 9-15
    // Geo & Tactics
    FIELDTACTICS: 16,
    FIELDCOUNTIES: 22,
    // ... columns 17-27
    // Demographics
    DEMORACE: 28,
    DEMOAGE: 29,
    // ... columns 30-33
    // Acknowledgements (columns 34-36)
    // Confidence scores — new in 2026 (columns 65-70)
    CONFIDENCEREASONABLE: 65,
    CONFIDENCEDATA: 66,
    CONFIDENCEPLAN: 67,
    CONFIDENCECAPACITY: 68,
    CONFIDENCESKILLS: 69,
    CONFIDENCEGOALS: 70,
    // Submission metadata & reprocess flags
    SUBMISSIONURL: 71,
    SUBMISSIONID: 72,
    QUERY_BUILDER_STATUS: 73,
    REPROCESS: 74,
    REPROCESS_QUERIES: 75
};
```

Note the gap between columns 36 and 65 — columns 37–64 are the per-tactic program metrics mapped separately in `PROGRAM_COLUMNS`.

## PROGRAM_COLUMNS

Each of the 7 tactics has 4 program metric columns. These occupy the contiguous block from column 37 to column 64:

```javascript
const PROGRAM_COLUMNS = {
    PHONE:        { PROGRAMLENGTH: 37, WEEKLYVOLUNTEERS: 38, WEEKLYHOURS: 39, HOURLYATTEMPTS: 40 },
    DOOR:         { PROGRAMLENGTH: 41, WEEKLYVOLUNTEERS: 42, WEEKLYHOURS: 43, HOURLYATTEMPTS: 44 },
    OPEN:         { PROGRAMLENGTH: 45, WEEKLYVOLUNTEERS: 46, WEEKLYHOURS: 47, HOURLYATTEMPTS: 48 },
    RELATIONAL:   { PROGRAMLENGTH: 49, WEEKLYVOLUNTEERS: 50, WEEKLYHOURS: 51, HOURLYATTEMPTS: 52 },
    REGISTRATION: { PROGRAMLENGTH: 53, WEEKLYVOLUNTEERS: 54, WEEKLYHOURS: 55, HOURLYATTEMPTS: 56 },
    TEXT:         { PROGRAMLENGTH: 57, WEEKLYVOLUNTEERS: 58, WEEKLYHOURS: 59, HOURLYATTEMPTS: 60 },
    MAIL:         { PROGRAMLENGTH: 61, WEEKLYVOLUNTEERS: 62, WEEKLYHOURS: 63, HOURLYATTEMPTS: 64 }
};
```

The `FieldProgram` constructor takes a tactic key (e.g., `'PHONE'`) and reads all 4 metrics from `PROGRAM_COLUMNS[tacticKey]`.

## BUDGET_COLUMNS

Maps the `2026_field_budget` sheet. Budget columns follow a repeating pattern — each of 15 line items has three columns: `REQUESTED`, `TOTAL`, and `GAP`.

```javascript
const BUDGET_COLUMNS = {
    // Contact info
    FIRSTNAME: 0,
    LASTNAME: 1,
    CONTACTEMAIL: 2,
    CONTACTPHONE: 3,
    MEMBERNAME: 4,
    // Budget line items (requested / total / gap)
    ADMINREQUESTED: 5,   ADMINTOTAL: 6,   ADMINGAP: 7,
    DATAREQUESTED: 8,    DATATOTAL: 9,    DATAGAP: 10,
    // ... 13 more line items through column 49
    // Totals
    REQUESTEDTOTAL: 50,
    PROJECTTOTAL: 51,
    GAPTOTAL: 52,
    // Metadata
    SUBMITFIELDPLAN: 53,
    SUBMISSIONID: 54,
    ANALYZED: 55,    // Written by markAsAnalyzed()
    REPROCESS: 56
};
```

## COLUMN_QUESTIONS

Maps each column constant to the actual JotForm question text. Used by email builders to generate human-readable reports:

```javascript
const COLUMN_QUESTIONS = {
    MEMBERNAME: "Table Member Organization Name",
    CONTACTEMAIL: "Data & Tech Contact's Email",
    FIELDCOUNTIES: "In what counties will you conduct your program?",
    DEMORACE: "These are the racial and ethnic demographics I intend to reach...",
    // ...
};
```

Some entries are objects with sub-questions (e.g., `FIELDNARRATIVE` has 5 sub-prompts).

## Updating Mappings

When the JotForm adds, removes, or reorders columns:

1. Export a fresh CSV from the Google Sheet
2. Compare column positions against `_column_mappings.js`
3. Update the affected indices
4. Run `validateColumnMappings()` in the Apps Script editor — it checks for duplicates, type errors, and overlap between `FIELD_PLAN_COLUMNS` and `PROGRAM_COLUMNS`
5. Run `logColumnMappingSummary()` to verify the full mapping state

Both validation functions are defined at the bottom of `_column_mappings.js`.
