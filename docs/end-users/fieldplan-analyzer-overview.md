---
layout: default
title: FieldPlan Analyzer Overview
---

# FieldPlan Analyzer Overview

The FieldPlan Analyzer is an automated system that processes field planning and budget data from Google Sheets, calculates cost efficiency metrics, and sends email reports with funding recommendations. It runs every 12 hours to analyze new submissions.

## What It Does

### Core Functionality

1. **Field Plan Processing**
   - Reads new field plan submissions from the `2026_field_plan` sheet
   - Extracts 76 columns of data including tactics, demographics, confidence scores, and program details
   - Sends notification emails for each new submission
   - Generates BigQuery SQL queries for voter targeting
   - Tracks last processed row to avoid duplicates

2. **Budget Analysis**
   - Reads budget data from the `2026_field_budget` sheet (57 columns)
   - Matches budgets to field plans by organization name
   - Calculates cost per attempt for 7 tactics
   - Compares costs against predefined targets
   - Identifies funding gaps and opportunities

3. **Email Reporting**
   - HTML formatted emails with analysis results
   - Cost efficiency recommendations
   - Gap funding suggestions
   - Missing field plan alerts

4. **Scheduled Operations**
   - Runs every 12 hours via Google Apps Script triggers
   - Processes new field plans automatically
   - Analyzes unanalyzed budgets
   - Sends weekly summaries (if trigger configured)

## How It Works

### The Analysis Pipeline

1. **Field Plan Detection**
   - `checkForNewRows()` runs every 12 hours
   - Checks `2026_field_plan` sheet for new rows
   - Creates FieldPlan object for each new submission
   - Sends notification email with all plan details
   - Generates BigQuery queries via `generateQueriesForFieldPlan()`

2. **Budget Processing**
   - `analyzeBudgets()` runs every 12 hours
   - Finds budgets without analysis timestamp
   - Attempts to match with field plans
   - Waits up to 72 hours for missing field plans

3. **Cost Analysis**
   - Calculates cost per attempt for each tactic
   - Compares against target ranges with standard deviations
   - Identifies which tactics are over/under funded
   - Suggests reallocation opportunities

### Data Structure

The system processes two main data types:

**Field Plans (76 columns):**
- Organization info and contacts
- Field tactics data (Door, Phone, Text, Mail, Open, Relational, Registration)
- Demographics and counties
- Program timeline and volunteer hours
- Six confidence self-assessment scores (new in 2026)
- Query builder status and reprocess checkboxes

**Budgets (57 columns):**
- 15 budget categories with requested/total/gap amounts
- Organization identifier
- Analysis status tracking and reprocess checkbox

## Key Features

### 1. **Tactic-Specific Analysis**

The analyzer evaluates 7 field tactics using `TACTIC_CONFIG`:

| Tactic | Cost Target | Range | Contact Rate |
|--------|------------|-------|--------------|
| Phone Banking | $0.66/attempt | $0.51 - $0.81 | 5-10% |
| Door Canvassing | $1.00/attempt | $0.80 - $1.20 | 5-10% |
| Open Canvassing | $0.40/attempt | $0.30 - $0.50 | 10-15% |
| Relational Organizing | $0.50/attempt | $0.35 - $0.65 | 20-30% |
| Voter Registration | $0.75/attempt | $0.55 - $0.95 | 15-25% |
| Text Banking | $0.02/attempt | $0.01 - $0.03 | 5-10% |
| Mailers | $0.50/mailer | $0.35 - $0.65 | 100% |

### 2. **Cost Efficiency Calculations**

For each tactic:
```
Cost Per Attempt = Tactic Funding / Program Attempts
```

Compares against targets with standard deviations to classify as:
- Within target range
- Above target (potentially overfunded)
- Below target (potentially underfunded)

### 3. **Gap Funding Recommendations**

When organizations report funding gaps, the analyzer:
- Calculates how gap funding would affect cost per attempt
- Checks if new costs remain within efficiency targets
- Provides specific recommendations

### 4. **Missing Plan Tracking**

- Tracks budgets without matching field plans
- Sends alerts after 72 hours
- Lists missing plans in weekly summaries

## Email Report Examples

### Budget Analysis Email

```
Subject: Budget Analysis - Community Action Group

Summary:
Community Action Group requested $50,000 and described a funding gap of $15,000.
Their project costs $85,000 to run.

Cost Analysis by Tactic:

Door Knocking:
• Funding: $25,000
• Attempts: 25,000
• Cost per attempt: $1.00
• Target: $0.80-$1.20
• Status: ✓ Within range

Phone Banking:
• Funding: $5,000
• Attempts: 20,000
• Cost per attempt: $0.25
• Target: $0.51-$0.81
• Status: ⚠ Below target - may need more funding

Gap Funding Analysis:
If you direct $8,000 of the gap toward Phone Banking:
• New cost per attempt: $0.65
• Status: ✓ Within efficiency targets
```

### Field Plan Notification

```
Subject: Field Plan Received - Community Action Group

Organization Details:
• Contact: Jane Smith (jane@example.org)
• Phone: 555-0123
• Counties: Jefferson, Madison

Program Overview:
• Duration: 12 weeks
• Total volunteer hours: 3,000
• Weekly volunteers: 25

Planned Tactics:
• Door: 5,000 attempts
• Phone: 20,000 attempts
• Text: 50,000 attempts

Coaching Assessment: 7/10 confidence
```

## Configuration

### Script Properties Required

```
SPREADSHEET_ID                        — Google Sheet containing data
SHEET_FIELD_PLAN                      — Field plan tab name (default: '2026_field_plan')
SHEET_FIELD_BUDGET                    — Budget tab name (default: '2026_field_budget')
EMAIL_RECIPIENTS                      — Comma-separated email list
LAST_PROCESSED_ROW                    — Tracks field plan processing
TRIGGER_MISSING_PLAN_THRESHOLD_HOURS  — Hours before alerting (default: 72)
```

### Cost Targets Configuration

Cost targets are defined in `TACTIC_CONFIG` in `field_tactics_extension_class.js`. Each tactic has a `costTarget` and `costStdDev` — the acceptable range is `costTarget ± costStdDev`. To change targets, edit the config object directly.

## Limitations

- **No real-time processing** - Runs on 12-hour schedule
- **Simple name matching** - May miss organizations with name variations
- **No data validation** - Assumes sheet data is correctly formatted
- **Email only reporting** - No dashboard or web interface
- **No historical tracking** - Only current state analysis

## Tips for Organizations

<div class="tip">
<strong>Submit field plans promptly</strong>: Budget analysis requires matching field plan within 72 hours.
</div>

<div class="tip">
<strong>Use consistent naming</strong>: Organization names must match exactly between field plans and budgets.
</div>

<div class="tip">
<strong>Review cost targets</strong>: Contact administrators if your program has unique cost structures.
</div>

## Technical Details

### Class Structure

1. **FieldPlan**: Base class — parses contact, geography, demographics, confidence scores
2. **FieldProgram**: Extends FieldPlan — adds volunteer hours, attempts, projections
3. **TacticProgram**: Extends FieldProgram — single config-driven class for all 7 tactics via `TACTIC_CONFIG`
4. **FieldBudget**: Standalone class — parses budget rows, tracks analyzed status

### Trigger Functions

- `checkForNewRows()`: Processes new field plans
- `analyzeBudgets()`: Analyzes unprocessed budgets
- `generateWeeklySummary()`: Weekly email summary

### Error Handling

- Try-catch blocks prevent complete failures
- Error emails sent to administrators
- Processing continues despite individual errors

## Next Steps

- Learn about the [Field Coordination Browser](./field-coordination-browser-overview)
- Read the [FAQ](../faq) for common questions
- Check [Troubleshooting](../troubleshooting) for issues
