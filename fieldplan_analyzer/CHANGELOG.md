# Changelog — 2026 Field Plan Analyzer

All notable changes to the 2026 Field Plan Analyzer are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

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
