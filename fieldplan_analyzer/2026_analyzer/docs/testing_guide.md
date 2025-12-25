# Testing Guide - FieldPlan Analyzer

## Overview

This guide explains how to test the new field plan functionality, including the combined weekly summary and missing budget alerts.

## Test Functions Available

### Individual Test Functions

1. **`testMissingBudgetNotification()`**
   - Sends a test missing budget alert email
   - Email goes to datateam@alforward.org only
   - Use this to verify email formatting and content

2. **`testWeeklySummary()`**
   - Generates and sends the combined weekly summary in test mode
   - Includes both budget and field plan data
   - Email goes to datateam@alforward.org only

3. **`testTrackMissingBudget()`**
   - Tests the tracking mechanism for field plans without budgets
   - Creates a test organization and verifies tracking works
   - Check logs for success/failure messages

4. **`testMissingBudgetAlertFlow()`**
   - Complete test of the 72-hour alert system
   - Creates a test organization with old timestamp
   - Triggers the alert email and verifies cleanup
   - Should send an email and remove tracking

5. **`testFindMatchingBudget()`**
   - Tests the budget matching logic
   - Uses real data from your budget sheet
   - Also tests with non-existent organization

6. **`testOnBudgetSubmission()`**
   - Tests the cleanup when a budget arrives
   - Creates tracking then simulates budget submission
   - Verifies tracking is removed

### Utility Functions

7. **`viewAllMissingTrackings()`**
   - Shows all organizations currently being tracked
   - Displays how many hours ago each was submitted
   - Useful for debugging production issues

8. **`clearTestTrackings()`**
   - Removes all test organization trackings
   - Cleans up after running tests
   - Only removes organizations with "Test" in the name

9. **`runAllFieldPlanTests()`**
   - Runs all tests in sequence
   - Comprehensive test of all functionality
   - Sends multiple test emails

## How to Run Tests

### From Google Apps Script Editor

1. Open the Google Apps Script editor
2. Navigate to `field_trigger_functions.js`
3. Select a test function from the dropdown
4. Click "Run"
5. Check logs for results (View > Logs)
6. Check datateam@alforward.org for test emails

### Recommended Test Sequence

1. **Basic Functionality Test**
   ```
   Run: testFindMatchingBudget()
   Expected: Should find matches for real orgs, null for fake ones
   ```

2. **Tracking Test**
   ```
   Run: testTrackMissingBudget()
   Expected: Should log successful tracking with timestamp
   ```

3. **Email Tests**
   ```
   Run: testMissingBudgetNotification()
   Expected: Email to datateam@alforward.org with missing budget alert
   
   Run: testWeeklySummary()
   Expected: Comprehensive weekly summary email
   ```

4. **Alert Flow Test**
   ```
   Run: testMissingBudgetAlertFlow()
   Expected: Email sent and tracking removed
   ```

5. **View Current State**
   ```
   Run: viewAllMissingTrackings()
   Expected: List of all organizations being tracked
   ```

6. **Cleanup**
   ```
   Run: clearTestTrackings()
   Expected: All test organizations removed from tracking
   ```

### Or run all at once:
```
Run: runAllFieldPlanTests()
Expected: All tests run, multiple emails sent, logs show results
```

## What to Check

### In the Logs
- ✓ symbols indicate success
- ✗ symbols indicate failure
- Detailed messages for each operation
- Timestamps and organization names

### In Email (datateam@alforward.org)
- **Missing Budget Alert**: Should show organization name and 72-hour message
- **Weekly Summary**: Should show both budget and field plan statistics
- All test emails have yellow "TEST MODE" banner

### In Script Properties
After running tests, you can check Script Properties to see tracking:
1. Go to Project Settings > Script Properties
2. Look for properties starting with `MISSING_BUDGET_`
3. These show organizations being tracked with timestamps

## Troubleshooting

### No Emails Received
- Check EMAIL_TEST_RECIPIENTS property is set to datateam@alforward.org
- Verify Google Apps Script email quota not exceeded
- Check logs for error messages

### Tests Failing
- Ensure budget and field plan sheets exist with correct names
- Verify at least one row of data in each sheet
- Check column constants match your sheet structure

### Tracking Not Working
- Run `viewAllMissingTrackings()` to see current state
- Check Script Properties permissions
- Verify script has edit access to properties

## Production Testing

To test with real data but still in test mode:

1. **Test with Real Organization**
   ```javascript
   // Replace 'Real Org Name' with an actual organization
   sendMissingBudgetNotification('Real Org Name', true);
   ```

2. **Test Weekly Summary with Real Data**
   ```javascript
   generateWeeklySummary(true); // Uses real data, sends to test recipients
   ```

## Clean Production Data

If you need to clean production tracking (use with caution):

```javascript
function clearSpecificTracking(orgName) {
  const properties = PropertiesService.getScriptProperties();
  properties.deleteProperty(`MISSING_BUDGET_${orgName}`);
  properties.deleteProperty(`MISSING_PLAN_${orgName}`);
  Logger.log(`Cleared tracking for ${orgName}`);
}
```

## Monitoring in Production

After deployment, monitor the system:

1. **Weekly**: Check the combined summary email every Monday
2. **Daily**: Run `viewAllMissingTrackings()` to see pending alerts
3. **As Needed**: Use test functions to verify specific functionality

## Important Notes

- Test emails only go to datateam@alforward.org
- Production emails go to full recipient list
- 72-hour threshold applies to both test and production
- Test organizations have "Test" in their names for easy identification
- Always run `clearTestTrackings()` after testing to clean up