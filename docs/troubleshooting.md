---
layout: default
title: Troubleshooting
---

# Troubleshooting

## Emails not being sent

1. **Email quota exceeded** — Google Workspace allows 1,500 emails/day. Check Apps Script execution logs for `Service invoked too many times for one day: email`. Wait 24 hours for the quota to reset.

2. **Invalid recipient addresses** — Check the `EMAIL_RECIPIENTS` script property for typos or extra spaces.

3. **Script not authorized** — Re-authorize the script. In the Apps Script editor, run any function manually and accept the OAuth prompt.

## Analysis not running automatically

1. **Check triggers** — In the Apps Script editor, go to Triggers. Verify `checkForNewRows` and `analyzeBudgets` exist and aren't showing errors in the execution history.

2. **Check state** — Open Script Properties and look at `LAST_PROCESSED_ROW`. If it's ahead of or equal to the sheet's last row, no new rows will be processed. To force reprocessing, set it to `1` or use the `REPROCESS` checkbox on individual rows.

3. **Trigger was deleted** — Run `createSpreadsheetTrigger()` and `createBudgetAnalysisTrigger()` from the editor to recreate them. These functions check for duplicates before creating.

## "Cannot find matching field plan"

Organization names must match **exactly** between the `2026_field_plan` and `2026_field_budget` sheets. Check for:
- Trailing spaces
- Different capitalization
- Abbreviations vs. full names

## Budget shows as already analyzed but email was never sent

The `ANALYZED` column (column 55) was set to `TRUE` but the email step may have failed. To retry:
1. Clear the `ANALYZED` cell for that row
2. Check the `REPROCESS` checkbox — the `onEdit` trigger will re-run the analysis

## Reprocess checkbox not working

The reprocess feature requires an **installable** `onEdit` trigger (not a simple trigger), because it uses `MailApp`. Verify:
1. An `onSpreadsheetEdit` trigger exists in the Triggers panel
2. It's set to "On edit" for the correct spreadsheet
3. Run `createReprocessTrigger()` if missing

## Debugging a specific row

Run this in the Apps Script editor, changing the row number:

```javascript
function debugRow() {
    const plan = FieldPlan.fromSpecificRow(5);
    Logger.log(`Org: ${plan.memberOrgName}`);
    Logger.log(`Counties: ${plan.fieldCounties}`);
    Logger.log(`Tactics: ${plan.fieldTactics}`);

    const budget = FieldBudget.fromSpecificRow(3);
    Logger.log(`Budget org: ${budget.memberOrgName}`);
    Logger.log(`Requested: ${budget.requestedTotal}`);
}
```
