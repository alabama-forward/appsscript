---
layout: default
title: Spreadsheet Mapping
---

# Spreadsheet Mapping

The FieldPlan Analyzer reads all data from two Google Sheets tabs (`2026_field_plan` and `2026_field_budget`) using 0-based column index constants defined in a single file: `_column_mappings.js`. Classes never reference columns by number directly — they use named constants from this file.

When the JotForm structure changes or columns shift, `_column_mappings.js` is the only file that needs updating.

## In This Section

- [Configuration](./configuration) — How column mappings are structured and how to update them
- [Examples](./examples) — How classes use column mappings to read spreadsheet data
