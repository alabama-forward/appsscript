# 2026 Field Plan Column Mapping Guide

This guide documents all spreadsheet columns for the 2026 Field Planning system and compares them to the 2025 version.

## 🚨 CRITICAL: Major Changes from 2025 to 2026

**The 2026 form has NEW questions that shift ALL column indices by 11+ positions!**

The current code mappings are **INCORRECT** for the 2026 CSV. All column constants need to be updated.

### Summary of Changes:
- **13 NEW columns** inserted before the program metrics section
- **6 NEW confidence questions** at the end (was 4, now 10 total)
- **2 NEW metadata columns** (Submission URL, Submission ID)
- **Total columns increased** from 58 in 2025 to 73 in 2026 (plus 6 metadata = 79 total)

---

## ⭐ RECOMMENDED: Centralize Column Mappings First

### Why Reorganize Before Updating?

Currently, column mappings are spread across multiple files:
- `FieldPlan.COLUMNS` in `field_plan_parent_class.js` (line ~168)
- `PROGRAM_COLUMNS` in `field_program_extension_class.js` (line ~1)

**Before updating for 2026, we recommend centralizing these into a single file.**

### Benefits of Centralizing

1. ✅ **Single Source of Truth** - Update one file when form changes
2. ✅ **Easier for 2027/2028** - Simply duplicate and update one file for future years
3. ✅ **Built-in Validation** - Verify all indices are correct automatically
4. ✅ **Clear Documentation** - Mappings become a standalone reference document
5. ✅ **No Drift** - Impossible for mappings to get out of sync across files
6. ✅ **Better Version Control** - Easy to see exactly what changed between years

### How to Centralize (Do This First!)

#### Step 1: Create Column Mappings File

Create a new file: **`src/column_mappings.js`**

This file will contain:
- All column constant definitions
- Validation functions to catch errors
- Utility functions for debugging
- Change log documentation

#### Step 2: File Structure

Your `column_mappings.js` should have this structure:

```javascript
/**
 * 2026 Field Plan Column Mappings
 *
 * This file contains ALL column index mappings for the 2026 Google Form.
 * All indices are 0-based (first column = 0).
 *
 * IMPORTANT: When the form structure changes, update this file ONLY.
 *
 * Last Updated: 2025-12-26
 * Form Version: 2026
 * Total Columns: 73 (0-72)
 */

// =============================================================================
// FIELD PLAN PARENT CLASS COLUMNS
// =============================================================================

const FIELD_PLAN_COLUMNS = {
  // Copy the updated 2026 mappings here (see tables below)
  SUBMISSIONDATETIME: 0,
  ATTENDEDTRAINING: 1,  // NEW in 2026
  MEMBERNAME: 2,
  // ... all other fields
};

// =============================================================================
// FIELD PROGRAM EXTENSION CLASS COLUMNS
// =============================================================================

const PROGRAM_COLUMNS = {
  PHONE: {
    PROGRAMLENGTH: 37,      // was 26 in 2025
    WEEKLYVOLUNTEERS: 38,   // was 27 in 2025
    WEEKLYHOURS: 39,        // was 28 in 2025
    HOURLYATTEMPTS: 40      // was 29 in 2025
  },
  // ... all other tactics
};

// =============================================================================
// VALIDATION & UTILITY FUNCTIONS (see below for complete code)
// =============================================================================

function validateColumnMappings() { /* ... */ }
function logColumnMappingSummary() { /* ... */ }
function getColumnNameByIndex(index) { /* ... */ }
```

#### Step 2.5: Add Human-Readable Questions (Highly Recommended)

In addition to column indices, add a dictionary of questions for documentation and debugging:

```javascript
// =============================================================================
// COLUMN QUESTIONS (Human-Readable Form Questions)
// =============================================================================

/**
 * Maps column constant names to their actual form questions
 * Useful for generating human-readable reports, documentation, and debugging
 */
const COLUMN_QUESTIONS = {
  // Meta
  SUBMISSIONDATETIME: "Submission Date",

  // Training & Preparation
  ATTENDEDTRAINING: "Did you attend the Field Planning Training offered by the Data Team or receive any coaching from the Field Team before completing this form?",

  // Contact Information
  MEMBERNAME: "Table Member Organization Name",
  FIRSTNAME: "Data & Tech Contact on Your Team - First Name",
  LASTNAME: "Data & Tech Contact on Your Team - Last Name",
  CONTACTEMAIL: "Data & Tech Contact's Email",
  CONTACTPHONE: "Data & Tech Contact's Phone",

  // Data & Tools
  DATASTORAGE: "Where will you store data related to your voter engagement?",
  DATASTIPEND: "You marked \"Paper\" or \"Spreadsheet\"... have you applied for a \"Data Entry\" stipend?",
  DATAPLAN: "You marked \"Paper\" or \"Spreadsheet\"... What is your plan for digitizing your data?",
  VANCOMMITTEE: "Do you have an active VAN committee at Alabama Forward?",
  DATASHARE: "Are there table members or partners with whom you would like to share your data?",
  SHAREORG: "Please mark the partner organizations with whom you would like to share your data",
  PROGRAMTOOLS: "What tools would you like access to for your program?",
  PROGRAMDATES: "What is the start date and end date of your program?",
  PROGRAMTYPES: "Select any of the activities below that will be part of your program",

  // Tactics & Locations
  FIELDTACTICS: "What tactics will you use to reach your targets?",
  TEACHCOMFORTABLE: "Mark the tactics below that you would feel comfortable teaching to other table members",
  FIELDSTAFF: "Who will make contact attempts for your program?",

  // Complex field with multiple sub-questions (using structured format)
  FIELDNARRATIVE: {
    main: "Use this space to answer the questions above",
    subQuestions: [
      "What is your field program? What do you plan to do?",
      "What issues are you working on this year?",
      "What impact do you want to have and why?",
      "Describe how you are well-positioned to execute the program?",
      "How does this program build longterm power beyond elections?"
    ],
    fullQuestion: "Field Program Narrative:\n" +
                  "• What is your field program? What do you plan to do?\n" +
                  "• What issues are you working on this year?\n" +
                  "• What impact do you want to have and why?\n" +
                  "• Describe how you are well-positioned to execute the program?\n" +
                  "• How does this program build longterm power beyond elections?"
  },

  REVIEWEDPLAN: "I have fully reviewed the Table Field Plan to understand our table-wide field coordination efforts for 2026",
  RUNNINGFOROFFICE: "Is anyone from your staff, board, or active volunteer network running for elected office in any of the districts you added to your field plan?",
  FIELDCOUNTIES: "In what counties will you conduct your program?",
  CITIES: "If you plan to work in specific cities, add each of them below. Add one city at a time.",
  KNOWSPRECINCTS: "Do you know the specific precincts you will target with your program?",
  PRECINCTS: "Add your precincts below. Add your precincts one at a time.",
  DIFFPRECINCTS: "To avoid over-saturation, we may limit our table coordination to 2 members per precinct. Are you willing to work in a precinct other than the ones you listed?",
  SPECIALGEO: "Mark if any of these special geographic areas apply to your program",

  // Demographics
  DEMORACE: "These are the racial and ethnic demographics I intend to reach through my program:",
  DEMOAGE: "These are the age demographics I intend to reach through my programs:",
  DEMOGENDER: "These are the gender and sexuality demographics I intend to reach through my programs:",
  DEMOAFFINITY: "These are additional communities I intend to reach through my programs:",
  DEMONOTES: "[If needed] Use the space below to describe your demographic targets more clearly.",
  DEMOCONFIDENCE: "I believe that my organization will effectively reach and be able to maintain relationships with all of the communities I marked above",

  // Understanding Acknowledgments
  UNDERSTANDSREASONABLE: "I understand that our field plan and associated grant applications will be primarily reviewed for how reasonable and realistic our goals are.",
  UNDERSTANDSDISBURSEMENT: "I understand that if we apply for a field-related grant, our grant disbursement will be delayed if the goals listed below aren't both reasonable and realistic.",
  UNDERSTANDSTRAINING: "I understand that attending or reviewing the Field Planning training will set us up for success when setting our goals.",

  // Confidence & Self-Assessment
  CONFIDENCEREASONABLE: "I feel confident that the field plan I am submitting meets the \"reasonable and realistic\" expectations set by the Alabama Forward data team.",
  CONFIDENCEDATA: "I feel confident in my organization's ability to use data and technology to execute our field programming",
  CONFIDENCEPLAN: "I feel confident in the field plan I am submitting for review by the data and field team",
  CONFIDENCECAPACITY: "I feel confident in my staff or volunteer capacity to implement my field plan",
  CONFIDENCESKILLS: "I feel like my organization is highly skilled in the field tactics we listed in our field plan",
  CONFIDENCEGOALS: "I feel confident that my organization can meet the attempt and contact goals we detailed in our field plan",

  // Submission Metadata
  SUBMISSIONURL: "Submission URL",
  SUBMISSIONID: "Submission ID"
};

/**
 * Maps program metric column names to their questions
 */
const PROGRAM_METRIC_QUESTIONS = {
  PROGRAMLENGTH: "Program Length (in weeks)",
  WEEKLYVOLUNTEERS: "Volunteers per Week",
  WEEKLYHOURS: "Hours per Week",
  HOURLYATTEMPTS: "Attempts each Hour"
};

/**
 * Get a question by column name
 * Handles both simple strings and structured question objects
 * @param {string} columnName - The constant name (e.g., 'MEMBERNAME')
 * @param {string} format - 'main', 'full', 'subQuestions', or 'object' (default: 'simple')
 * @returns {string|Object|Array} The form question in requested format
 */
function getQuestionByColumnName(columnName, format = 'simple') {
  const question = COLUMN_QUESTIONS[columnName];

  if (!question) {
    return 'Question not found';
  }

  // If it's a simple string, return as-is
  if (typeof question === 'string') {
    return question;
  }

  // If it's an object with sub-questions
  if (typeof question === 'object') {
    switch (format) {
      case 'main':
        return question.main;
      case 'full':
        return question.fullQuestion || question.main;
      case 'subQuestions':
        return question.subQuestions || [];
      case 'object':
        return question; // Return the whole object
      default:
        return question.main; // Default to main question
    }
  }

  return question;
}

/**
 * Check if a column has sub-questions
 * @param {string} columnName - The constant name
 * @returns {boolean} True if the column has sub-questions
 */
function hasSubQuestions(columnName) {
  const question = COLUMN_QUESTIONS[columnName];
  return typeof question === 'object' && Array.isArray(question.subQuestions);
}

/**
 * Get formatted question text for display
 * @param {string} columnName - The constant name
 * @param {boolean} includeSubQuestions - Whether to include sub-questions
 * @returns {string} Formatted question text
 */
function getFormattedQuestion(columnName, includeSubQuestions = true) {
  const question = COLUMN_QUESTIONS[columnName];

  if (!question) {
    return 'Question not found';
  }

  if (typeof question === 'string') {
    return question;
  }

  if (typeof question === 'object') {
    if (includeSubQuestions && question.fullQuestion) {
      return question.fullQuestion;
    }
    return question.main;
  }

  return question;
}

/**
 * Get a question by column index
 * @param {number} index - The column index
 * @param {string} format - Format for complex questions (default: 'simple')
 * @returns {string} The form question text
 */
function getQuestionByIndex(index, format = 'simple') {
  // Find the column name first
  for (const [key, value] of Object.entries(FIELD_PLAN_COLUMNS)) {
    if (value === index) {
      return getQuestionByColumnName(key, format);
    }
  }

  // Check program columns
  for (const [tacticName, metrics] of Object.entries(PROGRAM_COLUMNS)) {
    for (const [metricName, value] of Object.entries(metrics)) {
      if (value === index) {
        return getProgramQuestion(tacticName, metricName);
      }
    }
  }

  return 'Not mapped';
}

/**
 * Get a program metric question
 * @param {string} tacticName - The tactic (e.g., 'PHONE')
 * @param {string} metricName - The metric (e.g., 'PROGRAMLENGTH')
 * @returns {string} The full question text
 */
function getProgramQuestion(tacticName, metricName) {
  const tacticLabel = {
    PHONE: 'Phone Banking',
    DOOR: 'Door to Door Canvassing',
    OPEN: 'Open Canvassing / Tabling',
    RELATIONAL: 'Relational Organizing',
    REGISTRATION: 'Voter Registration / Registration Confirmation',
    TEXT: 'Text Banking',
    MAIL: 'Mailers'
  }[tacticName] || tacticName;

  const metricLabel = PROGRAM_METRIC_QUESTIONS[metricName] || metricName;

  return `Mark your goals in this chart >> ${tacticLabel} >> ${metricLabel}`;
}

/**
 * Generate human-readable documentation of all columns
 * Useful for sharing with your team or creating reports
 * @param {boolean} includeSubQuestions - Whether to include sub-questions for complex fields
 * @returns {string} Formatted documentation
 */
function generateColumnDocumentation(includeSubQuestions = true) {
  let doc = '=== 2026 FIELD PLAN COLUMN DOCUMENTATION ===\n\n';

  const sortedColumns = Object.entries(FIELD_PLAN_COLUMNS)
    .sort((a, b) => a[1] - b[1]);

  sortedColumns.forEach(([name, index]) => {
    doc += `Column ${index}: ${name}\n`;

    if (hasSubQuestions(name) && includeSubQuestions) {
      doc += `  Main Question: "${getQuestionByColumnName(name, 'main')}"\n`;
      doc += `  Sub-Questions:\n`;
      const subs = getQuestionByColumnName(name, 'subQuestions');
      subs.forEach((q, i) => {
        doc += `    ${i + 1}. ${q}\n`;
      });
    } else {
      const question = getQuestionByColumnName(name);
      doc += `  Question: "${question}"\n`;
    }
    doc += '\n';
  });

  doc += '\n=== PROGRAM METRICS ===\n\n';

  for (const [tacticName, metrics] of Object.entries(PROGRAM_COLUMNS)) {
    doc += `${tacticName}:\n`;
    for (const [metricName, index] of Object.entries(metrics)) {
      const question = getProgramQuestion(tacticName, metricName);
      doc += `  Column ${index}: ${metricName}\n`;
      doc += `    Question: "${question}"\n`;
    }
    doc += '\n';
  }

  return doc;
}
```

**Usage Examples:**

```javascript
// ============= SIMPLE FIELDS =============

// Get question by column name
Logger.log(getQuestionByColumnName('MEMBERNAME'));
// Output: "Table Member Organization Name"

// Get question by column index
Logger.log(getQuestionByIndex(2));
// Output: "Table Member Organization Name"

Logger.log(getQuestionByIndex(37));
// Output: "Mark your goals in this chart >> Phone Banking >> Program Length (in weeks)"

// Get program metric question
Logger.log(getProgramQuestion('PHONE', 'PROGRAMLENGTH'));
// Output: "Mark your goals in this chart >> Phone Banking >> Program Length (in weeks)"


// ============= COMPLEX FIELDS WITH SUB-QUESTIONS =============

// Get the main question only
Logger.log(getQuestionByColumnName('FIELDNARRATIVE'));
// Output: "Use this space to answer the questions above"

// Get the full formatted question with all sub-questions
Logger.log(getQuestionByColumnName('FIELDNARRATIVE', 'full'));
// Output: "Field Program Narrative:
//          • What is your field program? What do you plan to do?
//          • What issues are you working on this year?
//          • What impact do you want to have and why?
//          • Describe how you are well-positioned to execute the program?
//          • How does this program build longterm power beyond elections?"

// Get just the sub-questions as an array
const subQuestions = getQuestionByColumnName('FIELDNARRATIVE', 'subQuestions');
Logger.log(`This field has ${subQuestions.length} sub-questions:`);
subQuestions.forEach((q, i) => {
  Logger.log(`  ${i + 1}. ${q}`);
});
// Output:
//   This field has 5 sub-questions:
//     1. What is your field program? What do you plan to do?
//     2. What issues are you working on this year?
//     3. What impact do you want to have and why?
//     4. Describe how you are well-positioned to execute the program?
//     5. How does this program build longterm power beyond elections?

// Get the complete object (useful for custom formatting)
const narrativeObj = getQuestionByColumnName('FIELDNARRATIVE', 'object');
Logger.log(narrativeObj.main);
Logger.log(narrativeObj.subQuestions);

// Check if a field has sub-questions
if (hasSubQuestions('FIELDNARRATIVE')) {
  Logger.log('This field has multiple sub-questions to answer');
}

// Use formatted question helper
Logger.log(getFormattedQuestion('FIELDNARRATIVE', true));  // Include sub-questions
Logger.log(getFormattedQuestion('FIELDNARRATIVE', false)); // Main question only


// ============= DOCUMENTATION GENERATION =============

// Generate complete documentation with sub-questions
Logger.log(generateColumnDocumentation(true));

// Generate simple documentation without sub-questions
Logger.log(generateColumnDocumentation(false));


// ============= DEBUGGING =============

// See what question corresponds to data
const data = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];
for (let i = 0; i < data.length; i++) {
  const question = getQuestionByIndex(i);
  Logger.log(`Column ${i}: "${question}"`);
  Logger.log(`  Value: ${data[i]}`);
}


// ============= EMAIL GENERATION =============

// Simple field in email
function buildSimpleEmailSection(fieldPlan) {
  return `
    <h3>${getQuestionByColumnName('MEMBERNAME')}</h3>
    <p>${fieldPlan.memberOrgName || 'Not provided'}</p>
  `;
}

// Complex field with sub-questions in email
function buildNarrativeEmailSection(fieldPlan) {
  let html = `<h3>Field Program Narrative</h3>`;

  // Show the guiding questions
  html += `<p><strong>Guiding Questions:</strong></p><ul>`;
  const subs = getQuestionByColumnName('FIELDNARRATIVE', 'subQuestions');
  subs.forEach(q => {
    html += `<li>${q}</li>`;
  });
  html += `</ul>`;

  // Show the response
  html += `<div style="background-color: #f5f5f5; padding: 15px; margin-top: 10px;">`;
  html += `<strong>Response:</strong><br>${fieldPlan.fieldNarrative || 'Not provided'}`;
  html += `</div>`;

  return html;
}


// ============= REPORT GENERATION =============

// Create field plan report with both simple and complex fields
function createFieldPlanReport(fieldPlan) {
  let report = '';

  // Simple fields
  report += `${getQuestionByColumnName('MEMBERNAME')}: ${fieldPlan.memberOrgName}\n`;
  report += `${getQuestionByColumnName('ATTENDEDTRAINING')}: ${fieldPlan.attendedTraining}\n`;
  report += `${getQuestionByColumnName('CONFIDENCEDATA')}: ${fieldPlan.confidenceData}/10\n\n`;

  // Complex field with sub-questions
  report += `${getQuestionByColumnName('FIELDNARRATIVE', 'main')}:\n`;
  const subs = getQuestionByColumnName('FIELDNARRATIVE', 'subQuestions');
  subs.forEach((q, i) => {
    report += `  ${i + 1}. ${q}\n`;
  });
  report += `\nResponse: ${fieldPlan.fieldNarrative || 'Not provided'}\n`;

  return report;
}


// ============= DATA VALIDATION =============

// Validate that complex fields have responses that address sub-questions
function validateNarrativeResponse(response) {
  if (!response) {
    return { valid: false, message: 'No response provided' };
  }

  const subQuestions = getQuestionByColumnName('FIELDNARRATIVE', 'subQuestions');
  const missingTopics = [];

  // Simple check: look for keywords from each sub-question
  const keywords = [
    ['program', 'plan', 'do'],           // Question 1
    ['issues', 'working on'],            // Question 2
    ['impact', 'why'],                   // Question 3
    ['positioned', 'execute'],           // Question 4
    ['longterm', 'power', 'beyond']      // Question 5
  ];

  keywords.forEach((keywordSet, i) => {
    const hasKeyword = keywordSet.some(keyword =>
      response.toLowerCase().includes(keyword.toLowerCase())
    );
    if (!hasKeyword) {
      missingTopics.push(subQuestions[i]);
    }
  });

  if (missingTopics.length > 0) {
    return {
      valid: false,
      message: `Response may not fully address: ${missingTopics.join('; ')}`
    };
  }

  return { valid: true, message: 'Response appears complete' };
}
```

**Benefits of Including Questions:**
- 📋 **Self-Documenting Code** - Questions explain what each field means
- 🐛 **Better Debugging** - See question text when logging data
- 📊 **Dynamic Reports** - Generate human-readable reports programmatically
- 👥 **Team Communication** - Share `generateColumnDocumentation()` output
- 🔍 **Data Exploration** - Understand CSV data without referring to form

#### Step 3: Update Class Files to Use Centralized Constants

**In `field_plan_parent_class.js`:**

1. **Remove the old constant definition** - Find and remove or comment out the old `FieldPlan.COLUMNS` definition (around line 168)
2. **Update constructor to use centralized constants** - Change all references from `FieldPlan.COLUMNS.FIELDNAME` to `FIELD_PLAN_COLUMNS.FIELDNAME`

```javascript
// OLD (remove this):
// FieldPlan.COLUMNS = { ... }

// NEW in constructor - use FIELD_PLAN_COLUMNS instead of FieldPlan.COLUMNS:
constructor(rowData) {
  // Uses centralized constants from column_mappings.js
  this._memberOrgName = rowData[FIELD_PLAN_COLUMNS.MEMBERNAME];
  this._firstName = rowData[FIELD_PLAN_COLUMNS.FIRSTNAME];
  this._attendedTraining = rowData[FIELD_PLAN_COLUMNS.ATTENDEDTRAINING];
  // ... etc
}
```

**Optional - For backward compatibility:**
At the end of the class, add:
```javascript
// For backward compatibility with existing code that uses FieldPlan.COLUMNS
FieldPlan.COLUMNS = FIELD_PLAN_COLUMNS;
```

**In `field_program_extension_class.js`:**

1. **Remove the old constant definition** - Find and remove or comment out the old `PROGRAM_COLUMNS` definition at the top of the file
2. Since `PROGRAM_COLUMNS` is already a standalone constant (not attached to a class), and Google Apps Script uses global scope, the new centralized version from `column_mappings.js` will automatically be available to all files

---

## Working with Program Columns (Tactics)

### How Program Columns Work in the Centralized Structure

The 2026 structure uses the same pattern as 2025, but with centralized column mappings. Here's how it works:

#### 1. The PROGRAM_COLUMNS Structure

In your `column_mappings.js`, `PROGRAM_COLUMNS` is organized by tactic type:

```javascript
const PROGRAM_COLUMNS = {
  PHONE: {
    PROGRAMLENGTH: 37,
    WEEKLYVOLUNTEERS: 38,
    WEEKLYHOURS: 39,
    HOURLYATTEMPTS: 40
  },
  DOOR: {
    PROGRAMLENGTH: 41,
    WEEKLYVOLUNTEERS: 42,
    WEEKLYHOURS: 43,
    HOURLYATTEMPTS: 44
  },
  // ... other tactics
};
```

#### 2. The FieldProgram Base Class

The `FieldProgram` class extends `FieldPlan` and handles the shared logic for all tactics:

```javascript
class FieldProgram extends FieldPlan {
  constructor(rowData, tacticType) {
    Logger.log('FieldProgram Constructor called with tacticType:', tacticType);
    super(rowData);  // Call parent constructor to get all FieldPlan properties
    Logger.log('FieldProgram: Parent constructor completed');

    // Get the column mappings for this specific tactic
    const columns = PROGRAM_COLUMNS[tacticType];
    if (!columns) {
      throw new Error(`Invalid tactic type: ${tacticType}`);
    }

    // Helper function to validate numeric columns
    const validateColumn = (columnIndex, fieldName) => {
      const value = rowData[columnIndex];
      if (typeof value !== 'number' || isNaN(value)) {
        throw new TypeError(
          `Invalid data in column ${columnIndex}: ${fieldName} must be a valid number. Got: ${value}`
        );
      }
      if (value <= 0) {
        throw new RangeError(
          `Invalid data in column ${columnIndex}: ${fieldName} must be greater than 0. Got: ${value}`
        );
      }
      return value;
    };

    // Assign validated values using the centralized column mappings
    this._programLength = validateColumn(columns.PROGRAMLENGTH, 'Program Length');
    this._weeklyVolunteers = validateColumn(columns.WEEKLYVOLUNTEERS, 'Weekly Volunteers');
    this._weeklyHours = validateColumn(columns.WEEKLYHOURS, 'Weekly Hours');
    this._hourlyAttempts = validateColumn(columns.HOURLYATTEMPTS, 'Hourly Attempts');
  }

  // Getters
  get programLength() { return this._programLength || null; }
  get weeklyVolunteers() { return this._weeklyVolunteers || null; }
  get weeklyVolunteerHours() { return this._weeklyHours || null; }
  get hourlyAttempts() { return this._hourlyAttempts || null; }

  // Calculation methods
  programVolunteerHours() {
    return (this._weeklyVolunteers * this._weeklyHours * this._programLength);
  }

  weekVolunteerHours() {
    return (this._weeklyVolunteers * this._weeklyHours);
  }

  weeklyAttempts() {
    return (this._weeklyVolunteers * this._weeklyHours * this._hourlyAttempts);
  }

  programAttempts() {
    return (this._programLength * this._weeklyVolunteers * this._weeklyHours * this._hourlyAttempts);
  }

  reasonableRange() {
    return this._hourlyAttempts;
  }
}
```

#### 3. Tactic-Specific Classes

Each tactic extends `FieldProgram` and passes its tactic type to the parent:

```javascript
// Phone Banking
class PhoneTactic extends FieldProgram {
  constructor(rowData) {
    super(rowData, 'PHONE');  // Pass 'PHONE' to get PROGRAM_COLUMNS.PHONE
    this._name = 'Phone';
    this._phoneRange = [.05, .10];
    this._phoneReasonable = 30;
  }

  phoneAttemptReasonable() {
    const range = this.reasonableRange();
    if (range <= this._phoneReasonable) {
      return `${this._memberOrgName} has a reasonable hourly attempt where each volunteer is only expected to attempt to contact ${range} people per hour`;
    } else if (range > this._phoneReasonable && range <= this._phoneReasonable + 10) {
      return `${this._memberOrgName} is at risk of expecting too many attempts for each volunteer. They expect ${range} attempts per hour per volunteer.`;
    } else {
      return `${this._memberOrgName} is expecting an unrealistic number of attempts per hour for their volunteers. They expect ${range} contacts each hour per volunteer.`;
    }
  }

  phoneExpectedContacts() {
    const phoneLowerRange = Math.round(this.programAttempts() * this._phoneRange[0]);
    const phoneUpperRange = Math.round(this.programAttempts() * this._phoneRange[1]);
    return `${this._memberOrgName} intends to successfully reach between ${phoneLowerRange} and ${phoneUpperRange} people during the course of their ${this._programLength} week program`;
  }
}

// Door to Door Canvassing
class DoorTactic extends FieldProgram {
  constructor(rowData) {
    super(rowData, 'DOOR');  // Pass 'DOOR' to get PROGRAM_COLUMNS.DOOR
    this._name = 'Door';
    this._doorRange = [.05, .10];
    this._doorReasonable = 30;
  }

  doorAttemptReasonable() {
    const range = this.reasonableRange();
    if (range <= this._doorReasonable) {
      return `${this._memberOrgName} has a reasonable hourly attempt where each volunteer is only expected to attempt to contact ${range} people per hour`;
    } else if (range > this._doorReasonable && range <= this._doorReasonable + 10) {
      return `${this._memberOrgName} is at risk of expecting too many attempts for each volunteer. They expect ${range} attempts per hour per volunteer.`;
    } else {
      return `${this._memberOrgName} is expecting an unrealistic number of attempts per hour for their volunteers. They expect ${range} contacts each hour per volunteer.`;
    }
  }

  doorExpectedContacts() {
    const doorLowerRange = Math.round(this.programAttempts() * this._doorRange[0]);
    const doorUpperRange = Math.round(this.programAttempts() * this._doorRange[1]);
    return `${this._memberOrgName} intends to successfully reach between ${doorLowerRange} and ${doorUpperRange} people during the course of their ${this._programLength} week program`;
  }
}

// Repeat this pattern for all tactics: OPEN, RELATIONAL, REGISTRATION, TEXT, MAIL
```

#### 4. Using Tactic Classes

Here's how you use these classes in your code:

```javascript
// Example: Analyze phone banking for a field plan
const fieldPlanData = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];

// Create tactic instance
const phoneProgram = new PhoneTactic(fieldPlanData);

// Now you have access to all FieldPlan properties (inherited)
Logger.log(phoneProgram.memberOrgName);        // From FieldPlan
Logger.log(phoneProgram.contactEmail);         // From FieldPlan
Logger.log(phoneProgram.fieldTactics);         // From FieldPlan

// Plus all program metrics (from FieldProgram)
Logger.log(phoneProgram.programLength);        // From FieldProgram
Logger.log(phoneProgram.weeklyVolunteers);     // From FieldProgram
Logger.log(phoneProgram.programAttempts());    // From FieldProgram

// Plus phone-specific methods (from PhoneTactic)
Logger.log(phoneProgram.phoneAttemptReasonable());
Logger.log(phoneProgram.phoneExpectedContacts());
```

#### 5. Complete List of All Tactic Classes

You need these 7 tactic classes (no changes needed from 2025, just copy them):

| Class | Constructor Call | Tactic Type | PROGRAM_COLUMNS Key |
|-------|-----------------|-------------|---------------------|
| `PhoneTactic` | `new PhoneTactic(rowData)` | Phone Banking | `PHONE` |
| `DoorTactic` | `new DoorTactic(rowData)` | Door to Door | `DOOR` |
| `OpenTactic` | `new OpenTactic(rowData)` | Open Canvassing | `OPEN` |
| `RelationalTactic` | `new RelationalTactic(rowData)` | Relational Organizing | `RELATIONAL` |
| `RegistrationTactic` | `new RegistrationTactic(rowData)` | Voter Registration | `REGISTRATION` |
| `TextTactic` | `new TextTactic(rowData)` | Text Banking | `TEXT` |
| `MailTactic` | `new MailTactic(rowData)` | Mailers | `MAIL` |

#### 6. Key Differences from 2025

The only difference is where `PROGRAM_COLUMNS` is defined:

**2025 Structure:**
- `PROGRAM_COLUMNS` defined at top of `field_program_extension_class.js`
- Column indices: 26-53

**2026 Structure:**
- `PROGRAM_COLUMNS` defined in `column_mappings.js`
- Column indices: 37-64 (+11 shift)
- Same usage pattern in classes

The class inheritance and constructor patterns remain **exactly the same**.

#### 7. Testing Program Metrics

```javascript
function testProgramMetrics() {
  const sheet = SpreadsheetApp.getActive().getSheetByName('2026_field_plan');
  const data = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];

  // Test Phone program
  Logger.log('=== PHONE PROGRAM ===');
  const phone = new PhoneTactic(data);
  Logger.log(`Org: ${phone.memberOrgName}`);
  Logger.log(`Program Length: ${phone.programLength} weeks`);
  Logger.log(`Weekly Volunteers: ${phone.weeklyVolunteers}`);
  Logger.log(`Total Attempts: ${phone.programAttempts()}`);
  Logger.log(`Expected Contacts: ${phone.phoneExpectedContacts()}`);
  Logger.log(`Reasonable Check: ${phone.phoneAttemptReasonable()}`);

  // Test Door program
  Logger.log('\n=== DOOR PROGRAM ===');
  const door = new DoorTactic(data);
  Logger.log(`Total Attempts: ${door.programAttempts()}`);
  Logger.log(`Expected Contacts: ${door.doorExpectedContacts()}`);

  // Test all tactics that are listed in fieldTactics
  Logger.log('\n=== ACTIVE TACTICS ===');
  const fieldPlan = new FieldPlan(data);
  Logger.log(`Field Tactics: ${fieldPlan.fieldTactics}`);

  if (fieldPlan.hasFieldTactic('Phone Banking')) {
    const phone = new PhoneTactic(data);
    Logger.log(`Phone: ${phone.programAttempts()} attempts`);
  }

  if (fieldPlan.hasFieldTactic('Door to Door Canvassing')) {
    const door = new DoorTactic(data);
    Logger.log(`Door: ${door.programAttempts()} attempts`);
  }
}
```

---

## Side-by-Side Comparison: 2025 vs 2026

Use these tables to populate your centralized `FIELD_PLAN_COLUMNS` constant:

### Contact Information Section
| Field | 2025 Index | 2026 Index | Change | CSV Column Name (2026) |
|-------|-----------|-----------|--------|------------------------|
| SUBMISSIONDATETIME | 0 | 0 | ✅ No change | Submission Date |
| **ATTENDEDTRAINING** | ❌ N/A | **1** | 🆕 **NEW** | Did you attend the Field Planning Training offered by the Data Team or receive any coaching from the Field Team before completing this form? |
| MEMBERNAME | 1 | **2** | ⚠️ +1 | Table Member Organization Name |
| FIRSTNAME | 2 | **3** | ⚠️ +1 | Data & Tech Contact on Your Team - First Name |
| LASTNAME | 3 | **4** | ⚠️ +1 | Data & Tech Contact on Your Team - Last Name |
| CONTACTEMAIL | 4 | **5** | ⚠️ +1 | Data & Tech Contact's Email |
| CONTACTPHONE | 5 | **6** | ⚠️ +1 | Data & Tech Contact's Phone |

### Data & Tools Section
| Field | 2025 Index | 2026 Index | Change | CSV Column Name (2026) |
|-------|-----------|-----------|--------|------------------------|
| DATASTORAGE | 6 | **7** | ⚠️ +1 | Where will you store data related to your voter engagement? |
| DATASTIPEND | 7 | **8** | ⚠️ +1 | You marked "Paper" or "Spreadsheet"... have you applied for a "Data Entry" stipend? |
| DATAPLAN | 8 | **9** | ⚠️ +1 | You marked "Paper" or "Spreadsheet"... What is your plan for digitizing your data? |
| VANCOMMITTEE | 9 | **10** | ⚠️ +1 | Do you have an active VAN committee at Alabama Forward? |
| DATASHARE | 10 | **11** | ⚠️ +1 | Are there table members or partners with whom you would like to share your data? |
| SHAREORG | 11 | **12** | ⚠️ +1 | Please mark the partner organizations with whom you would like to share your data |
| PROGRAMTOOLS | 12 | **13** | ⚠️ +1 | What tools would you like access to for your program? |
| PROGRAMDATES | 13 | **14** | ⚠️ +1 | What is the start date and end date of your program? |
| PROGRAMTYPES | 14 | **15** | ⚠️ +1 | Select any of the activities below that will be part of your program |

### Tactics & Locations Section
| Field | 2025 Index | 2026 Index | Change | CSV Column Name (2026) |
|-------|-----------|-----------|--------|------------------------|
| FIELDTACTICS | 15 | **16** | ⚠️ +1 | What tactics will you use to reach your targets? |
| **TEACHCOMFORTABLE** | ❌ N/A | **17** | 🆕 **NEW** | Mark the tactics below that you would feel comfortable teaching to other table members |
| FIELDSTAFF | 16 | **18** | ⚠️ +2 | Who will make contact attempts for your program? |
| **FIELDNARRATIVE:** | ❌ N/A | **19** | 🆕 **NEW** | Use this space to answer the questions above |
| **REVIEWEDPLAN** | ❌ N/A | **20** | 🆕 **NEW** | I have fully reviewed the Table Field Plan to understand our table-wide field coordination efforts for 2026 |
| **RUNNINGFOROFFICE** | ❌ N/A | **21** | 🆕 **NEW** | Is anyone from your staff, board, or active volunteer network running for elected office in any of the districts you added to your field plan? |
| FIELDCOUNTIES | 17 | **22** | ⚠️ +5 | In what counties will you conduct your program? |
| **CITIES** | ❌ N/A | **23** | 🆕 **NEW** | If you plan to work in specific cities, add each of them below. Add one city at a time. |
| **KNOWSPRECINCTS** | ❌ N/A | **24** | 🆕 **NEW** | Do you know the specific precincts you will target with your program? |
| PRECINCTS | 19 | **25** | ⚠️ +6 | Add your precincts below. Add your precincts one at a time. |
| DIFFPRECINCTS | 20 | **26** | ⚠️ +6 | To avoid over-saturation, we may limit our table coordination to 2 members per precinct. Are you willing to work in a precinct other than the ones you listed? |
| **SPECIALGEO** | ❌ N/A | **27** | 🆕 **NEW** | Mark if any of these special geographic areas apply to your program |

### Demographics Section
| Field | 2025 Index | 2026 Index | Change | CSV Column Name (2026) |
|-------|-----------|-----------|--------|------------------------|
| DEMORACE | 21 | **28** | ⚠️ +7 | These are the racial and ethnic demographics I intend to reach through my program: |
| DEMOAGE | 22 | **29** | ⚠️ +7 | These are the age demographics I intend to reach through my programs: |
| DEMOGENDER | 23 | **30** | ⚠️ +7 | These are the gender and sexuality demographics I intend to reach through my programs: |
| DEMOAFFINITY | 24 | **31** | ⚠️ +7 | These are additional communities I intend to reach through my programs: |
| **DEMONOTES** | ❌ N/A | **32** | 🆕 **NEW** | [If needed] Use the space below to describe your demographic targets more clearly. |
| **DEMOCONFIDENCE** | ❌ N/A | **33** | 🆕 **NEW** | I believe that my organization will effectively reach and be able to maintain relationships with all of the communities I marked above |
| **UNDERSTANDSREASONABLE** | ❌ N/A | **34** | 🆕 **NEW** | I understand that our field plan and associated grant applications will be primarily reviewed for how reasonable and realistic our goals are. |
| **UNDERSTANDSDISBURSEMENT** | ❌ N/A | **35** | 🆕 **NEW** | I understand that if we apply for a field-related grant, our grant disbursement will be delayed if the goals listed below aren't both reasonable and realistic. |
| **UNDERSTANDSTRAINING** | ❌ N/A | **36** | 🆕 **NEW** | I understand that attending or reviewing the Field Planning training will set us up for success when setting our goals. |

### Program Metrics - Phone Banking
| Field | 2025 Index | 2026 Index | Change | CSV Column Name (2026) |
|-------|-----------|-----------|--------|------------------------|
| PHONE.PROGRAMLENGTH | 26 | **37** | ⚠️ +11 | Mark your goals in this chart >> Phone Banking >> Program Length (in weeks) |
| PHONE.WEEKLYVOLUNTEERS | 27 | **38** | ⚠️ +11 | Mark your goals in this chart >> Phone Banking >> Volunteers per Week |
| PHONE.WEEKLYHOURS | 28 | **39** | ⚠️ +11 | Mark your goals in this chart >> Phone Banking >> Hours per Week |
| PHONE.HOURLYATTEMPTS | 29 | **40** | ⚠️ +11 | Mark your goals in this chart >> Phone Banking >> Attempts each Hour |

### Program Metrics - Door to Door
| Field | 2025 Index | 2026 Index | Change | CSV Column Name (2026) |
|-------|-----------|-----------|--------|------------------------|
| DOOR.PROGRAMLENGTH | 30 | **41** | ⚠️ +11 | Mark your goals in this chart >> Door to Door Canvassing >> Program Length (in weeks) |
| DOOR.WEEKLYVOLUNTEERS | 31 | **42** | ⚠️ +11 | Mark your goals in this chart >> Door to Door Canvassing >> Volunteers per Week |
| DOOR.WEEKLYHOURS | 32 | **43** | ⚠️ +11 | Mark your goals in this chart >> Door to Door Canvassing >> Hours per Week |
| DOOR.HOURLYATTEMPTS | 33 | **44** | ⚠️ +11 | Mark your goals in this chart >> Door to Door Canvassing >> Attempts each Hour |

### Program Metrics - Open Canvassing
| Field | 2025 Index | 2026 Index | Change | CSV Column Name (2026) |
|-------|-----------|-----------|--------|------------------------|
| OPEN.PROGRAMLENGTH | 34 | **45** | ⚠️ +11 | Mark your goals in this chart >> Open Canvassing / Tabling >> Program Length (in weeks) |
| OPEN.WEEKLYVOLUNTEERS | 35 | **46** | ⚠️ +11 | Mark your goals in this chart >> Open Canvassing / Tabling >> Volunteers per Week |
| OPEN.WEEKLYHOURS | 36 | **47** | ⚠️ +11 | Mark your goals in this chart >> Open Canvassing / Tabling >> Hours per Week |
| OPEN.HOURLYATTEMPTS | 37 | **48** | ⚠️ +11 | Mark your goals in this chart >> Open Canvassing / Tabling >> Attempts each Hour |

### Program Metrics - Relational Organizing
| Field | 2025 Index | 2026 Index | Change | CSV Column Name (2026) |
|-------|-----------|-----------|--------|------------------------|
| RELATIONAL.PROGRAMLENGTH | 38 | **49** | ⚠️ +11 | Mark your goals in this chart >> Relational Organizing >> Program Length (in weeks) |
| RELATIONAL.WEEKLYVOLUNTEERS | 39 | **50** | ⚠️ +11 | Mark your goals in this chart >> Relational Organizing >> Volunteers per Week |
| RELATIONAL.WEEKLYHOURS | 40 | **51** | ⚠️ +11 | Mark your goals in this chart >> Relational Organizing >> Hours per Week |
| RELATIONAL.HOURLYATTEMPTS | 41 | **52** | ⚠️ +11 | Mark your goals in this chart >> Relational Organizing >> Attempts each Hour |

### Program Metrics - Voter Registration
| Field | 2025 Index | 2026 Index | Change | CSV Column Name (2026) |
|-------|-----------|-----------|--------|------------------------|
| REGISTRATION.PROGRAMLENGTH | 42 | **53** | ⚠️ +11 | Mark your goals in this chart >> Voter Registration / Registration Confirmation >> Program Length (in weeks) |
| REGISTRATION.WEEKLYVOLUNTEERS | 43 | **54** | ⚠️ +11 | Mark your goals in this chart >> Voter Registration / Registration Confirmation >> Volunteers per Week |
| REGISTRATION.WEEKLYHOURS | 44 | **55** | ⚠️ +11 | Mark your goals in this chart >> Voter Registration / Registration Confirmation >> Hours per Week |
| REGISTRATION.HOURLYATTEMPTS | 45 | **56** | ⚠️ +11 | Mark your goals in this chart >> Voter Registration / Registration Confirmation >> Attempts each Hour |

### Program Metrics - Text Banking
| Field | 2025 Index | 2026 Index | Change | CSV Column Name (2026) |
|-------|-----------|-----------|--------|------------------------|
| TEXT.PROGRAMLENGTH | 46 | **57** | ⚠️ +11 | Mark your goals in this chart >> Text Banking >> Program Length (in weeks) |
| TEXT.WEEKLYVOLUNTEERS | 47 | **58** | ⚠️ +11 | Mark your goals in this chart >> Text Banking >> Volunteers per Week |
| TEXT.WEEKLYHOURS | 48 | **59** | ⚠️ +11 | Mark your goals in this chart >> Text Banking >> Hours per Week |
| TEXT.HOURLYATTEMPTS | 49 | **60** | ⚠️ +11 | Mark your goals in this chart >> Text Banking >> Attempts each Hour |

### Program Metrics - Mailers
| Field | 2025 Index | 2026 Index | Change | CSV Column Name (2026) |
|-------|-----------|-----------|--------|------------------------|
| MAIL.PROGRAMLENGTH | 50 | **61** | ⚠️ +11 | Mark your goals in this chart >> Mailers >> Program Length (in weeks) |
| MAIL.WEEKLYVOLUNTEERS | 51 | **62** | ⚠️ +11 | Mark your goals in this chart >> Mailers >> Volunteers per Week |
| MAIL.WEEKLYHOURS | 52 | **63** | ⚠️ +11 | Mark your goals in this chart >> Mailers >> Hours per Week |
| MAIL.HOURLYATTEMPTS | 53 | **64** | ⚠️ +11 | Mark your goals in this chart >> Mailers >> Attempts each Hour |

### Confidence & Self-Assessment Section
| Field | 2025 Index | 2026 Index | Change | CSV Column Name (2026) |
|-------|-----------|-----------|--------|------------------------|
| **CONFIDENCEREASONABLE** | ❌ N/A | **65** | 🆕 **NEW** | I feel confident that the field plan I am submitting meets the "reasonable and realistic" expectations set by the Alabama Forward data team. |
| **CONFIDENCEDATA** | ❌ N/A | **66** | 🆕 **NEW** | I feel confident in my organization's ability to use data and technology to execute our field programming |
| **CONFIDENCEPLAN** | ❌ N/A | **67** | 🆕 **NEW** | I feel confident in the field plan I am submitting for review by the data and field team |
| **CONFIDENCECAPACITY** | ❌ N/A | **68** | 🆕 **NEW** | I feel confident in my staff or volunteer capacity to implement my field plan |
| **CONFIDENCESKILLS** | ❌ N/A | **69** | 🆕 **NEW** | I feel like my organization is highly skilled in the field tactics we listed in our field plan |
| **CONFIDENCEGOALS** | ❌ N/A | **70** | 🆕 **NEW** | I feel confident that my organization can meet the attempt and contact goals we detailed in our field plan |

**Note:** The 2025 version had 4 confidence columns (54-57) which were mapped as:
- PLANCONFIDENCE: 54
- IMPLEMENTATION: 55
- NEEDCOACHING: 56
- FPEXPERIENCE: 57

These appear to have been replaced/restructured in 2026 with 6 new confidence questions plus the understanding acknowledgments.

### Metadata Section
| Field | 2025 Index | 2026 Index | Change | CSV Column Name (2026) |
|-------|-----------|-----------|--------|------------------------|
| **SUBMISSIONURL** | ❌ N/A | **71** | 🆕 **NEW** | Submission URL |
| **SUBMISSIONID** | ❌ N/A | **72** | 🆕 **NEW** | Submission ID |

---

## Required Updates to Code

### 1. Create FIELD_PLAN_COLUMNS in column_mappings.js

In your centralized `column_mappings.js` file, add the complete 2026 mappings:

```javascript
const FIELD_PLAN_COLUMNS = {
  // Meta
  SUBMISSIONDATETIME: 0,

  // NEW: Training attendance
  ATTENDEDTRAINING: 1,

  // Contact Information
  MEMBERNAME: 2,
  FIRSTNAME: 3,
  LASTNAME: 4,
  CONTACTEMAIL: 5,
  CONTACTPHONE: 6,

  // Data & Tools
  DATASTORAGE: 7,
  DATASTIPEND: 8,
  DATAPLAN: 9,
  VANCOMMITTEE: 10,
  DATASHARE: 11,
  SHAREORG: 12,
  PROGRAMTOOLS: 13,
  PROGRAMDATES: 14,
  PROGRAMTYPES: 15,

  // Tactics & Locations
  FIELDTACTICS: 16,
  TEACHCOMFORTABLE: 17,      // NEW
  FIELDSTAFF: 18,
  FIELDNARRATIVE: 19,       // NEW
  REVIEWEDPLAN: 20,          // NEW
  RUNNINGFOROFFICE: 21,      // NEW
  FIELDCOUNTIES: 22,
  CITIES: 23,                // NEW
  KNOWSPRECINCTS: 24,        // NEW
  PRECINCTS: 25,
  DIFFPRECINCTS: 26,
  SPECIALGEO: 27,            // NEW

  // Demographics
  DEMORACE: 28,
  DEMOAGE: 29,
  DEMOGENDER: 30,
  DEMOAFFINITY: 31,
  DEMONOTES: 32,             // NEW
  DEMOCONFIDENCE: 33,        // NEW

  // Understanding Acknowledgments
  UNDERSTANDSREASONABLE: 34,    // NEW
  UNDERSTANDSDISBURSEMENT: 35,  // NEW
  UNDERSTANDSTRAINING: 36,      // NEW

  // Confidence & Self-Assessment (NEW section)
  CONFIDENCEREASONABLE: 65,
  CONFIDENCEDATA: 66,
  CONFIDENCEPLAN: 67,
  CONFIDENCECAPACITY: 68,
  CONFIDENCESKILLS: 69,
  CONFIDENCEGOALS: 70,

  // Submission Metadata
  SUBMISSIONURL: 71,         // NEW
  SUBMISSIONID: 72           // NEW
};
```

### 2. Update PROGRAM_COLUMNS in column_mappings.js

In your centralized `column_mappings.js` file, replace the placeholder `PROGRAM_COLUMNS` with the complete 2026 mappings:

```javascript
const PROGRAM_COLUMNS = {
  PHONE: {
    PROGRAMLENGTH: 37,      // was 26
    WEEKLYVOLUNTEERS: 38,   // was 27
    WEEKLYHOURS: 39,        // was 28
    HOURLYATTEMPTS: 40      // was 29
  },
  DOOR: {
    PROGRAMLENGTH: 41,      // was 30
    WEEKLYVOLUNTEERS: 42,   // was 31
    WEEKLYHOURS: 43,        // was 32
    HOURLYATTEMPTS: 44      // was 33
  },
  OPEN: {
    PROGRAMLENGTH: 45,      // was 34
    WEEKLYVOLUNTEERS: 46,   // was 35
    WEEKLYHOURS: 47,        // was 36
    HOURLYATTEMPTS: 48      // was 37
  },
  RELATIONAL: {
    PROGRAMLENGTH: 49,      // was 38
    WEEKLYVOLUNTEERS: 50,   // was 39
    WEEKLYHOURS: 51,        // was 40
    HOURLYATTEMPTS: 52      // was 41
  },
  REGISTRATION: {
    PROGRAMLENGTH: 53,      // was 42
    WEEKLYVOLUNTEERS: 54,   // was 43
    WEEKLYHOURS: 55,        // was 44
    HOURLYATTEMPTS: 56      // was 45
  },
  TEXT: {
    PROGRAMLENGTH: 57,      // was 46
    WEEKLYVOLUNTEERS: 58,   // was 47
    WEEKLYHOURS: 59,        // was 48
    HOURLYATTEMPTS: 60      // was 49
  },
  MAIL: {
    PROGRAMLENGTH: 61,      // was 50
    WEEKLYVOLUNTEERS: 62,   // was 51
    WEEKLYHOURS: 63,        // was 52
    HOURLYATTEMPTS: 64      // was 53
  }
};
```

### 3. Add Constructor Properties for New Fields

In the `constructor(rowData)` method of `FieldPlan` class (around line 40), add these new property assignments:

```javascript
constructor(rowData) {
  Logger.log('FieldPlan Constructor rowData:');
  Logger.log(rowData);
  Logger.log('FieldTactics column value:');
  Logger.log(rowData[FIELD_PLAN_COLUMNS.FIELDTACTICS]);

  // Helper function to normalize the data if they are in lists
  const normalizeField = (value) => {
    // If empty, return empty array
    if (!value) return [];
    // If already array, return as is
    if (Array.isArray(value)) return value;
    // If string with commas, split into array
    if (typeof value === 'string' && value.includes(',')) {
      return value.split(',').map(item => item.trim());
    }
    // Single value - return as single-item array
    return [value];
  };

  // Meta
  this._submissionDateTime = rowData[FIELD_PLAN_COLUMNS.SUBMISSIONDATETIME];

  // NEW: Training
  this._attendedTraining = rowData[FIELD_PLAN_COLUMNS.ATTENDEDTRAINING];

  // Contact
  this._memberOrgName = rowData[FIELD_PLAN_COLUMNS.MEMBERNAME];
  this._firstName = rowData[FIELD_PLAN_COLUMNS.FIRSTNAME];
  this._lastName = rowData[FIELD_PLAN_COLUMNS.LASTNAME];
  this._contactEmail = rowData[FIELD_PLAN_COLUMNS.CONTACTEMAIL];
  this._contactPhone = rowData[FIELD_PLAN_COLUMNS.CONTACTPHONE];

  // Data & Tools
  this._dataStorage = normalizeField(rowData[FIELD_PLAN_COLUMNS.DATASTORAGE]);
  this._dataStipend = rowData[FIELD_PLAN_COLUMNS.DATASTIPEND];
  this._dataPlan = rowData[FIELD_PLAN_COLUMNS.DATAPLAN];
  this._vanCommittee = normalizeField(rowData[FIELD_PLAN_COLUMNS.VANCOMMITTEE]);
  this._dataShare = rowData[FIELD_PLAN_COLUMNS.DATASHARE];
  this._shareOrg = normalizeField(rowData[FIELD_PLAN_COLUMNS.SHAREORG]);
  this._programTools = normalizeField(rowData[FIELD_PLAN_COLUMNS.PROGRAMTOOLS]);
  this._programDates = rowData[FIELD_PLAN_COLUMNS.PROGRAMDATES];
  this._programTypes = normalizeField(rowData[FIELD_PLAN_COLUMNS.PROGRAMTYPES]);

  // Tactics & Locations
  this._fieldTactics = normalizeField(rowData[FIELD_PLAN_COLUMNS.FIELDTACTICS]);
  this._teachComfortable = normalizeField(rowData[FIELD_PLAN_COLUMNS.TEACHCOMFORTABLE]);  // NEW
  this._fieldStaff = normalizeField(rowData[FIELD_PLAN_COLUMNS.FIELDSTAFF]);
  this._fieldNarrative = rowData[FIELD_PLAN_COLUMNS.FIELDNARRATIVE];  // NEW
  this._reviewedPlan = rowData[FIELD_PLAN_COLUMNS.REVIEWEDPLAN];  // NEW
  this._runningForOffice = rowData[FIELD_PLAN_COLUMNS.RUNNINGFOROFFICE];  // NEW
  this._fieldCounties = normalizeField(rowData[FIELD_PLAN_COLUMNS.FIELDCOUNTIES]);
  this._cities = normalizeField(rowData[FIELD_PLAN_COLUMNS.CITIES]);  // NEW
  this._knowsPrecincts = rowData[FIELD_PLAN_COLUMNS.KNOWSPRECINCTS];  // NEW
  this._fieldPrecincts = normalizeField(rowData[FIELD_PLAN_COLUMNS.PRECINCTS]);
  this._diffPrecincts = rowData[FIELD_PLAN_COLUMNS.DIFFPRECINCTS];
  this._specialGeo = normalizeField(rowData[FIELD_PLAN_COLUMNS.SPECIALGEO]);  // NEW

  // Demographics
  this._demoRace = normalizeField(rowData[FIELD_PLAN_COLUMNS.DEMORACE]);
  this._demoAge = normalizeField(rowData[FIELD_PLAN_COLUMNS.DEMOAGE]);
  this._demoGender = normalizeField(rowData[FIELD_PLAN_COLUMNS.DEMOGENDER]);
  this._demoAffinity = normalizeField(rowData[FIELD_PLAN_COLUMNS.DEMOAFFINITY]);
  this._demoNotes = rowData[FIELD_PLAN_COLUMNS.DEMONOTES];  // NEW
  this._demoConfidence = rowData[FIELD_PLAN_COLUMNS.DEMOCONFIDENCE];  // NEW

  // Understanding Acknowledgments (NEW)
  this._understandsReasonable = rowData[FIELD_PLAN_COLUMNS.UNDERSTANDSREASONABLE];
  this._understandsDisbursement = rowData[FIELD_PLAN_COLUMNS.UNDERSTANDSDISBURSEMENT];
  this._understandsTraining = rowData[FIELD_PLAN_COLUMNS.UNDERSTANDSTRAINING];

  // Confidence & Self-Assessment (NEW section - replaces old confidence fields)
  this._confidenceReasonable = rowData[FIELD_PLAN_COLUMNS.CONFIDENCEREASONABLE];
  this._confidenceData = rowData[FIELD_PLAN_COLUMNS.CONFIDENCEDATA];
  this._confidencePlan = rowData[FIELD_PLAN_COLUMNS.CONFIDENCEPLAN];
  this._confidenceCapacity = rowData[FIELD_PLAN_COLUMNS.CONFIDENCECAPACITY];
  this._confidenceSkills = rowData[FIELD_PLAN_COLUMNS.CONFIDENCESKILLS];
  this._confidenceGoals = rowData[FIELD_PLAN_COLUMNS.CONFIDENCEGOALS];

  // Submission Metadata (NEW)
  this._submissionUrl = rowData[FIELD_PLAN_COLUMNS.SUBMISSIONURL];
  this._submissionId = rowData[FIELD_PLAN_COLUMNS.SUBMISSIONID];
}
```

### 4. Add Getter Methods for New Fields

After the existing getters (around line 88), add these new getter methods:

```javascript
// Existing getters...
get submissionDateTime() { return this._submissionDateTime || null; }

// NEW: Training
get attendedTraining() { return this._attendedTraining || null; }

// Contact (existing getters remain)
get memberOrgName() { return this._memberOrgName || null; }
get firstName() { return this._firstName || null; }
get lastName() { return this._lastName || null; }
get contactEmail() { return this._contactEmail || null; }
get contactPhone() { return this._contactPhone || null; }

// Data & Tools (some existing, some NEW)
get dataStorage() { return this._dataStorage || null; }
get dataStipend() { return this._dataStipend || null; }           // NEW
get dataPlan() { return this._dataPlan || null; }                 // NEW
get vanCommittee() { return this._vanCommittee || null; }
get dataShare() { return this._dataShare || null; }               // NEW
get shareOrg() { return this._shareOrg || null; }                 // NEW
get programTools() { return this._programTools || null; }
get programDates() { return this._programDates || null; }         // NEW
get programTypes() { return this._programTypes || null; }         // NEW

// Tactics & Locations (some existing, some NEW)
get fieldTactics() { return this._fieldTactics || null; }
get teachComfortable() { return this._teachComfortable || null; } // NEW
get fieldStaff() { return this._fieldStaff || null; }             // NEW
get fieldNarrative() { return this._fieldNarrative || null; }   // NEW
get reviewedPlan() { return this._reviewedPlan || null; }         // NEW
get runningForOffice() { return this._runningForOffice || null; } // NEW
get fieldCounties() { return this._fieldCounties || null; }
get cities() { return this._cities || null; }                     // NEW
get knowsPrecincts() { return this._knowsPrecincts || null; }     // NEW
get fieldPrecincts() { return this._fieldPrecincts || null; }
get diffPrecincts() { return this._diffPrecincts || null; }       // NEW
get specialGeo() { return this._specialGeo || null; }             // NEW

// Demographics (some existing, some NEW)
get demoRace() { return this._demoRace || null; }
get demoAge() { return this._demoAge || null; }
get demoGender() { return this._demoGender || null; }
get demoAffinity() { return this._demoAffinity || null; }
get demoNotes() { return this._demoNotes || null; }               // NEW
get demoConfidence() { return this._demoConfidence || null; }     // NEW

// Understanding Acknowledgments (ALL NEW)
get understandsReasonable() { return this._understandsReasonable || null; }
get understandsDisbursement() { return this._understandsDisbursement || null; }
get understandsTraining() { return this._understandsTraining || null; }

// Confidence & Self-Assessment (ALL NEW - replaces old confidence fields)
get confidenceReasonable() { return this._confidenceReasonable || null; }
get confidenceData() { return this._confidenceData || null; }
get confidencePlan() { return this._confidencePlan || null; }
get confidenceCapacity() { return this._confidenceCapacity || null; }
get confidenceSkills() { return this._confidenceSkills || null; }
get confidenceGoals() { return this._confidenceGoals || null; }

// Submission Metadata (ALL NEW)
get submissionUrl() { return this._submissionUrl || null; }
get submissionId() { return this._submissionId || null; }
```

### 5. Add Helper Methods for New Array Fields

After existing helper methods (around line 110), add these new ones:

```javascript
// Existing array helper methods...
hasDataStorage(item) { return this._dataStorage.includes(item); }
hasProgramTool(tool) { return this._programTools.includes(tool); }
hasFieldTactic(tactic) { return this._fieldTactics.includes(tactic); }
hasFieldCounties(county) { return this._fieldCounties.includes(county); }
hasFieldPrecincts(precinct) { return this._fieldPrecincts.includes(precinct); }
hasDemoRace(race) { return this._demoRace.includes(race); }
hasDemoGender(gender) { return this._demoGender.includes(gender); }
hasDemoAffinity(affinity) { return this._demoAffinity.includes(affinity); }

// NEW helper methods for 2026 array fields
hasShareOrg(org) { return this._shareOrg.includes(org); }
hasProgramType(type) { return this._programTypes.includes(type); }
hasTeachComfortable(tactic) { return this._teachComfortable.includes(tactic); }
hasFieldStaff(staff) { return this._fieldStaff.includes(staff); }
hasCity(city) { return this._cities.includes(city); }
hasSpecialGeo(area) { return this._specialGeo.includes(area); }
```

### 6. Update or Remove the needsCoaching() Method

The old `needsCoaching()` method (line 150) used `this._fieldPlanConfidence` which no longer exists in the 2026 form. You should either:

**Option A: Update to use new confidence metrics**
```javascript
needsCoaching() {
  // Use average of multiple confidence scores
  const avgConfidence = (
    (this._confidenceReasonable || 0) +
    (this._confidenceData || 0) +
    (this._confidencePlan || 0) +
    (this._confidenceCapacity || 0) +
    (this._confidenceSkills || 0) +
    (this._confidenceGoals || 0)
  ) / 6;

  let message = '';

  if (avgConfidence <= 5) {
    message = `${this._memberOrgName} had an average confidence score of ${avgConfidence.toFixed(1)}.
    Reach out to them to confirm what coaching they will need.`;
  } else if (avgConfidence >= 6 && avgConfidence <= 8) {
    message = `${this._memberOrgName} had an average confidence score of ${avgConfidence.toFixed(1)}.
    Reach out to them to ask if they would like some coaching on their field plan.`;
  } else {
    message = `${this._memberOrgName} had an average confidence score of ${avgConfidence.toFixed(1)}.
    They did not request coaching on their field plan.`;
  }
  Logger.log(message);
  return message;
}
```

**Option B: Create more specific coaching assessment**
```javascript
needsCoaching() {
  const lowConfidenceAreas = [];

  if (this._confidenceReasonable <= 5) lowConfidenceAreas.push('meeting expectations');
  if (this._confidenceData <= 5) lowConfidenceAreas.push('using data and technology');
  if (this._confidencePlan <= 5) lowConfidenceAreas.push('field plan quality');
  if (this._confidenceCapacity <= 5) lowConfidenceAreas.push('staff/volunteer capacity');
  if (this._confidenceSkills <= 5) lowConfidenceAreas.push('field tactic skills');
  if (this._confidenceGoals <= 5) lowConfidenceAreas.push('meeting goals');

  if (lowConfidenceAreas.length > 0) {
    return `${this._memberOrgName} needs coaching in: ${lowConfidenceAreas.join(', ')}`;
  } else {
    return `${this._memberOrgName} appears confident in all areas of their field plan.`;
  }
}
```

---

## Testing Your Updates

After making all the changes above, test with:

```javascript
// Test reading the last row
function testLastRow() {
  const plan = FieldPlan.fromLastRow();

  // Test existing fields still work
  Logger.log('Org Name: ' + plan.memberOrgName);
  Logger.log('First Name: ' + plan.firstName);
  Logger.log('Email: ' + plan.contactEmail);

  // Test NEW fields
  Logger.log('Attended Training: ' + plan.attendedTraining);
  Logger.log('Teaches Comfortable: ' + plan.teachComfortable);
  Logger.log('Running for Office: ' + plan.runningForOffice);
  Logger.log('Cities: ' + plan.cities);
  Logger.log('Special Geographic Areas: ' + plan.specialGeo);
  Logger.log('Demo Notes: ' + plan.demoNotes);
  Logger.log('Understands Reasonable: ' + plan.understandsReasonable);
  Logger.log('Confidence - Data: ' + plan.confidenceData);
  Logger.log('Submission URL: ' + plan.submissionUrl);

  // Test coaching assessment
  Logger.log(plan.needsCoaching());
}

// Test program metrics still work
function testPhoneProgram() {
  const plan = FieldPlan.fromLastRow();
  const phoneProgram = new PhoneTactic(plan);

  Logger.log('Program Length: ' + phoneProgram.programLength);
  Logger.log('Weekly Volunteers: ' + phoneProgram.weeklyVolunteers);
  Logger.log('Total Attempts: ' + phoneProgram.programAttempts());
  Logger.log(phoneProgram.phoneExpectedContacts());
}
```

---

## Summary of New Fields to Map

### Fields That Need Normalization (Arrays)
Use `normalizeField()` for these:
- `teachComfortable` (column 17)
- `shareOrg` (column 12)
- `programTypes` (column 15)
- `fieldStaff` (column 18)
- `cities` (column 23)
- `specialGeo` (column 27)

### Fields That Are Simple Values (Strings/Numbers)
Direct assignment for these:
- `attendedTraining` (column 1)
- `dataStipend` (column 8)
- `dataPlan` (column 9)
- `dataShare` (column 11)
- `programDates` (column 14)
- `fieldNarrative` (column 19)
- `reviewedPlan` (column 20)
- `runningForOffice` (column 21)
- `knowsPrecincts` (column 24)
- `diffPrecincts` (column 26)
- `demoNotes` (column 32)
- `demoConfidence` (column 33)
- `understandsReasonable` (column 34)
- `understandsDisbursement` (column 35)
- `understandsTraining` (column 36)
- `confidenceReasonable` (column 65)
- `confidenceData` (column 66)
- `confidencePlan` (column 67)
- `confidenceCapacity` (column 68)
- `confidenceSkills` (column 69)
- `confidenceGoals` (column 70)
- `submissionUrl` (column 71)
- `submissionId` (column 72)

---

## Quick Reference: Field Name Patterns

When creating properties and getters, follow these naming conventions:

### Property Names (with underscore prefix)
```javascript
this._attendedTraining
this._teachComfortable
this._fieldNarrative
```

### Getter Names (camelCase, no prefix)
```javascript
get attendedTraining()
get teachComfortable()
get fieldnarrative:()
```

### Helper Method Names (for arrays)
```javascript
hasTeachComfortable(tactic)
hasCity(city)
hasSpecialGeo(area)
```

---

## Validation & Utility Functions

Add these functions to your `column_mappings.js` file to help maintain and debug your column mappings.

### Function 1: Validate Column Mappings

```javascript
/**
 * Validates that all column indices are unique and within expected range
 * Run this after making changes to ensure no conflicts
 * @returns {Object} Validation results with errors, warnings, and stats
 */
function validateColumnMappings() {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    stats: {}
  };

  // Collect all column indices from FIELD_PLAN_COLUMNS
  const fieldPlanIndices = new Set();
  const duplicates = [];

  for (const [key, value] of Object.entries(FIELD_PLAN_COLUMNS)) {
    // Check if value is a number
    if (typeof value !== 'number') {
      results.errors.push(`FIELD_PLAN_COLUMNS.${key} is not a number: ${value}`);
      results.valid = false;
      continue;
    }

    // Warn about unusual indices
    if (value < 0 || value > 100) {
      results.warnings.push(`FIELD_PLAN_COLUMNS.${key} has unusual index: ${value}`);
    }

    // Check for duplicates
    if (fieldPlanIndices.has(value)) {
      duplicates.push(`Column ${value} is mapped multiple times in FIELD_PLAN_COLUMNS`);
      results.valid = false;
    }
    fieldPlanIndices.add(value);
  }

  if (duplicates.length > 0) {
    results.errors.push(...duplicates);
  }

  // Collect all column indices from PROGRAM_COLUMNS
  const programIndices = new Set();
  for (const [tacticName, metrics] of Object.entries(PROGRAM_COLUMNS)) {
    for (const [metricName, value] of Object.entries(metrics)) {
      if (typeof value !== 'number') {
        results.errors.push(`PROGRAM_COLUMNS.${tacticName}.${metricName} is not a number: ${value}`);
        results.valid = false;
        continue;
      }

      if (programIndices.has(value)) {
        results.errors.push(`Column ${value} is mapped multiple times in PROGRAM_COLUMNS`);
        results.valid = false;
      }
      programIndices.add(value);
    }
  }

  // Check for overlap between FIELD_PLAN and PROGRAM columns
  const overlap = [...fieldPlanIndices].filter(idx => programIndices.has(idx));
  if (overlap.length > 0) {
    results.errors.push(`Column overlap detected between FIELD_PLAN and PROGRAM: ${overlap.join(', ')}`);
    results.valid = false;
  }

  // Calculate statistics
  results.stats = {
    totalFieldPlanColumns: fieldPlanIndices.size,
    totalProgramColumns: programIndices.size,
    totalMappedColumns: fieldPlanIndices.size + programIndices.size,
    fieldPlanRange: `${Math.min(...fieldPlanIndices)}-${Math.max(...fieldPlanIndices)}`,
    programRange: `${Math.min(...programIndices)}-${Math.max(...programIndices)}`
  };

  return results;
}
```

**What it does:**
- ✅ Checks that all column indices are numbers
- ✅ Ensures no duplicate column mappings within each constant
- ✅ Checks for overlaps between FIELD_PLAN and PROGRAM columns
- ⚠️ Warns about unusual column indices (< 0 or > 100)
- 📊 Provides statistics about your mappings

**How to use it:**
```javascript
function testColumnMappings() {
  const results = validateColumnMappings();

  Logger.log('=== Column Mapping Validation ===');
  Logger.log(`Status: ${results.valid ? '✅ VALID' : '❌ ERRORS FOUND'}`);

  if (results.errors.length > 0) {
    Logger.log('\n❌ ERRORS:');
    results.errors.forEach(err => Logger.log(`   ${err}`));
  }

  if (results.warnings.length > 0) {
    Logger.log('\n⚠️ WARNINGS:');
    results.warnings.forEach(warn => Logger.log(`   ${warn}`));
  }

  Logger.log('\n📊 STATS:');
  Logger.log(`   Field Plan Columns: ${results.stats.totalFieldPlanColumns}`);
  Logger.log(`   Program Columns: ${results.stats.totalProgramColumns}`);
  Logger.log(`   Total Mapped: ${results.stats.totalMappedColumns}`);
  Logger.log(`   Field Plan Range: ${results.stats.fieldPlanRange}`);
  Logger.log(`   Program Range: ${results.stats.programRange}`);

  return results.valid;
}
```

**Expected output (if valid):**
```
=== Column Mapping Validation ===
Status: ✅ VALID

📊 STATS:
   Field Plan Columns: 30
   Program Columns: 28
   Total Mapped: 58
   Field Plan Range: 0-72
   Program Range: 37-64
```

### Function 2: Log Column Mapping Summary

```javascript
/**
 * Logs a comprehensive summary of all column mappings
 * Useful for documentation, debugging, and team communication
 */
function logColumnMappingSummary() {
  Logger.log('=== 2026 FIELD PLAN COLUMN MAPPINGS ===\n');

  // Field Plan Columns Summary
  Logger.log('FIELD_PLAN_COLUMNS:');
  Logger.log(`  Total: ${Object.keys(FIELD_PLAN_COLUMNS).length} columns mapped`);
  const fpValues = Object.values(FIELD_PLAN_COLUMNS);
  Logger.log(`  Range: ${Math.min(...fpValues)}-${Math.max(...fpValues)}`);
  Logger.log('');

  // Program Columns Summary
  Logger.log('PROGRAM_COLUMNS:');
  Logger.log(`  Tactics: ${Object.keys(PROGRAM_COLUMNS).length}`);
  const allProgramIndices = Object.values(PROGRAM_COLUMNS).flatMap(t => Object.values(t));
  Logger.log(`  Total Columns: ${allProgramIndices.length}`);
  Logger.log(`  Range: ${Math.min(...allProgramIndices)}-${Math.max(...allProgramIndices)}`);
  Logger.log('');

  // Run validation
  const validation = validateColumnMappings();
  Logger.log('VALIDATION:');
  Logger.log(`  Status: ${validation.valid ? '✅ Valid' : '❌ Invalid'}`);

  if (validation.errors.length > 0) {
    Logger.log('  Errors:');
    validation.errors.forEach(err => Logger.log(`    - ${err}`));
  }

  if (validation.warnings.length > 0) {
    Logger.log('  Warnings:');
    validation.warnings.forEach(warn => Logger.log(`    - ${warn}`));
  }

  Logger.log('');
  Logger.log('DETAILED STATS:');
  for (const [key, value] of Object.entries(validation.stats)) {
    Logger.log(`  ${key}: ${value}`);
  }
}
```

**What it does:**
- 📋 Prints a comprehensive summary of all mappings
- ✅ Includes validation status
- 📊 Shows statistics and ranges
- 📝 Perfect for documentation or team meetings

**How to use it:**
```javascript
// Just run this function to see everything
logColumnMappingSummary();
```

### Function 3: Reverse Column Lookup

```javascript
/**
 * Helper function to get a column name from an index
 * Useful for debugging when you know the index but forgot what it maps to
 * @param {number} index - Column index to look up
 * @returns {string} Column name(s) that use this index, or 'Not mapped'
 */
function getColumnNameByIndex(index) {
  const names = [];

  // Search FIELD_PLAN_COLUMNS
  for (const [key, value] of Object.entries(FIELD_PLAN_COLUMNS)) {
    if (value === index) {
      names.push(`FIELD_PLAN_COLUMNS.${key}`);
    }
  }

  // Search PROGRAM_COLUMNS
  for (const [tacticName, metrics] of Object.entries(PROGRAM_COLUMNS)) {
    for (const [metricName, value] of Object.entries(metrics)) {
      if (value === index) {
        names.push(`PROGRAM_COLUMNS.${tacticName}.${metricName}`);
      }
    }
  }

  return names.length > 0 ? names.join(', ') : 'Not mapped';
}
```

**What it does:**
- 🔍 Reverse lookup: finds constant name(s) for a given column index
- 🐛 Helps debug column data issues
- 📚 Useful when reviewing CSV files

**How to use it:**
```javascript
// Look up what column 37 maps to
Logger.log(getColumnNameByIndex(37));
// Output: "PROGRAM_COLUMNS.PHONE.PROGRAMLENGTH"

// Look up column 2
Logger.log(getColumnNameByIndex(2));
// Output: "FIELD_PLAN_COLUMNS.MEMBERNAME"

// Try an unmapped column
Logger.log(getColumnNameByIndex(999));
// Output: "Not mapped"

// Useful in loops when debugging
const data = sheet.getDataRange().getValues()[0];
for (let i = 0; i < data.length; i++) {
  Logger.log(`Column ${i} (${getColumnNameByIndex(i)}): ${data[i]}`);
}
```

### Function 4: Complete Column Map (For Documentation)

```javascript
/**
 * Generates a complete column map as a formatted string
 * Useful for creating documentation or sharing with team
 * @returns {string} Formatted column mapping documentation
 */
function generateColumnMapDocumentation() {
  let doc = '=== 2026 FIELD PLAN COLUMN MAP ===\n\n';

  // Field Plan Columns
  doc += 'FIELD_PLAN_COLUMNS:\n';
  const sortedFieldPlan = Object.entries(FIELD_PLAN_COLUMNS)
    .sort((a, b) => a[1] - b[1]);

  sortedFieldPlan.forEach(([key, value]) => {
    doc += `  ${value.toString().padStart(3, ' ')} => ${key}\n`;
  });

  doc += '\nPROGRAM_COLUMNS:\n';

  // Program Columns by tactic
  for (const [tacticName, metrics] of Object.entries(PROGRAM_COLUMNS)) {
    doc += `  ${tacticName}:\n`;
    const sortedMetrics = Object.entries(metrics)
      .sort((a, b) => a[1] - b[1]);

    sortedMetrics.forEach(([key, value]) => {
      doc += `    ${value.toString().padStart(3, ' ')} => ${key}\n`;
    });
  }

  return doc;
}
```

**How to use it:**
```javascript
// Log the complete map
Logger.log(generateColumnMapDocumentation());

// Or save to a file (in Apps Script, use Drive API)
// Or copy-paste from logs to share with team
```

### Testing Your Centralized Mappings

After setting up your centralized `column_mappings.js` file, run these tests:

**Test Suite:**
```javascript
function runColumnMappingTests() {
  Logger.log('=== RUNNING COLUMN MAPPING TESTS ===\n');

  // Test 1: Validation
  Logger.log('TEST 1: Validation');
  const isValid = testColumnMappings();
  Logger.log(`Result: ${isValid ? '✅ PASS' : '❌ FAIL'}\n`);

  // Test 2: Summary
  Logger.log('TEST 2: Summary');
  logColumnMappingSummary();
  Logger.log('✅ PASS\n');

  // Test 3: Reverse Lookup
  Logger.log('TEST 3: Reverse Lookup');
  const tests = [0, 1, 2, 37, 65, 72, 999];
  tests.forEach(idx => {
    const name = getColumnNameByIndex(idx);
    Logger.log(`  Column ${idx}: ${name}`);
  });
  Logger.log('✅ PASS\n');

  // Test 4: Read actual data
  Logger.log('TEST 4: Read Real Data');
  try {
    const sheet = SpreadsheetApp.getActive().getSheetByName('2026_field_plan');
    if (sheet && sheet.getLastRow() > 1) {
      const data = sheet.getRange(2, 1, 1, sheet.getLastColumn()).getValues()[0];

      // Test a few key fields
      Logger.log(`  Organization: ${data[FIELD_PLAN_COLUMNS.MEMBERNAME]}`);
      Logger.log(`  Attended Training: ${data[FIELD_PLAN_COLUMNS.ATTENDEDTRAINING]}`);
      Logger.log(`  Phone Length: ${data[PROGRAM_COLUMNS.PHONE.PROGRAMLENGTH]}`);
      Logger.log('✅ PASS\n');
    } else {
      Logger.log('⚠️ SKIP - No data in sheet\n');
    }
  } catch (error) {
    Logger.log(`❌ FAIL - ${error.message}\n`);
  }

  Logger.log('=== TESTS COMPLETE ===');
}
```

---

**Last Updated:** 2025-12-26
**For:** 2026 Alabama Forward Field Planning Form
**Status:** 🚨 Code updates REQUIRED for 2026 compatibility
**Recommendation:** ⭐ **Centralize column mappings FIRST** before making 2026 updates
