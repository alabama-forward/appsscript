---
layout: default
title: For Developers
---

# Developer Documentation

Technical documentation for the FieldPlan Analyzer codebase.

## Architecture

The FieldPlan Analyzer is a server-side Apps Script project deployed via `clasp push`. No build step, no transpilation, no external dependencies.

- **Data source**: Two Google Sheets tabs (`2026_field_plan`, `2026_field_budget`) populated by JotForm
- **Processing**: Time-based triggers run `checkForNewRows()` and `analyzeBudgets()` every 12 hours
- **Output**: HTML email reports sent via `MailApp`
- **Configuration**: All runtime config in `PropertiesService.getScriptProperties()`

## Documentation

### FieldPlan Analyzer
- [Class Structure](./fieldplan-analyzer/class-structure) — `FieldPlan` → `FieldProgram` → `TacticProgram` hierarchy, `FieldBudget`, factory methods
- [Timer Implementation](./fieldplan-analyzer/timers) — trigger setup, `checkForNewRows`, `analyzeBudgets`, state management, reprocess workflow
- [Query Builder](./fieldplan-analyzer/query-builder) — BigQuery SQL generation, value resolution, query queue workflow

### Spreadsheet Mapping
- [Configuration](./spreadsheet-mapping/configuration) — `FIELD_PLAN_COLUMNS`, `BUDGET_COLUMNS`, `PROGRAM_COLUMNS`, update/validation workflow
- [Examples](./spreadsheet-mapping/examples) — how classes read rows using column constants
