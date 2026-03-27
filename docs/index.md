---
layout: default
title: Home
---

# FieldPlan Analyzer

The FieldPlan Analyzer is an automated system that processes field planning and budget data from Google Sheets, calculates cost efficiency metrics, and sends email reports with funding recommendations. It runs every 12 hours to analyze new submissions.

## What It Does

1. **Field Plan Processing** — reads new submissions from the `2026_field_plan` sheet (76 columns), sends notification emails, and generates BigQuery SQL queries for voter targeting
2. **Budget Analysis** — reads budget data from `2026_field_budget` (57 columns), matches to field plans by org name, calculates cost per attempt for 7 tactics against configurable targets
3. **Email Reporting** — HTML formatted emails with cost efficiency analysis, gap funding recommendations, and missing field plan alerts
4. **Scheduled Operations** — runs every 12 hours via time-based triggers, with weekly summaries on Mondays

## The Analysis Pipeline

1. `checkForNewRows()` detects new field plan submissions and sends notification emails
2. `generateQueriesForFieldPlan()` produces BigQuery SQL and writes it to the `query_queue` sheet
3. `analyzeBudgets()` finds unanalyzed budgets, matches them to field plans, runs cost analysis, and sends reports
4. Missing counterparts (budget without field plan or vice versa) are tracked and alerted after 72 hours

## Tactic Cost Targets

The analyzer evaluates 7 field tactics using `TACTIC_CONFIG` in `field_tactics_extension_class.js`:

| Tactic | Cost Target | Range | Contact Rate |
|--------|------------|-------|--------------|
| Phone Banking | $0.66/attempt | $0.51 – $0.81 | 5–10% |
| Door Canvassing | $1.00/attempt | $0.80 – $1.20 | 5–10% |
| Open Canvassing | $0.40/attempt | $0.30 – $0.50 | 10–15% |
| Relational Organizing | $0.50/attempt | $0.35 – $0.65 | 20–30% |
| Voter Registration | $0.75/attempt | $0.55 – $0.95 | 15–25% |
| Text Banking | $0.02/attempt | $0.01 – $0.03 | 5–10% |
| Mailers | $0.50/mailer | $0.35 – $0.65 | 100% |

Cost per attempt = tactic funding / program attempts. Range is `costTarget ± costStdDev`.

## Data Structure

**Field Plans (76 columns):** organization info, contacts, field tactics (Door, Phone, Text, Mail, Open, Relational, Registration), demographics, counties, program timeline, volunteer hours, six confidence self-assessment scores, query builder status, and reprocess checkboxes.

**Budgets (57 columns):** 15 budget categories with requested/total/gap amounts, organization identifier, analysis status tracking, and reprocess checkbox.

## Email Report Examples

### Budget Analysis Email

```
Subject: Budget Analysis - Community Action Group

Summary:
Community Action Group requested $50,000 and described a funding gap of $15,000.
Their project costs $85,000 to run.

Cost Analysis by Tactic:

Door Knocking:
  Funding: $25,000 | Attempts: 25,000 | Cost/attempt: $1.00
  Target: $0.80-$1.20 | Status: ✓ Within range

Phone Banking:
  Funding: $5,000 | Attempts: 20,000 | Cost/attempt: $0.25
  Target: $0.51-$0.81 | Status: ⚠ Below target

Gap Funding Analysis:
If you direct $8,000 of the gap toward Phone Banking:
  New cost per attempt: $0.65 | Status: ✓ Within efficiency targets
```

### Field Plan Notification

```
Subject: Field Plan Received - Community Action Group

Organization Details:
  Contact: Jane Smith (jane@example.org) | Phone: 555-0123
  Counties: Jefferson, Madison

Program Overview:
  Duration: 12 weeks | Weekly volunteers: 25 | Total volunteer hours: 3,000

Planned Tactics:
  Door: 5,000 attempts | Phone: 20,000 attempts | Text: 50,000 attempts

Coaching Assessment: 7/10 confidence
```

## Configuration

### Script Properties

```
SPREADSHEET_ID                        — Google Sheet containing data
SHEET_FIELD_PLAN                      — Field plan tab name (default: '2026_field_plan')
SHEET_FIELD_BUDGET                    — Budget tab name (default: '2026_field_budget')
EMAIL_RECIPIENTS                      — Comma-separated email list
LAST_PROCESSED_ROW                    — Tracks field plan processing
TRIGGER_MISSING_PLAN_THRESHOLD_HOURS  — Hours before alerting (default: 72)
```

Cost targets are defined in `TACTIC_CONFIG` in `field_tactics_extension_class.js`. Each tactic has a `costTarget` and `costStdDev` — the acceptable range is `costTarget ± costStdDev`. To change targets, edit the config object directly.

## Tips for Organizations

<div class="tip">
<strong>Submit field plans promptly</strong>: Budget analysis requires a matching field plan within 72 hours.
</div>

<div class="tip">
<strong>Use consistent naming</strong>: Organization names must match exactly between field plans and budgets.
</div>

<div class="tip">
<strong>Review cost targets</strong>: Contact administrators if your program has unique cost structures.
</div>

## Developer Documentation

- [Class Structure](./developers/fieldplan-analyzer/class-structure) — `FieldPlan` → `FieldProgram` → `TacticProgram` hierarchy and `FieldBudget`
- [Timer Implementation](./developers/fieldplan-analyzer/timers) — triggers, state management, reprocess workflow
- [Query Builder](./developers/fieldplan-analyzer/query-builder) — BigQuery SQL generation, value resolution, query queue workflow
- [Spreadsheet Mapping](./developers/spreadsheet-mapping/) — `_column_mappings.js` configuration and usage

## Reference

- [Troubleshooting](./troubleshooting)
- [FAQ](./faq)
