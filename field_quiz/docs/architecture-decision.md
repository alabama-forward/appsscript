# Architecture Decision: Bound vs Standalone Apps Script

## Two Approaches

### Approach 1: Bound Script (Integrated)
**Example:** Your `fieldplan_analyzer` project

The Apps Script code is attached directly to a specific Google Spreadsheet. When you open the spreadsheet and go to Extensions > Apps Script, you see the code.

**How it works:**
```javascript
// Uses SpreadsheetApp.getActive() or getActiveSpreadsheet()
const sheet = SpreadsheetApp.getActive().getSheetByName('Organizations');

// Configuration via Script Properties (optional)
const sheetName = PropertiesService.getScriptProperties()
  .getProperty('SHEET_NAME') || 'default_sheet';
```

**Pros:**
- Simple setup - code lives with the data
- No need to manage spreadsheet IDs
- Easy for non-technical users to find the code
- Natural for spreadsheet-centric workflows (form submissions → same sheet)
- `SpreadsheetApp.getActive()` automatically knows which spreadsheet to use

**Cons:**
- **Tight coupling** - code is married to one specific spreadsheet
- **Hard to reuse** - to use with a different quiz, you must:
  1. Copy the entire spreadsheet
  2. Code gets duplicated
  3. Updates must be made to multiple copies
- **No version control benefits** - harder to track changes across multiple quiz instances
- **Difficult to test** - harder to test against different spreadsheets

### Approach 2: Standalone Script (Independent)
The Apps Script project exists independently and references spreadsheet(s) via IDs stored in Script Properties or a config file.

**How it works:**
```javascript
// Configuration stored in Script Properties
const SPREADSHEET_ID = PropertiesService.getScriptProperties()
  .getProperty('QUIZ_SPREADSHEET_ID');

// Or in a separate config file
const CONFIG = {
  SPREADSHEET_ID: '1ABC...XYZ',
  RESPONSES_SHEET: 'Form Responses',
  ORGANIZATIONS_SHEET: 'Organizations'
};

// Access the spreadsheet explicitly
const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
const sheet = ss.getSheetByName(CONFIG.ORGANIZATIONS_SHEET);
```

**Pros:**
- **Highly flexible** - same code can work with multiple spreadsheets
- **Better for reuse** - deploy once, configure for different quizzes
- **Version control** - one codebase, multiple deployments
- **Easier testing** - can point to test spreadsheets easily
- **Separation of concerns** - code separate from data
- **Better for CI/CD** - can deploy updates to all instances via clasp

**Cons:**
- More setup required initially
- Need to manage spreadsheet IDs securely
- Less discoverable for non-technical users
- Requires deployment management (but clasp makes this easier)

## Recommendation for field_quiz: **Standalone Script**

### Why Standalone is Better for Your Use Case

You explicitly stated: **"I want to prioritize flexibility in the project so it can be adapted for future quizzes if needed."**

This is the **key reason** to choose standalone. Here's why:

#### 1. Future Quiz Flexibility
When you create a new quiz:
```bash
# One codebase, multiple configurations
Quiz 1 (Alabama Forward): SPREADSHEET_ID = '1ABC...'
Quiz 2 (Georgia Forward): SPREADSHEET_ID = '2DEF...'
Quiz 3 (Regional Quiz):   SPREADSHEET_ID = '3GHI...'
```

Same code, different configs. No duplication.

#### 2. Configuration Management
Create a config pattern similar to what you're already using with Mailchimp:

**Option A: Script Properties (Recommended)**
```javascript
// Set via clasp or Apps Script UI
clasp run setConfig -- --spreadsheetId "1ABC..." --responsesSheet "Responses"

// Access in code
function getConfig() {
  const props = PropertiesService.getScriptProperties();
  return {
    SPREADSHEET_ID: props.getProperty('SPREADSHEET_ID'),
    RESPONSES_SHEET: props.getProperty('RESPONSES_SHEET') || 'Responses',
    ORGANIZATIONS_SHEET: props.getProperty('ORGANIZATIONS_SHEET') || 'Organizations',
    RESULTS_SHEET: props.getProperty('RESULTS_SHEET') || 'Match Results',
    FROM_EMAIL: props.getProperty('FROM_EMAIL') || 'datateam@alforward.org'
  };
}

const CONFIG = getConfig();
```

**Option B: Environment Files (with clasp)**
```javascript
// src/config.js (not pushed to Apps Script, only used locally)
// .claspignore this file

// src/config.template.js (pushed to Apps Script)
const CONFIG = {
  SPREADSHEET_ID: PropertiesService.getScriptProperties()
    .getProperty('SPREADSHEET_ID') || 'CONFIGURE_ME',
  RESPONSES_SHEET: 'Form Responses',
  ORGANIZATIONS_SHEET: 'Organizations',
  RESULTS_SHEET: 'Match Results',
  FROM_EMAIL: 'datateam@alforward.org'
};

const MAILCHIMP_CONFIG = {
  API_KEY: PropertiesService.getScriptProperties()
    .getProperty('MAILCHIMP_API_KEY') || 'CONFIGURE_ME',
  SERVER_PREFIX: 'us12', // or from properties
  LIST_ID: PropertiesService.getScriptProperties()
    .getProperty('MAILCHIMP_LIST_ID') || 'CONFIGURE_ME',
  MERGE_FIELDS: { /* ... */ },
  TAGS: { /* ... */ }
};
```

#### 3. Deployment Strategy

**Single Script, Multiple Deployments:**
```bash
# Deploy to Alabama Forward Quiz
clasp push
# Then set properties for this quiz instance

# Later, deploy to new Georgia Forward Quiz
# 1. Update scriptId in .clasp.json (or use separate clasp config)
# 2. clasp push
# 3. Set different properties for Georgia quiz
```

**Or, Multiple Projects with Shared Code:**
```
appsscript/
├── field_quiz/                    # Core reusable code
│   ├── src/
│   │   ├── core_functions.js      # Shared logic
│   │   ├── config.template.js     # Config template
│   │   └── appsscript.json
│   └── .clasp.json
├── alabama_quiz/                  # Deployment 1
│   ├── .clasp.json               # Points to Alabama script
│   └── .env.properties           # Alabama-specific config
└── georgia_quiz/                  # Deployment 2
    ├── .clasp.json               # Points to Georgia script
    └── .env.properties           # Georgia-specific config
```

#### 4. Testing Benefits
```javascript
// Easy to test against different spreadsheets
function testWithSpreadsheet(testSpreadsheetId) {
  // Temporarily override config
  const originalConfig = CONFIG.SPREADSHEET_ID;
  CONFIG.SPREADSHEET_ID = testSpreadsheetId;

  // Run tests
  testMatchingLogic();
  testMailchimpIntegration();

  // Restore
  CONFIG.SPREADSHEET_ID = originalConfig;
}
```

#### 5. Better Error Handling
```javascript
function getSpreadsheet() {
  const spreadsheetId = CONFIG.SPREADSHEET_ID;

  if (!spreadsheetId || spreadsheetId === 'CONFIGURE_ME') {
    throw new Error(`
      CONFIGURATION ERROR: Spreadsheet ID not set.
      Please run: clasp run setConfig -- --spreadsheetId "YOUR_ID"
    `);
  }

  try {
    return SpreadsheetApp.openById(spreadsheetId);
  } catch (e) {
    throw new Error(`
      Cannot access spreadsheet: ${spreadsheetId}
      Make sure this script has permission to access the spreadsheet.
      Error: ${e.message}
    `);
  }
}
```

## Migration Path from Current Code

Your current `field_quiz` code uses `SpreadsheetApp.getActiveSpreadsheet()`, suggesting it started as a bound script. Here's how to convert:

### Changes Needed:

1. **Add CONFIG object** (currently missing from your code)
2. **Replace all instances of:**
   ```javascript
   // OLD (bound script)
   SpreadsheetApp.getActiveSpreadsheet()

   // NEW (standalone)
   SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID)
   ```

3. **Add configuration management:**
   ```javascript
   // Create src/config.js
   function getConfig() { /* ... */ }
   function setConfig(spreadsheetId, mailchimpApiKey, listId) { /* ... */ }
   ```

4. **Update .clasp.json** if needed (but keep standalone project structure)

5. **Test thoroughly** before deploying to production

## Recommended Project Structure

```
field_quiz/
├── .clasp.json                    # Points to standalone Apps Script project
├── src/
│   ├── config.js                  # Configuration management
│   ├── quiz_processor.js          # Main quiz processing logic
│   ├── matching_engine.js         # Organization matching logic
│   ├── mailchimp_integration.js   # Mailchimp functions
│   ├── utils.js                   # Utility functions
│   └── appsscript.json           # Manifest
├── docs/
│   ├── setup-guide.md            # How to deploy new quiz instance
│   └── architecture-decision.md  # This document
├── references/
│   └── Form responses.csv        # Sample data for development
└── README.md                     # Project overview
```

## Decision: Go Standalone

**For your field_quiz project, use a standalone Apps Script architecture** because:

1. ✅ **Flexibility** - Your primary requirement
2. ✅ **Reusability** - Multiple quizzes, one codebase
3. ✅ **Maintainability** - Updates propagate to all instances
4. ✅ **Testing** - Easier to test with different data sources
5. ✅ **Professional** - Better software engineering practices
6. ✅ **Clasp-friendly** - Works great with your local development workflow

The initial setup cost is worth the long-term flexibility and maintainability.

## Next Steps

1. Review current code and identify all `getActiveSpreadsheet()` calls
2. Create configuration management system
3. Refactor code to use `openById()`
4. Test with current Alabama Forward quiz
5. Document deployment process for future quizzes
6. Consider creating deployment templates/scripts
