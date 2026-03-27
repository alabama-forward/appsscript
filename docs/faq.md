---
layout: default
title: Frequently Asked Questions
---

# Frequently Asked Questions

### How does automated analysis work?

The analyzer:
1. Checks for new submissions every 12 hours
2. Matches budgets with field plans by organization name
3. Calculates cost-per-attempt metrics against `TACTIC_CONFIG` targets
4. Sends email reports automatically

### When will I receive analysis emails?

- **New field plans**: Within 12 hours of submission
- **Budget analysis**: Within 12 hours after a matching field plan is found
- **Weekly summary**: Every Monday at 9 AM

### What if I don't receive expected emails?

1. Check your spam/junk folder
2. Verify your email address is in the `EMAIL_RECIPIENTS` script property
3. Check if Google's daily email quota has been exceeded (1,500/day for Workspace)

### How are cost-per-attempt targets determined?

Current targets are defined in `TACTIC_CONFIG` in `field_tactics_extension_class.js`:

| Tactic | Target | Range |
|--------|--------|-------|
| Door Canvassing | $1.00 | $0.80 – $1.20 |
| Phone Banking | $0.66 | $0.51 – $0.81 |
| Text Banking | $0.02 | $0.01 – $0.03 |
| Open Canvassing | $0.40 | $0.30 – $0.50 |
| Relational Organizing | $0.50 | $0.35 – $0.65 |
| Voter Registration | $0.75 | $0.55 – $0.95 |
| Mailers | $0.50 | $0.35 – $0.65 |

Range is `costTarget ± costStdDev`. To change targets, edit the `TACTIC_CONFIG` object.

### What does "confidence level" mean?

Six self-assessment scores (1–10) submitted with each field plan, indicating how prepared the organization feels:

- **8–10**: High confidence, minimal support needed
- **6–7**: Moderate confidence, light coaching recommended
- **4–5**: Low confidence, regular support needed
- **1–3**: Very low confidence, intensive coaching required

### How is the funding gap calculated?

`Funding gap = Project total − Current funding − Requested amount`

### What happens when a budget has no matching field plan?

The system tracks the missing field plan in script properties. After 72 hours (configurable via `TRIGGER_MISSING_PLAN_THRESHOLD_HOURS`), it sends an alert email and stops tracking.

### How do I reprocess a submission?

Check the `REPROCESS` checkbox in the spreadsheet row. The installable `onEdit` trigger detects it, reprocesses that row, and unchecks the box automatically.
