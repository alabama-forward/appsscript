---
layout: default
title: Query Builder - FieldPlan Analyzer
---

# Query Builder

The query builder generates BigQuery SQL from field plan submissions and writes them to a `query_queue` sheet tab for manual execution by the data team. It runs automatically when new field plans are processed and can be re-triggered per row via a spreadsheet checkbox.

## Pipeline Overview

When `generateQueriesForFieldPlan(fieldPlan, rowNumber)` is called:

1. **Resolve VAN ID** — looks up the org in the `van_id_lookup` sheet (exact → normalized → substring match)
2. **Resolve demographics** — maps form race/age selections to Catalist database values
3. **Route by precinct knowledge** — orgs that know their precincts get targeting queries; orgs that don't get exploration queries
4. **Write queries** — each SQL string is appended to the `query_queue` sheet as a `pending` row
5. **Write summary** — a human-readable status is written to the `QUERY_BUILDER_STATUS` column (column 73) on the field plan sheet

## Files

| File | Role |
|------|------|
| `_query_config.js` | Configuration: BigQuery settings, race/age maps, stop words |
| `query_builder.js` | Orchestration: entry point, routing, sheet writers |
| `query_sql_templates.js` | SQL generation: WHERE clauses, MERGE statements, SELECT queries |
| `query_resolvers.js` | Value resolution: VAN IDs, counties, precincts, demographics, activist codes |
| `query_test_functions.js` | Manual test suite |

## Two Query Paths

### Precinct Path (org knows precincts)

Triggered when `fieldPlan.knowsPrecincts` is true and precinct values contain digits. For each precinct, generates 3 queries:

| Query type | Template function | Purpose |
|------------|-------------------|---------|
| `metadata_merge` | `buildMetadataMergeQuery()` | MERGE into `coordination_metadata` — records org/county/precinct/activist-code |
| `precinct_list_merge` | `buildPrecinctListMergeQuery()` | MERGE into `2026_precinct_lists` — joins District, Person, Models, Vote_History with demographic filters |
| `dwid_select` | `buildDwidSelectQuery()` | SELECT from `2026_precinct_lists` for VAN upload by activist code |

### Exploration Path (org doesn't know precincts)

For each county, generates 3 queries:

| Query type | Template function | Purpose |
|------------|-------------------|---------|
| `exploration` | `buildExplorationQuery()` | Grouped SELECT by precinct/municipality/race with `HAVING voter_count >= 100` |
| `county_targeting` | `buildCountyLevelTargetingQuery()` | County-wide voter SELECT with a commented-out precinct `IN` clause for manual refinement |
| `metadata_merge` | `buildMetadataMergeQuery()` | MERGE with precinct `00000` placeholder |

## Value Resolution

### Race Demographics (`mapRaceDemographics`)

JotForm selections are mapped to Catalist values via `RACE_MAP` in `_query_config.js`:

| Form value | Catalist value |
|-----------|---------------|
| Black / African American | `black` |
| White / Caucasian | `white` |
| Hispanic / Latino | `hispanic` |
| American Indian / Alaska Native | `asian` |
| East Asian / Southeast Asian | `asian` |
| Middle Eastern / North African | `other` |
| Native Hawaiian / Pacific Islander | `other` |
| Multiracial | `other` |

Unmapped values are included as SQL comments. The deduped Catalist values become an `IN` clause in the WHERE filter.

### Age Demographics (`mapAgeDemographics`)

JotForm age ranges are mapped via `AGE_RANGE_MAP` to `{min, max}` pairs. Contiguous ranges are merged into combined `BETWEEN` clauses. If all 9 options are selected, the age filter is omitted entirely.

### VAN ID Resolution (`resolveVanId`)

Three-tier lookup against the `van_id_lookup` sheet:

1. **Exact match** on org name
2. **Normalized match** — lowercase, no punctuation, collapsed whitespace
3. **Substring contains** — either direction

Returns `{found, committeeId, committeeName, matchType}`.

### Activist Code Generation (`generateActivistCode`)

Format: `XXXX_XXXXX_XXX` — org initials, precinct code, county abbreviation.

Org initials are derived from significant words (skipping stop words like `'the'`, `'of'`, `'and'` defined in `ORG_STOP_WORDS`).

## Shared WHERE Clause

All SQL templates use `buildWhereClause(params)` which adds conditions for:

- County (`p.county_name`)
- Precinct (`p.precinct_code`) — omitted for exploration queries
- Voter status (`active`)
- Deceased (`N`)
- Precinct data quality (NOT NULL checks)
- Race (`IN` clause from resolved Catalist values)
- Age (`BETWEEN` from merged ranges)

## Spreadsheet Interaction

### Columns on the field plan sheet

| Column | Index | Purpose |
|--------|-------|---------|
| `QUERY_BUILDER_STATUS` | 73 | Multi-line text summary written by `writeToFieldPlanSheet()` |
| `REPROCESS_QUERIES` | 75 | Checkbox — triggers `reprocessQueryBuilderRow()` via `onSpreadsheetEdit` |

### Sheet tabs

| Tab | Purpose | Interaction |
|-----|---------|-------------|
| `query_queue` | One row per generated SQL query | Written by `writeToQueryQueue()`. Status column has dropdown: `pending` / `run` / `uploaded` |
| `van_id_lookup` | Org name → VAN committee ID mapping | Read by `resolveVanId()` |
| `county_precinct` | County → valid precinct codes | Read by `getCountyPrecincts()` and `resolvePrecinctCode()` |

## Configuration (`_query_config.js`)

`getQueryConfig()` reads all settings from Script Properties at runtime:

| Property | Purpose |
|----------|---------|
| `BQ_PROJECT_ID` | BigQuery project ID |
| `BQ_PRECINCT_LIST_TABLE` | Target table for precinct list merges |
| `BQ_METADATA_TABLE` | Target table for coordination metadata merges |
| `BQ_VOTE_HISTORY_COLUMNS` | Comma-separated election columns to include |
| `BQ_QUERY_TYPE_DEFAULT` | Default query type string |
| `SHEET_QUERY_QUEUE` | Sheet tab name for the query queue |
| `SHEET_VAN_ID_LOOKUP` | Sheet tab name for VAN ID lookups |
| `SHEET_COUNTY_PRECINCT` | Sheet tab name for county/precinct validation |

Hardcoded table references for joins: `catalist_AL.District`, `catalist_AL.Person`, `catalist_AL.Models`, `catalist_AL.Vote_History`.

## Setup Functions

Run once from the Apps Script editor to initialize sheet tabs:

- `setupQueryQueueSheet()` — creates `query_queue` tab with 11-column headers and status dropdown
- `setupVanIdLookupSheet()` — creates `van_id_lookup` tab with `committeename` / `committeeid` headers
- `setupQueryBuilderColumn()` — adds the "Reprocess Queries" checkbox column to the field plan sheet

## Testing

`query_test_functions.js` contains 12 test functions covering each resolver, each SQL template, and end-to-end generation. Run `runAllQueryBuilderTests()` to execute all of them. Tests use `isTestMode = true` to route emails to `datateam@alforward.org` with `[TEST]` prefix.
