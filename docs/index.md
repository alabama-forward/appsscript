---
layout: default
title: Home
---

# FieldPlan Analyzer Documentation

The FieldPlan Analyzer processes field planning and budget submissions from JotForm, calculates cost efficiency metrics against configurable targets, and sends HTML email reports to staff. It runs on Google Apps Script with time-based triggers.

## For End Users

- [FieldPlan Analyzer Overview](./end-users/fieldplan-analyzer-overview) — what the system does, how analysis works, email report examples

## For Developers

- [Class Structure](./developers/fieldplan-analyzer/class-structure) — `FieldPlan` → `FieldProgram` → `TacticProgram` hierarchy and `FieldBudget`
- [Timer Implementation](./developers/fieldplan-analyzer/timers) — triggers, state management, reprocess workflow
- [Spreadsheet Mapping](./developers/spreadsheet-mapping/) — `_column_mappings.js` configuration and usage

## Reference

- [Troubleshooting](./troubleshooting)
- [FAQ](./faq)
