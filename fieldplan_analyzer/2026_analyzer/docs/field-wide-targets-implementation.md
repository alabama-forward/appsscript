# Field Wide Targets Email Implementation Guide

This guide provides step-by-step instructions for implementing a function that sends a single email containing a summary table of all field plans with organization names, counties, demographics, and precincts.

## Overview

The `sendAllFieldPlansSummary()` function will:
- Read all field plans from the sheet
- Extract only the required fields (organization, counties, demographics, precincts)
- Format the data into a single HTML table
- Send one email with all organizations listed

## Step-by-Step Implementation

### Step 1: Create the Main Function

Add this function to your `field_trigger_functions.js` file:

```javascript
function sendAllFieldPlansSummary() {
  // Get the field plan sheet using your existing helper
  const sheet = getSheet('2025_field_plan');
  const data = sheet.getDataRange().getValues();
  
  // Skip header row and process all field plans
  const fieldPlans = [];
  for (let i = 1; i < data.length; i++) {
    const fieldPlan = new FieldPlan(data[i]);
    fieldPlans.push(fieldPlan);
  }
  
  // Build the email HTML
  const emailBody = buildFieldPlansTable(fieldPlans);
  
  // Send using your existing email config
  sendSummaryEmail(emailBody);
}
```

### Step 2: Create the Table Builder Function

This formats all field plans into an HTML table:

```javascript
function buildFieldPlansTable(fieldPlans) {
  let html = `
    <h2>Field Wide Targets</h2>
    <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
      <thead>
        <tr style="background-color: #f0f0f0;">
          <th>Organization</th>
          <th>Counties</th>
          <th>Demographics</th>
          <th>Precincts</th>
        </tr>
      </thead>
      <tbody>`;
  
  // Add each field plan as a row
  fieldPlans.forEach(fp => {
    html += createFieldPlanRow(fp);
  });
  
  html += `
      </tbody>
    </table>`;
  
  return html;
}
```

### Step 3: Create Row Builder Function

This handles the array data formatting:

```javascript
function createFieldPlanRow(fieldPlan) {
  // Format arrays as comma-separated strings
  const counties = Array.isArray(fieldPlan.fieldCounties) 
    ? fieldPlan.fieldCounties.join(', ') 
    : fieldPlan.fieldCounties || 'None specified';
  
  // Combine all demographics into one cell
  const demographics = formatDemographics(fieldPlan);
  
  const precincts = Array.isArray(fieldPlan.fieldPrecincts)
    ? fieldPlan.fieldPrecincts.join(', ')
    : fieldPlan.fieldPrecincts || 'None specified';
  
  return `
    <tr>
      <td>${fieldPlan.memberOrgName || 'Unknown'}</td>
      <td>${counties}</td>
      <td>${demographics}</td>
      <td>${precincts}</td>
    </tr>`;
}
```

### Step 4: Create Demographics Formatter

This combines race, age, and gender:

```javascript
function formatDemographics(fieldPlan) {
  const parts = [];
  
  if (fieldPlan.demoRace && fieldPlan.demoRace.length > 0) {
    const race = Array.isArray(fieldPlan.demoRace) 
      ? fieldPlan.demoRace.join(', ') 
      : fieldPlan.demoRace;
    parts.push(`Race: ${race}`);
  }
  
  if (fieldPlan.demoAge && fieldPlan.demoAge.length > 0) {
    const age = Array.isArray(fieldPlan.demoAge)
      ? fieldPlan.demoAge.join(', ')
      : fieldPlan.demoAge;
    parts.push(`Age: ${age}`);
  }
  
  if (fieldPlan.demoGender && fieldPlan.demoGender.length > 0) {
    const gender = Array.isArray(fieldPlan.demoGender)
      ? fieldPlan.demoGender.join(', ')
      : fieldPlan.demoGender;
    parts.push(`Gender: ${gender}`);
  }
  
  return parts.length > 0 ? parts.join('<br>') : 'None specified';
}
```

### Step 5: Create Email Sender Function

Use your existing email configuration:

```javascript
function sendSummaryEmail(htmlBody) {
  const recipients = getEmailRecipients(); // Uses your existing function
  
  try {
    MailApp.sendEmail({
      to: recipients.join(','),
      subject: 'Field Wide Targets',
      htmlBody: htmlBody,
      name: "Field Plan Summary System",
      replyTo: EMAIL_CONFIG.replyTo
    });
    Logger.log('Field Wide Targets summary email sent successfully');
  } catch (error) {
    Logger.log(`Error sending summary email: ${error.message}`);
  }
}
```

### Step 6: Add a Test Function

For testing with test recipients:

```javascript
function testFieldPlansSummary() {
  // Temporarily use test recipients
  const originalRecipients = scriptProps.getProperty('EMAIL_RECIPIENTS');
  scriptProps.setProperty('EMAIL_RECIPIENTS', 'datateam@alforward.org');
  
  sendAllFieldPlansSummary();
  
  // Restore original recipients
  scriptProps.setProperty('EMAIL_RECIPIENTS', originalRecipients);
}
```

### Step 7: Optional - Add to Your Trigger System

If you want this to run automatically:

```javascript
function createFieldSummaryTrigger() {
  // Weekly trigger example - adjust as needed
  ScriptApp.newTrigger('sendAllFieldPlansSummary')
    .timeBased()
    .everyWeeks(1)
    .onWeekDay(ScriptApp.WeekDay.MONDAY)
    .atHour(9)
    .create();
}
```

## How This Uses Your Existing Code

This implementation reuses your existing:
- `getSheet()` helper function for sheet access
- `FieldPlan` class and its getters for data extraction
- `EMAIL_CONFIG` and `getEmailRecipients()` for email configuration
- Error handling patterns
- Script properties for configuration

## Testing

1. First run `testFieldPlansSummary()` to test with only the data team email
2. Check the email format and data accuracy
3. If satisfied, run `sendAllFieldPlansSummary()` for production use
4. Optionally set up the trigger for automated sending

## Customization Options

- **Change table styling**: Modify the HTML/CSS in `buildFieldPlansTable()`
- **Add more columns**: Update the table headers and `createFieldPlanRow()` function
- **Filter organizations**: Add conditions in the main function's loop
- **Sort the table**: Sort the `fieldPlans` array before building the table