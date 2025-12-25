# Properly Referencing Sheets in Container-Bound Apps Script

This guide will help you properly reference specific tabs in your Google Spreadsheet from your Apps Script code.

## Understanding Container-Bound Scripts

Your Apps Script project is "container-bound" to a single Google Spreadsheet. This means:

1. The script is attached directly to the spreadsheet
2. The script automatically has access to the spreadsheet without needing its ID
3. Different methods are available compared to standalone scripts

## Correctly Referencing Sheets

### Step 1: Get the Active Spreadsheet

```javascript
// Correct way to get the bound spreadsheet
const spreadsheet = SpreadsheetApp.getActive();
```

**NOT** `SpreadsheetApp.getActiveSheet()` which returns a Sheet, not a Spreadsheet.

### Step 2: Get a Specific Sheet by Name

```javascript
// Get a specific sheet by name
const sheet = spreadsheet.getSheetByName('2025_field_plan');
```

### Step 3: Combined as a One-Liner

```javascript
// Get a specific sheet from the bound spreadsheet in one line
const sheet = SpreadsheetApp.getActive().getSheetByName('2025_field_plan');
```

## Required Changes for Your Files

### 1. Update FieldBudget Class (budget_class.js)

Replace these lines:

```javascript
const budgetSheet = SpreadsheetApp.getActiveSheet().getSheetByName('2025_field_budget');
```

With:

```javascript
const budgetSheet = SpreadsheetApp.getActive().getSheetByName('2025_field_budget');
```

This change needs to be made in all three static methods:
- `fromLastRow()` (around line 5)
- `fromFirstRow()` (around line 14)  
- `fromSpecificRow()` (around line 23)

### 2. Update checkForNewRows Function (budget_trigger_functions.js)

Replace:

```javascript
const sheet = SpreadsheetApp.getActiveSheet();
```

With:

```javascript
const sheet = SpreadsheetApp.getActive().getSheetByName('2025_field_plan');
```

## Best Practices

1. **Consistent Sheet References**: Always use `getActive().getSheetByName(name)` to ensure you're accessing the right sheet.

2. **Sheet Names as Constants**: Consider defining sheet names as constants at the top of your file or class:

```javascript
// At the top of your file or class
const SHEET_NAMES = {
  FIELD_PLAN: '2025_field_plan',
  FIELD_BUDGET: '2025_field_budget',
  // Add other sheet names here
};

// Then use them like this:
const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAMES.FIELD_PLAN);
```

3. **Error Handling**: Add checks to ensure the sheet exists:

```javascript
function getSheetByName(name) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(name);
  if (!sheet) {
    throw new Error(`Sheet "${name}" not found in the spreadsheet.`);
  }
  return sheet;
}
```

## Example Implementation

```javascript
// Define sheet names as constants
const SHEETS = {
  FIELD_PLAN: '2025_field_plan',
  FIELD_BUDGET: '2025_field_budget'
};

// Helper function to get sheets with error handling
function getSheet(sheetName) {
  const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(`Sheet "${sheetName}" not found. Please check the sheet name.`);
  }
  return sheet;
}

// Usage in your code
function processData() {
  const budgetSheet = getSheet(SHEETS.FIELD_BUDGET);
  const data = budgetSheet.getDataRange().getValues();
  // Process data...
}
```

By following these guidelines, your code will properly reference the specific tabs in your container-bound spreadsheet.