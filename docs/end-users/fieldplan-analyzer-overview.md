---
layout: default
title: FieldPlan Analyzer Overview
---

# FieldPlan Analyzer Overview

The FieldPlan Analyzer is an automated system that processes field planning and budget data from Google Sheets, calculates cost efficiency metrics, and sends email reports with funding recommendations. It runs every 12 hours to analyze new submissions.

## What It Does

### Core Functionality

1. **Field Plan Processing**
   - Reads new field plan submissions from '2025_field_plan' sheet
   - Extracts 58 columns of data including tactics, demographics, and program details
   - Sends notification emails for each new submission
   - Tracks last processed row to avoid duplicates

2. **Budget Analysis**
   - Reads budget data from '2025_field_budget' sheet
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
   - Checks '2025_field_plan' sheet for new rows
   - Creates FieldPlan object for each new submission
   - Sends notification email with all plan details

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

**Field Plans (58 columns):**
- Organization info and contacts
- Field tactics data (Door, Phone, Text, Mail, etc.)
- Demographics and counties
- Program timeline and volunteer hours
- Coaching assessment

**Budgets (55 columns):**
- 15 budget categories with requested/total/gap amounts
- Organization identifier
- Analysis status tracking

## Key Features

### 1. **Tactic-Specific Analysis**

The analyzer evaluates 7 field tactics:
- **Door Knocking**: 5-10% contact rate, $4.50-$6.00 per attempt target
- **Phone Banking**: 5-10% contact rate, $0.30-$0.50 per attempt target
- **Text Messaging**: 1-5% response rate, $0.25-$0.50 per attempt target
- **Mail**: 1-5% response rate, $2.00-$4.00 per attempt target
- **Open Events**: Various metrics
- **Relational Organizing**: Custom thresholds
- **Registration**: Specific targets

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
• Attempts: 5,000
• Cost per attempt: $5.00
• Target: $4.50-$6.00
• Status: ✓ Within range

Phone Banking:
• Funding: $5,000
• Attempts: 20,000
• Cost per attempt: $0.25
• Target: $0.30-$0.50
• Status: ⚠ Below target - may need more funding

Gap Funding Analysis:
If you fund the $15,000 gap toward Phone Banking:
• New cost per attempt: $0.40
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
SPREADSHEET_ID - Google Sheet containing data
FIELD_PLAN_SHEET - Field plan sheet name (default: '2025_field_plan')
BUDGET_SHEET - Budget sheet name (default: '2025_field_budget')
EMAIL_RECIPIENTS - Comma-separated email list
LAST_PROCESSED_ROW - Tracks field plan processing
MISSING_THRESHOLD_HOURS - Hours before alerting (default: 72)
```

### Cost Targets Configuration

Each tactic has configurable targets:
```
[TACTIC]_TARGET - Target cost per attempt
[TACTIC]_SD - Standard deviation for range
```

Example: `DOOR_TARGET: 5.0, DOOR_SD: 0.75`

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

1. **FieldPlan**: Base class reading field plan data
2. **FieldProgram**: Extends FieldPlan with program calculations
3. **Tactic Classes**: PhoneTactic, DoorTactic, etc. with specific metrics
4. **FieldBudget**: Reads and processes budget data

### Trigger Functions

- `checkForNewRows()`: Processes new field plans
- `analyzeBudgets()`: Analyzes unprocessed budgets
- `generateWeeklySummary()`: Weekly email summary

### Error Handling

- Try-catch blocks prevent complete failures
- Error emails sent to administrators
- Processing continues despite individual errors

## Next Steps

- Learn about the [Field Coordination Browser](/appsscript/docs/end-users/field-coordination-browser-overview)
- Read the [FAQ](/appsscript/docs/faq) for common questions
- Check [Troubleshooting](/appsscript/docs/troubleshooting) for issues