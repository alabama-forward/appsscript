# Changelog — 2026 Field Plan Analyzer

All notable changes to the 2026 Field Plan Analyzer are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.4.7] - 2026-04-01
### Changed
- Document re-enablement steps for disabled RELATIONAL/REGISTRATION tactics

### Fixed
- Correct TEXT reasonableThreshold from 100 to 1000

## [1.4.6] - 2026-04-01
### Changed
- Renumber column mappings for removed RELATIONAL/REGISTRATION tactic columns (2026-Apr form version)
- Derive tactic counts and gap analysis from TACTIC_CONFIG.enabled instead of hardcoding tactic keys

## [1.4.5] - 2026-04-01
### Changed
- Add enabled kill switch to TACTIC_CONFIG entries for toggling individual tactics
- Disable RELATIONAL and REGISTRATION tactics (removed from JotForm and spreadsheet)

## [1.4.4] - 2026-03-30
### Fixed
- Correct confidence score scale from /10 to /9 and rescale all coaching thresholds proportionally

## [1.4.3] - 2026-03-29
### Changed
- Clean up action items: merge "Follow Up" into concern cards when flags are present, keep standalone only for clean plans
- Remove duplicate volunteer hours flag from tactic sections; keep only the yellow projection warning
- Soften projection warning language to omit threshold number and prompt a double-check instead
- Add missing attempts_per_hour entry to flag group titles for proper action item headers

## [1.4.2] - 2026-03-27
### Changed
- Deprecate BigQuery execution and isolate setup utility

## [1.4.1] - 2026-03-27
### Fixed
- Make precinct query generation resilient to county failures by resolving all counties up front and trying each one per precinct

## [1.4.0] - 2026-03-27
### Added
- SQL WHERE clause builder for fieldplan query templates
- SQL template functions for BigQuery query builder (exploration, county-targeting, precinct-list, metadata merge, DWID select)
- Query builder orchestration with reprocess checkbox support
- Query email builder, BigQuery executor, and test suite
- Metadata merge query in county-level exploration path for full run tracking
- Commented-out precinct filter placeholder in county-targeting queries for manual use
- Inline edit hints in county-level metadata merge for precinct/activist code replacement
- Dropdown validation (pending/run/uploaded) on query_queue Status column
- Numeric precinct validation to route text-only values like "n/a" to exploration path

### Changed
- Rewrite query email to link to query_queue sheet rows instead of embedding inline SQL
- Restructure email query sections into exploration and precinct-level groups by county
- Remove exposed BigQuery project name from email footer
- Rename email shell title from "[Query Builder] OrgName" to "Query Builder"
- Switch sendQueryEmail to use getQueryEmailRecipients for correct routing
- Pass raceData and ageData through to email for filter rendering in summary section
- Refactor query_queue sheet setup to use QUERY_QUEUE_HEADERS constant
- Update query_executor column references to match new queue schema
- Expand RACE_MAP with additional Asian/Pacific Islander category mappings
- Simplify query resolver docstrings to concise JSDoc style

### Fixed
- Correct deceased filter from 'f' to 'N' in buildWhereClause
- Add precinctcode/precinctname NOT NULL checks to WHERE clause
- Add missing HAVING clause to exploration query
- Correct typos and mismatched test assumptions across query builder

## [1.3.1] - 2026-03-24
### Fixed
- Wire attempts-per-hour threshold into per-tactic badge and flag system

## [1.3.0] - 2026-03-18
### Added
- Expected outreach budget range calculation from per-tactic cost bounds and program attempts
- Outreach status flag (within/below/above) comparing requested amount against expected range

### Changed
- Render Expected Outreach Range row with color-coded status badge in budget analysis email
- Log expected range and outreach status in `testEmailFormatting()`

## [1.2.1] - 2026-03-08
### Added
- Age demographics resolver with contiguous range merging for SQL queries
- Activist code generator from org name, county, and precinct
- Race demographics resolver for race filter queries

### Changed
- Replace per-tactic `weeksVsDaysCheck` with aggregate program weeks coverage analysis

### Fixed
- Route `testMostRecentFieldPlan` through `isTestMode` instead of monkey-patching `MailApp.sendEmail`

## [1.2.0] - 2026-03-04
### Added
- BigQuery query builder configuration module and county precinct config
- Query resolver functions for BigQuery integration
- `programDays` getter and test helper for date-based validation
- Weeks-vs-days alignment check on `TacticProgram`
- `analyzeTacticFlags` cross-tactic validation function (weeks vs days, identical/similar inputs, volunteer hours, weekly attempts)
- Validation flags rendered in tactic sections and action items
- Flag-aware stats and aggregate metrics in Quick Overview grid
- Context-aware projection messages with volunteer hours warnings
- Per-tactic APPROVE/REVIEW/NEEDS EDITS/REJECT badges
- Grouped action items by check type with bullet lists for multi-tactic flags

### Changed
- Simplify `testWeeksVsDaysCheck` to read columns directly
- Reorder email sections: action items and tactics before informational sections
- Make Estimated Reach a full-width card with flag-aware coloring; remove FTE Equivalent
- Move recommendation and follow-up to top of action items; escalate follow-up when flagged
- Restructure `buildActionItemsSection` to build actions top-down in display order
- Route `sendFieldPlanEmail` through `getEmailRecipients` for consistent test/production routing
- Add `VOLUNTEER_HOURS_THRESHOLD` constant
- Add external request OAuth scope for BigQuery integration

### Fixed
- Remove broken `setProperty` call in `processAllFieldPlans` that crashed on every row
- Add `[TEST]` subject prefix and recipient logging to `sendFieldPlanEmail`

## [1.1.0] - 2026-02-24
### Added
- REPROCESS columns to field plan and budget column mappings
- Reprocess trigger handler (`onSpreadsheetEdit`) to detect checkbox edits
- `reprocessFieldPlanRow()` and `reprocessBudgetRow()` row reprocessors
- `createReprocessTrigger()` and `setupReprocessColumns()` setup helpers
- Reprocess Setup submenu to the custom Apps Script menu
- Changelog to establish v1 of this project

### Changed
- Flatten fieldplan_analyzer directory structure
- Replace all `var` with `const`/`let` in source files

## [1.0.0] - 2026-02-24

Initial versioned release, consolidating all work to date.

### Added
- 2026 copies of code with field coordination replacements
- Spreadsheet reference to new JotForm
- Column mapping file and column questions with validation functions
- Column mapping test function and logging summary test
- Reverse column lookup function for searching columns by index
- Complete column map function for documentation
- Full column mapping test suite
- TypeScript migration doc
- Table columns for field plan display
- Demo formatting items: demoAffinity and demoNotes
- Attended training getter and Training & Preparation section
- New getters and updated email rendering
- Comment placeholders for later fixes
- `buildFieldPlanEmailHTML` main builder function
- Detect and flag incomplete tactic goals in field plan emails
- Narrative rendering to analysis email
- Flag incomplete tactic goals in budget analysis email
- README for 2026 FieldPlan Analyzer
- Updated gitignore to ignore more things

### Changed
- Updated column constructors in field plan parent class; corrected submissionDate to submissionDateTime
- Updated field precincts line; updated field plan column getters and helper functions
- Complete rewrite of tactics extension class for simplicity and maintainability
- Refactored messages about reasonable and realistic tactic goals
- Rewrite entire `getTacticsInstances` function with new configuration
- Replace entire `getFieldTacticDetails` function with simpler dynamic version
- Replace `instanceof` checks with `tacticKey` property in budget analysis
- Update `analyzeTactic` to use centralized `TACTIC_BUDGET_MAP`
- Move example CSVs to subdirectory and remove stale report
- Replace `getTacticMetrics` switch/case with unified class methods
- Move `generateWeeklySummary` to field_trigger_functions
- Centralize `BUDGET_COLUMNS` in column_mappings.js
- Split trigger files by concern into 4 focused modules
- Use `TACTIC_CONFIG` for cost targets; add `setupScriptProperties`
- Extract shared email infrastructure and restyle 5 email types
- Replace `SpreadsheetApp.getActive()` with centralized `openById()` helpers
- Redesign email templates with Material Design styling
- Refine email header hierarchy and visual polish
- Render multi-value fields as bullet lists; use rust-colored headers
- Replace demographics count with estimated reach in quick overview
- Simplify budget summary text for quick scanning
- Render request summary as bulleted list
- Promote org name over email type label in shell header

### Fixed
- Rewrite `checkIfCanIncreaseFunding` and remove duplicate getter
- Corrected improper mapping of `this._submissionid` to `SUBMISSIONURL`
- Expand `analyzeGaps` to all 7 tactic categories and fix `hasFieldTactic`
- Complete `analyzeGaps` function body using `TACTIC_BUDGET_MAP`
- Remove hardcoded 2025 sheet name fallbacks from trigger functions
- Fix misspelling `programAttemts` to `programAttempts`
- Remove remaining 2025 sheet name references from budget and field
- Replace `FieldPlan.COLUMNS` references with `FIELD_PLAN_COLUMNS`
- Replace hardcoded 2025 sheet names in test files
- Remove all remaining 2025 sheet name references
- Replace `FieldPlan.COLUMNS` and `fieldPlanConfidence` in test functions
- Rewrite `needsCoaching` with 2026 confidence scores and clean up email
- Resolve load-time crashes on fresh Apps Script projects
- Rename column mapping so it loads first
- Correct what is passed to the filter function
- Correct `BUDGET_COLUMNS` to 0-based indexing
- Split newline-separated form values; use rust email headers
- Split multi-select fields on newlines instead of commas
- Remove secrets from READMEs and gitignore `_globals.js`
- Minor bug fixes to column_mapping file

### Removed
- Duplicate column mappings
- Exposure of spreadsheet name in business logic
- Exposed emails, spreadsheet names, and hard-coded settings (moved to script properties)
- `generateWeeklySummary` from budget_trigger_functions
- Funding increase recommendation functions
- Guides from the 2026_analyzer README
- Example data and developing references from syncing
