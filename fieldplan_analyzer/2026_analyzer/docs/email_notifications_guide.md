# Email Notifications Guide - FieldPlan Analyzer

## Overview

The FieldPlan Analyzer app triggers various email notifications throughout its automated processing workflow. This guide provides a comprehensive reference for all email types, their triggers, recipients, and content details.

## Summary of Email Types

1. **Budget Analysis Email** - Comprehensive cost analysis when budget matches field plan
2. **Missing Field Plan Alert** - Sent after 72 hours when budget lacks field plan
3. **Budget Analysis Error Notification** - Error handling for budget processing
4. **Combined Weekly Summary Report** - Monday report with both budget and field plan data
5. **Field Plan Notification Email** - Sent for each new field plan submission
6. **Field Plan Processing Error Emails** - Two types for error scenarios
7. **Missing Budget Alert** - Sent after 72 hours when field plan lacks budget

## Email Types and Details

### 1. Budget Analysis Email

**Function**: `sendBudgetAnalysisEmail()` (budget_trigger_functions.js, lines 296-384)

**Trigger Condition**: 
- When a budget has a matching field plan and analysis is completed
- Triggered during the 12-hour automated analysis cycle

**Email Details**:
- **Subject**: `Budget Analysis: [Organization Name]`
- **Recipients**: Configured email list (default: gabri@alforward.org, sherri@alforward.org, deanna@alforward.org, datateam@alforward.org)
- **Sender Name**: "Budget Analysis System"

**Email Contents**:
1. **Budget Summary Section**
   - Total amount requested
   - Funding gap (converted to positive if negative)
   - Total project cost
   - Special note if program is entirely funded by this request

2. **Cost Breakdown**
   - Indirect costs (admin, data, travel, etc.) with percentage
   - Outreach costs (canvass, phone, text, etc.) with percentage
   - Data stipend analysis showing potential labor hours offset

3. **Tactic Cost Analysis** (for each active tactic)
   - Funding requested for the tactic
   - Total program attempts planned
   - Calculated cost per attempt
   - Target cost range (with standard deviation)
   - Status indicator (within/above/below target range)
   - Specific recommendation for the tactic

4. **Gap Funding Analysis Table**
   - Visual table showing gaps by tactic
   - Gap amounts for each category
   - Recommendations on whether to fund the gap
   - Notes about negative gaps converted to positive

5. **Field Plan Connection**
   - Field plan submission date
   - Confidence level (1-10 scale)
   - Coaching needs assessment message

### 2. Missing Field Plan Alert

**Function**: `sendMissingFieldPlanNotification()` (budget_trigger_functions.js, lines 424-448)

**Trigger Condition**: 
- When a budget has been waiting for a matching field plan for more than 72 hours
- Checked during each 12-hour analysis cycle

**Email Details**:
- **Subject**: `Missing Field Plan: [Organization Name]`
- **Recipients**: Same configured email list
- **Sender Name**: "Budget Analysis System"

**Email Contents**:
- Organization name prominently displayed
- Alert that budget was submitted 72+ hours ago
- Explanation that budget analysis cannot be completed without field plan
- Call to action to follow up with the organization
- No technical details or error messages

### 3. Budget Analysis Error Notification

**Function**: `sendErrorNotification()` (budget_trigger_functions.js, lines 451-475)

**Trigger Condition**: 
- When an error occurs during budget processing
- Sent immediately when error is caught

**Email Details**:
- **Subject**: `Budget Analysis Error: [Organization Name]`
- **Recipients**: Same configured email list
- **Sender Name**: "Budget Analysis System"

**Email Contents**:
- Organization name
- Specific error message
- Note that analysis could not be completed
- Instruction to check Apps Script logs for details
- Technical information for debugging

### 4. Combined Weekly Summary Report

**Function**: `generateWeeklySummary()` (budget_trigger_functions.js, lines 507-775)

**Trigger Condition**: 
- Scheduled weekly trigger
- Default: Monday at 9:00 AM
- Configurable via script properties

**Email Details**:
- **Subject**: `Weekly Summary Report - [Date]`
- **Recipients**: Same configured email list
- **Sender Name**: "Field Plan & Budget Analysis System"

**Email Contents**:
1. **Field Plan Activity**
   - New field plans submitted this week
   - Total active field plans
   - Field plans missing budgets

2. **Budget Analysis Status**
   - Budgets analyzed
   - Budgets pending analysis
   - Budgets missing field plans

3. **Financial Summary**
   - Total requested this week
   - Total requested overall
   - Total gap identified

4. **Tactic Distribution**
   - Table showing number of programs per tactic type
   - Only shows tactics with active programs

5. **Geographic Coverage**
   - Counties with active programs
   - Number of programs per county (sorted by count)

6. **Organizations Needing Follow-Up**
   - Field plans missing budgets (>72 hours)
   - Budgets missing field plans (>72 hours)
   - Days since submission for each

7. **Coaching Needs Summary**
   - High need (1-5): X organizations
   - Medium need (6-8): Y organizations  
   - Low need (9-10): Z organizations

### 5. Field Plan Notification Email

**Function**: `sendFieldPlanEmail()` (field_trigger_functions.js, lines 181-339)

**Trigger Condition**: 
- When a new field plan is detected in the spreadsheet
- Checked every 12 hours via `checkForNewRows()`

**Email Details**:
- **Subject**: `New Field Plan: [Organization Name]`
- **Recipients**: Same configured email list
- **Sender Name**: "Field Plan Notification System"

**Email Contents**:
1. **Contact Information**
   - Organization name
   - Contact person (first and last name)
   - Email address
   - Phone number

2. **Program Details**
   - Data storage methods (comma-separated list)
   - VAN committee ID
   - Program tools being used
   - Counties covered

3. **Demographics Section**
   - Race categories targeted
   - Age groups targeted
   - Gender categories targeted
   - Affinity groups targeted

4. **Coaching Assessment**
   - Confidence score interpretation
   - Specific coaching recommendation based on score:
     - 1-5: Needs coaching, reach out to confirm
     - 6-8: May want coaching, reach out to ask
     - 9-10: Did not request coaching

5. **Field Tactic Analysis** (for each tactic with data)
   - Tactic name and metrics header
   - Program length in weeks
   - Weekly volunteers needed
   - Weekly hours per volunteer
   - Total program volunteer hours
   - Weekly contact attempts
   - Total program attempts
   - Reasonableness assessment of hourly attempts
   - Expected successful contacts based on standard rates

### 6. Field Plan Processing Error Emails

**Function**: Error handling within `sendFieldPlanEmail()` (field_trigger_functions.js)

Two types of error emails can be triggered:

#### 6a. Retry Failure Error
**Email Details**:
- **Subject**: `Error in Field Plan Email Processing`
- **Format**: Plain text (not HTML)
- **Content**: 
  - Organization name
  - Error message
  - Request to check logs

#### 6b. Critical Processing Error
**Email Details**:
- **Subject**: `Critical Error in Field Plan Processing`
- **Format**: Plain text (not HTML)
- **Content**:
  - Critical error message
  - Full error details
  - Request to check logs

### 7. Missing Budget Alert

**Function**: `sendMissingBudgetNotification()` (field_trigger_functions.js, lines 472-496)

**Trigger Condition**: 
- When a field plan has been waiting for a matching budget for more than 72 hours
- Checked during each 12-hour field plan processing cycle

**Email Details**:
- **Subject**: `Missing Budget: [Organization Name]`
- **Recipients**: Same configured email list
- **Sender Name**: "Field Plan Analysis System"

**Email Contents**:
- Organization name prominently displayed
- Alert that field plan was submitted 72+ hours ago
- Explanation that cost efficiency analysis cannot be performed without budget data
- Call to action to follow up with the organization for budget submission
- No technical details or error messages

## Email Configuration

### Recipients Configuration

All emails use centralized recipient configuration:

```javascript
EMAIL_CONFIG = {
  recipients: scriptProps.getProperty('EMAIL_RECIPIENTS') || 'gabri@alforward.org,sherri@alforward.org,deanna@alforward.org,datateam@alforward.org',
  testRecipients: scriptProps.getProperty('EMAIL_TEST_RECIPIENTS') || 'datateam@alforward.org',
  replyTo: scriptProps.getProperty('EMAIL_REPLY_TO') || 'datateam@alforward.org'
}
```

### Test Mode

When `isTestMode=true`:
- Emails only sent to test recipients (datateam@alforward.org)
- Yellow banner added to top of HTML emails
- Subject line prefixed with `[TEST]`
- Prevents accidental production emails during testing

### Script Properties

Configure these properties in Google Apps Script:
- `EMAIL_RECIPIENTS`: Comma-separated list of production recipients
- `EMAIL_TEST_RECIPIENTS`: Test mode recipients
- `EMAIL_REPLY_TO`: Reply-to address for all emails
- `TRIGGER_MISSING_PLAN_THRESHOLD_HOURS`: Hours before missing plan alert (default: 72)
- `TRIGGER_BUDGET_ANALYSIS_HOURS`: Hours between analysis runs (default: 12)
- `TRIGGER_FIELD_PLAN_CHECK_HOURS`: Hours between field plan checks (default: 12)
- `TRIGGER_WEEKLY_SUMMARY_DAY`: Day for weekly summary (default: MONDAY)
- `TRIGGER_WEEKLY_SUMMARY_HOUR`: Hour for weekly summary (default: 9)

## Processing Timeline

### Continuous Processing (Every 12 Hours)
1. **Field Plan Detection** (`checkForNewRows()`)
   - Scans for new field plan submissions
   - Sends Field Plan Notification Email for each
   - Checks for matching budget and tracks if missing
   - Sends Missing Budget Alert after 72 hours
   - Triggers immediate budget analysis if match exists

2. **Budget Analysis** (`analyzeBudgets()`)
   - Processes all unanalyzed budgets
   - Clears any missing budget tracking when budget found
   - Sends Budget Analysis Email if field plan exists
   - Tracks budgets missing field plans
   - Sends Missing Field Plan Alert after 72 hours

### Scheduled Processing
- **Combined Weekly Summary**: Monday 9 AM (default)
  - Includes both budget and field plan statistics
  - Single comprehensive report

### Error Handling
- All functions wrapped in try-catch blocks
- Errors trigger immediate notification emails
- Processing continues for other items despite individual errors

## Email Features

### HTML Formatting
Most emails use rich HTML formatting with:
- Structured sections with headers
- Bulleted lists for details
- Tables for gap analysis
- Professional styling
- Clear visual hierarchy

### Retry Logic
Field Plan emails include retry mechanism:
- 3 attempts maximum
- 1-second delay between attempts
- Fallback to plain text error email on failure

### Validation
- Email address validation before sending
- Invalid addresses logged and removed
- Ensures at least one valid recipient

### Tracking
- All email sends logged with status
- Test mode clearly indicated in logs
- Success/failure tracking for debugging

## Best Practices

1. **Testing**: Always use test mode when testing changes
2. **Recipients**: Keep recipient list up to date in script properties
3. **Monitoring**: Check logs regularly for send failures
4. **Thresholds**: Adjust timing thresholds based on workflow needs
5. **Error Handling**: Monitor error emails for system issues

## Troubleshooting

### Common Issues

1. **Emails Not Sending**
   - Check script properties for valid email addresses
   - Verify Google Apps Script email quota not exceeded
   - Check logs for specific error messages

2. **Missing Field Plan/Budget Alerts**
   - Verify 72-hour threshold is appropriate
   - Check organization name matching between sheets
   - Ensure tracking properties are being set
   - Confirm both checkForMissingBudgets() and checkForMissingFieldPlans() are running

3. **Wrong Recipients**
   - Verify EMAIL_RECIPIENTS property
   - Check test mode isn't accidentally enabled
   - Confirm email validation isn't filtering addresses

### Debug Functions

For testing specific emails:
```javascript
// Test specific organization analysis
analyzeSpecificOrganization('Org Name', true); // true = test mode

// Generate weekly summary on demand
generateWeeklySummary(true); // true = test mode

// Check for new field plans manually
checkForNewRows();

// Test missing budget notification
sendMissingBudgetNotification('Org Name', true); // true = test mode

// Test missing field plan notification
sendMissingFieldPlanNotification('Org Name', true); // true = test mode

// Check for missing documents manually
checkForMissingBudgets();
checkForMissingFieldPlans();
```

## Future Enhancements

Consider these potential improvements:
- Email templates for easier customization
- Digest mode for multiple organizations
- SMS notifications for urgent alerts
- Web dashboard to complement emails
- Configurable email frequency per recipient
- Unsubscribe mechanism for specific email types