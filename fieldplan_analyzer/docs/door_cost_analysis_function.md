# Door Cost Analysis Function Documentation

## Overview
The `analyzeDoorCostPerAttempt()` function calculates the cost efficiency of door-to-door canvassing programs by comparing funding requested against planned contact attempts.

## Function Input
```javascript
// The function expects a matched organization object that looks like this:
{
  orgName: "Progressive Alliance Ohio",
  budgetRow: 2,  // Row number in budget sheet
  planRow: 4     // Row number in field plan sheet
}
```

## Step-by-Step Process

### 1. **Get Budget Data**
```javascript
const budget = FieldBudget.fromSpecificRow(matchedOrg.budgetRow);
```
Creates a FieldBudget instance using the row number to fetch that organization's budget data.

### 2. **Get Field Plan Data**
```javascript
const planSheet = SpreadsheetApp.getActive().getSheetByName('2025_field_plan');
const planData = planSheet.getDataRange().getValues();
const doorTactic = new DoorTactic(planData[matchedOrg.planRow - 1]);
```
- Fetches the field plan sheet data
- Creates a DoorTactic instance (which extends FieldProgram)
- Note: Subtracts 1 from planRow because arrays are 0-indexed

### 3. **Extract Key Values**
```javascript
const canvassRequested = budget.canvassRequested || 0;
const programAttempts = doorTactic.programAttempts();
```
- Gets canvass funding amount from budget
- Calculates total door attempts using: `programLength × weeklyVolunteers × weeklyHours × hourlyAttempts`

### 4. **Handle Edge Cases**

**No funding requested:**
```javascript
if (canvassRequested === 0) {
  return { costPerAttempt: 0, meetsTarget: true, ... }
}
```

**No attempts planned:**
```javascript
if (programAttempts === 0) {
  return { costPerAttempt: Infinity, meetsTarget: false, ... }
}
```

### 5. **Calculate Cost Efficiency**
```javascript
const costPerAttempt = canvassRequested / programAttempts;
const meetsTarget = costPerAttempt <= 1.00;
```
Simple division to get cost per door knock, then checks if it's $1.00 or less.

### 6. **Generate Analysis**
```javascript
if (meetsTarget) {
  analysis = `${matchedOrg.orgName} meets the $1.00 per attempt target at $${costPerAttempt.toFixed(2)} per door attempt.`;
} else {
  analysis = `${matchedOrg.orgName} exceeds the $1.00 per attempt target at $${costPerAttempt.toFixed(2)} per door attempt.`;
}
```

## Example Calculation
If an organization:
- Requested $25,000 in canvass funding
- Plans 50,000 door attempts (from their field plan metrics)

Then:
- Cost per attempt = $25,000 ÷ 50,000 = $0.50
- Meets target? Yes (because $0.50 ≤ $1.00)
- Analysis: "Organization meets the $1.00 per attempt target at $0.50 per door attempt."

## Usage Example
```javascript
// First, get the matched organizations
const matches = findMatchingOrganizations();

// Then analyze cost per attempt for each matched organization
matches.matches.forEach(match => {
  const result = analyzeDoorCostPerAttempt(match);
  console.log(result);
});

// Example output:
{
  organization: "Progressive Alliance Ohio",
  canvassFunding: 25000,
  programAttempts: 50000,
  costPerAttempt: 0.50,
  meetsTarget: true,
  analysis: "Progressive Alliance Ohio meets the $1.00 per attempt target at $0.50 per door attempt."
}
```

## Return Object Structure
```javascript
{
  organization: string,      // Organization name
  canvassFunding: number,    // Amount requested for canvassing
  programAttempts: number,   // Total planned door attempts
  costPerAttempt: number,    // Calculated cost per attempt
  meetsTarget: boolean,      // Whether cost is ≤ $1.00
  analysis: string          // Human-readable analysis message
}
```

## Error Handling
If an error occurs during analysis, the function returns:
```javascript
{
  organization: string,
  error: true,
  message: string  // Error description
}
```