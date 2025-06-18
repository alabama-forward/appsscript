---
layout: default
title: Class Structure - FieldPlan Analyzer
---

# Class-Based Architecture in FieldPlan Analyzer

The FieldPlan Analyzer uses object-oriented programming with a simple class hierarchy to process field planning and budget data. This guide explains the actual class structure implemented in the code.

## Architecture Overview

```
┌─────────────────────┐
│    Base Classes     │
├─────────────────────┤
│ FieldPlan           │ ← Base class for field plan data
│ FieldBudget         │ ← Budget data model
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  Extension Classes  │
├─────────────────────┤
│ FieldProgram        │ ← Extends FieldPlan with calculations
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│   Tactic Classes    │
├─────────────────────┤
│ PhoneTactic         │ ← Extends FieldProgram
│ DoorTactic          │ ← Extends FieldProgram
│ TextTactic          │ ← Extends FieldProgram
│ MailTactic          │ ← Extends FieldProgram
│ OpenTactic          │ ← Extends FieldProgram
│ RelationalTactic    │ ← Extends FieldProgram
│ RegistrationTactic  │ ← Extends FieldProgram
└─────────────────────┘
```

## Core Classes

### 1. **FieldPlan Class**

The base class that reads field plan data from the spreadsheet:

```javascript
class FieldPlan {
  constructor(rowData) {
    this.data = {};
    this._columnIndices = {};
    this._parseHeaders();
    this._parseRow(rowData);
  }
  
  _parseHeaders() {
    const headers = this._getHeaders();
    headers.forEach((header, index) => {
      if (header) {
        const key = this._normalizeHeader(header);
        this._columnIndices[key] = index;
      }
    });
  }
  
  _parseRow(rowData) {
    // Parse all 58 columns of data
    Object.keys(this._columnIndices).forEach(key => {
      const index = this._columnIndices[key];
      let value = rowData[index];
      
      // Normalize array fields
      if (this._isArrayField(key)) {
        value = this._parseArrayField(value);
      }
      
      this.data[key] = value;
    });
  }
  
  _normalizeHeader(header) {
    return header.toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '');
  }
  
  _isArrayField(key) {
    const arrayFields = [
      'field_counties',
      'priority_demographics',
      'what_tools_do_you_use',
      'coaching_support_requested'
    ];
    return arrayFields.includes(key);
  }
  
  _parseArrayField(value) {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return value.toString().split(',').map(v => v.trim()).filter(v => v);
  }
  
  // Static factory methods
  static fromLastRow() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(this.getSheetName());
    const lastRow = sheet.getLastRow();
    const rowData = sheet.getRange(lastRow, 1, 1, sheet.getLastColumn())
      .getValues()[0];
    return new this(rowData);
  }
  
  static fromFirstRow() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(this.getSheetName());
    const rowData = sheet.getRange(2, 1, 1, sheet.getLastColumn())
      .getValues()[0];
    return new this(rowData);
  }
  
  static getSheetName() {
    return PropertiesService.getScriptProperties()
      .getProperty('FIELD_PLAN_SHEET') || '2025_field_plan';
  }
}
```

### 2. **FieldProgram Class**

Extends FieldPlan to add program-specific calculations:

```javascript
class FieldProgram extends FieldPlan {
  constructor(rowData) {
    super(rowData);
  }
  
  // Calculate total program volunteer hours
  getTotalProgramVolunteerHours() {
    const fields = [
      'door_volunteer_hours',
      'phone_volunteer_hours',
      'text_volunteer_hours',
      'mail_volunteer_hours',
      'open_events_volunteer_hours',
      'relational_volunteer_hours',
      'registration_volunteer_hours'
    ];
    
    return fields.reduce((total, field) => {
      const hours = parseFloat(this.data[field]) || 0;
      return total + hours;
    }, 0);
  }
  
  // Calculate weekly volunteer hours
  getWeeklyVolunteerHours() {
    const totalHours = this.getTotalProgramVolunteerHours();
    const weeks = parseFloat(this.data['program_length_in_weeks']) || 1;
    return totalHours / weeks;
  }
  
  // Calculate weekly contact attempts
  getWeeklyContactAttempts() {
    const contactsPerWeek = parseFloat(this.data['contact_attempts_per_week']) || 0;
    return contactsPerWeek;
  }
  
  // Get total program attempts
  getTotalProgramAttempts() {
    const weeklyAttempts = this.getWeeklyContactAttempts();
    const weeks = parseFloat(this.data['program_length_in_weeks']) || 1;
    return weeklyAttempts * weeks;
  }
  
  // Get program length in weeks
  getProgramLength() {
    return parseFloat(this.data['program_length_in_weeks']) || 0;
  }
  
  // Check if a specific tactic is enabled
  isTacticEnabled(tacticName) {
    const field = `${tacticName}_volunteer_hours`;
    const hours = parseFloat(this.data[field]) || 0;
    return hours > 0;
  }
}
```

### 3. **Tactic-Specific Classes**

Each tactic has its own class with specific metrics and thresholds:

```javascript
class PhoneTactic extends FieldProgram {
  constructor(rowData) {
    super(rowData);
    this.tacticName = 'phone';
    this.contactRateRange = { low: 0.05, high: 0.10 }; // 5-10%
    this.reasonableHourlyAttempts = 35;
  }
  
  getVolunteerHours() {
    return parseFloat(this.data['phone_volunteer_hours']) || 0;
  }
  
  checkVolunteerExpectationsReasonable() {
    const weeklyHours = this.getVolunteerHours() / this.getProgramLength();
    const weeklyVolunteers = parseFloat(this.data['weekly_phone_volunteers']) || 0;
    
    if (weeklyVolunteers === 0) return true;
    
    const hoursPerVolunteer = weeklyHours / weeklyVolunteers;
    return hoursPerVolunteer >= 2 && hoursPerVolunteer <= 20;
  }
  
  getTacticContactRate() {
    const rate = parseFloat(this.data['phone_contact_rate_percentage']) || 0;
    return rate / 100; // Convert percentage to decimal
  }
  
  // Calculate expected successful contacts
  calculateSuccessfulContacts() {
    const attempts = this.calculateAttempts();
    const contactRate = this.getTacticContactRate() || 
                       (this.contactRateRange.low + this.contactRateRange.high) / 2;
    return Math.round(attempts * contactRate);
  }
  
  // Calculate total attempts for this tactic
  calculateAttempts() {
    const hours = this.getVolunteerHours();
    const attemptsPerHour = parseFloat(this.data['phone_attempts_per_hour']) || 
                           this.reasonableHourlyAttempts;
    return Math.round(hours * attemptsPerHour);
  }
}

// Similar structure for other tactics
class DoorTactic extends FieldProgram {
  constructor(rowData) {
    super(rowData);
    this.tacticName = 'door';
    this.contactRateRange = { low: 0.05, high: 0.10 }; // 5-10%
    this.reasonableHourlyAttempts = 10;
  }
  // ... similar methods
}

class TextTactic extends FieldProgram {
  constructor(rowData) {
    super(rowData);
    this.tacticName = 'text';
    this.contactRateRange = { low: 0.01, high: 0.05 }; // 1-5%
    this.reasonableHourlyAttempts = 150;
  }
  // ... similar methods
}

class MailTactic extends FieldProgram {
  constructor(rowData) {
    super(rowData);
    this.tacticName = 'mail';
    this.contactRateRange = { low: 0.01, high: 0.05 }; // 1-5%
    this.reasonableHourlyAttempts = 100;
  }
  // ... similar methods
}
```

### 4. **FieldBudget Class**

Handles budget data and analysis:

```javascript
class FieldBudget {
  constructor(rowData) {
    this.rowData = rowData;
    this.data = {};
    this.parseData();
  }
  
  parseData() {
    // Map column indices to data fields
    this.data.timestamp = this.rowData[0];
    this.data.firstName = this.rowData[1];
    this.data.lastName = this.rowData[2];
    this.data.email = this.rowData[3];
    this.data.organization = this.rowData[4];
    
    // Parse budget categories (15 categories x 3 columns each)
    this.parseBudgetCategories();
    
    // Parse analysis status
    this.data.analyzed = this.rowData[49];
    this.data.analyzedTimestamp = this.rowData[50];
    this.data.missingFieldPlanNotificationSent = this.rowData[51];
    this.data.missingFieldPlanTimestamp = this.rowData[52];
  }
  
  parseBudgetCategories() {
    const categories = [
      'indirect', 'travel', 'supplies', 'literature',
      'swag', 'phonebanking', 'textbanking', 'door',
      'mail', 'events', 'relational', 'registration',
      'digital', 'other', 'total'
    ];
    
    this.data.budget = {};
    let colIndex = 5; // Starting column for budget data
    
    categories.forEach(category => {
      this.data.budget[category] = {
        requested: this.parseNumber(this.rowData[colIndex]),
        total: this.parseNumber(this.rowData[colIndex + 1]),
        gap: this.parseNumber(this.rowData[colIndex + 2])
      };
      colIndex += 3;
    });
  }
  
  parseNumber(value) {
    if (!value) return 0;
    const cleaned = value.toString().replace(/[$,]/g, '').trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  
  // Calculate proportion of request that is indirect
  calculateIndirectProportion() {
    const indirect = this.data.budget.indirect.requested;
    const total = this.data.budget.total.requested;
    return total > 0 ? indirect / total : 0;
  }
  
  // Calculate proportion of request that is outreach
  calculateOutreachProportion() {
    const outreachCategories = [
      'phonebanking', 'textbanking', 'door', 'mail',
      'events', 'relational', 'registration'
    ];
    
    const outreach = outreachCategories.reduce((sum, cat) => {
      return sum + this.data.budget[cat].requested;
    }, 0);
    
    const total = this.data.budget.total.requested;
    return total > 0 ? outreach / total : 0;
  }
  
  // Check if budget needs analysis
  needsAnalysis() {
    return !this.data.analyzed && this.data.email;
  }
  
  // Get organization name for matching
  getOrganizationName() {
    return this.data.organization || '';
  }
  
  // Get total funding gap
  getTotalGap() {
    return Math.abs(this.data.budget.total.gap || 0);
  }
  
  // Static factory methods
  static getAllUnanalyzed() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(this.getSheetName());
    const allData = sheet.getDataRange().getValues();
    const budgets = [];
    
    // Skip header row
    for (let i = 1; i < allData.length; i++) {
      const budget = new FieldBudget(allData[i]);
      if (budget.needsAnalysis()) {
        budget.rowIndex = i + 1; // Store 1-based row index
        budgets.push(budget);
      }
    }
    
    return budgets;
  }
  
  static getSheetName() {
    return PropertiesService.getScriptProperties()
      .getProperty('BUDGET_SHEET') || '2025_field_budget';
  }
}
```

## Usage in Trigger Functions

### Field Plan Processing

```javascript
function checkForNewRows() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(FieldPlan.getSheetName());
  
  const lastProcessedRow = getLastProcessedRow();
  const currentLastRow = sheet.getLastRow();
  
  for (let row = lastProcessedRow + 1; row <= currentLastRow; row++) {
    const rowData = sheet.getRange(row, 1, 1, sheet.getLastColumn())
      .getValues()[0];
    
    // Create appropriate tactic class instance
    const fieldPlan = new FieldProgram(rowData);
    
    // Send notification email
    sendFieldPlanNotification(fieldPlan);
    
    // Check if matching budget exists
    const matchingBudget = findMatchingBudget(fieldPlan.data.organization_name);
    if (matchingBudget) {
      analyzeBudget(matchingBudget, fieldPlan);
    }
  }
  
  updateLastProcessedRow(currentLastRow);
}
```

### Budget Analysis

```javascript
function analyzeBudgets() {
  const unanalyzedBudgets = FieldBudget.getAllUnanalyzed();
  
  unanalyzedBudgets.forEach(budget => {
    try {
      // Find matching field plan
      const fieldPlan = findMatchingFieldPlan(budget.getOrganizationName());
      
      if (fieldPlan) {
        // Perform analysis
        const analysis = performCostAnalysis(budget, fieldPlan);
        
        // Send email
        sendBudgetAnalysisEmail(budget, fieldPlan, analysis);
        
        // Mark as analyzed
        markBudgetAsAnalyzed(budget.rowIndex);
      } else {
        // Check if we should send missing plan notification
        checkMissingPlanNotification(budget);
      }
    } catch (error) {
      console.error(`Error analyzing budget for ${budget.getOrganizationName()}:`, error);
    }
  });
}
```

## Key Design Principles

### 1. **Simple Inheritance**
- Base class (FieldPlan) handles data parsing
- FieldProgram adds calculation methods
- Tactic classes add specific metrics

### 2. **Data Encapsulation**
- Raw spreadsheet data stored in `data` object
- Methods provide calculated values
- No complex state management

### 3. **Factory Methods**
- Static methods for creating instances from sheets
- Consistent interface across classes

### 4. **No Over-Engineering**
- No abstract classes or interfaces
- No complex design patterns
- Focus on practical functionality

## Next Steps

- Learn about [Timer Implementation](/appsscript/developers/fieldplan-analyzer/timers)
- Master [Email Response Generation](/appsscript/developers/fieldplan-analyzer/email-responses)
- Understand [Spreadsheet Integration](/appsscript/developers/spreadsheet-mapping/examples)