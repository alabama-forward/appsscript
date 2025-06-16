---
layout: default
title: Class Structure - FieldPlan Analyzer
---

# Class-Based Architecture in FieldPlan Analyzer

The FieldPlan Analyzer uses object-oriented programming principles to create maintainable, scalable code. This guide explains the class structure and design patterns used.

## Architecture Overview

```
┌─────────────────────┐
│   Parent Classes    │
├─────────────────────┤
│ FieldPlanParent     │ ← Base class for field plans
│ FieldBudget         │ ← Budget data model
└──────────┬──────────┘
           │
┌──────────▼──────────┐
│  Extension Classes  │
├─────────────────────┤
│ FieldProgram        │ ← Extends FieldPlanParent
│ FieldTactics        │ ← Extends FieldPlanParent
└─────────────────────┘
           │
┌──────────▼──────────┐
│  Trigger Functions  │
├─────────────────────┤
│ checkForNewRows()   │
│ analyzeBudgets()    │
│ generateSummary()   │
└─────────────────────┘
```

## Core Classes

### 1. **FieldBudget Class**

The main budget data model:

```javascript
class FieldBudget {
  constructor(rowData) {
    this.rowData = rowData;
    this.parseData();
  }
  
  parseData() {
    // Map spreadsheet columns to properties
    this.firstName = this.rowData[FieldBudget.COLUMNS.FIRSTNAME - 1];
    this.lastName = this.rowData[FieldBudget.COLUMNS.LASTNAME - 1];
    this.email = this.rowData[FieldBudget.COLUMNS.CONTACTEMAIL - 1];
    this.organization = this.rowData[FieldBudget.COLUMNS.ORGANIZATIONNAME - 1];
    
    // Parse financial data
    this.totalBudget = this.parseNumber(
      this.rowData[FieldBudget.COLUMNS.TOTALBUDGET - 1]
    );
    this.fundingGap = this.parseNumber(
      this.rowData[FieldBudget.COLUMNS.FUNDINGGAP - 1]
    );
    
    // Parse tactics
    this.parseTactics();
  }
  
  parseNumber(value) {
    if (!value) return 0;
    
    // Remove currency symbols and commas
    const cleaned = value.toString()
      .replace(/[$,]/g, '')
      .trim();
    
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  
  parseTactics() {
    this.tactics = {};
    
    // Door knocking
    this.tactics.doorKnocking = {
      amount: this.parseNumber(
        this.rowData[FieldBudget.COLUMNS.DOORKNOCKINGREQUEST - 1]
      ),
      enabled: this.rowData[FieldBudget.COLUMNS.DOORKNOCKINGTACTIC - 1] === 'Yes'
    };
    
    // Phone banking
    this.tactics.phoneBanking = {
      amount: this.parseNumber(
        this.rowData[FieldBudget.COLUMNS.PHONEBANKINGREQUEST - 1]
      ),
      enabled: this.rowData[FieldBudget.COLUMNS.PHONEBANKINGTACTIC - 1] === 'Yes'
    };
    
    // Add other tactics...
  }
  
  // Getters for computed properties
  get totalRequest() {
    return Object.values(this.tactics)
      .reduce((sum, tactic) => sum + (tactic.amount || 0), 0);
  }
  
  get hasValidEmail() {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.email);
  }
  
  get needsAnalysis() {
    return !this.rowData[FieldBudget.COLUMNS.ANALYZED - 1] && 
           this.hasValidEmail &&
           this.totalRequest > 0;
  }
  
  // Factory methods
  static fromRow(rowData) {
    return new FieldBudget(rowData);
  }
  
  static fromLastRow() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(FieldBudget.SHEET_NAME);
    const lastRow = sheet.getLastRow();
    
    if (lastRow < 2) return null;
    
    const rowData = sheet.getRange(lastRow, 1, 1, sheet.getLastColumn())
      .getValues()[0];
    
    return new FieldBudget(rowData);
  }
  
  static getAllPending() {
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(FieldBudget.SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    
    const budgets = [];
    
    // Skip header row
    for (let i = 1; i < data.length; i++) {
      const budget = new FieldBudget(data[i]);
      
      if (budget.needsAnalysis) {
        budget.rowIndex = i + 1; // Store row number for updates
        budgets.push(budget);
      }
    }
    
    return budgets;
  }
  
  // Analysis methods
  calculateCostPerAttempt(tactic, fieldPlan) {
    if (!this.tactics[tactic] || !this.tactics[tactic].enabled) {
      return null;
    }
    
    const amount = this.tactics[tactic].amount;
    const attempts = fieldPlan.getTacticAttempts(tactic);
    
    if (attempts === 0) return null;
    
    return {
      amount: amount,
      attempts: attempts,
      costPerAttempt: amount / attempts,
      targetRange: FieldBudget.TARGET_RANGES[tactic]
    };
  }
  
  analyzeEfficiency(fieldPlan) {
    const analysis = {};
    
    for (const tactic in this.tactics) {
      if (this.tactics[tactic].enabled) {
        analysis[tactic] = this.calculateCostPerAttempt(tactic, fieldPlan);
      }
    }
    
    return analysis;
  }
  
  // Update methods
  markAsAnalyzed() {
    if (!this.rowIndex) {
      throw new Error('Row index not set');
    }
    
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(FieldBudget.SHEET_NAME);
    
    sheet.getRange(this.rowIndex, FieldBudget.COLUMNS.ANALYZED)
      .setValue('Yes');
    sheet.getRange(this.rowIndex, FieldBudget.COLUMNS.ANALYZEDDATE)
      .setValue(new Date());
  }
  
  // Email generation
  generateEmailBody(fieldPlan, analysis) {
    const gap = Math.abs(this.fundingGap); // Handle negative gaps
    
    let html = `
      <h2>Budget Analysis for ${this.organization}</h2>
      
      <h3>Summary</h3>
      <p>${this.organization} requested $${this.formatCurrency(this.totalRequest)} 
         and described a funding gap of $${this.formatCurrency(gap)}. 
         Their project costs $${this.formatCurrency(this.totalBudget)} to run.</p>
    `;
    
    // Add tactic analysis
    html += '<h3>Tactic Cost Analysis</h3>';
    
    for (const [tactic, data] of Object.entries(analysis)) {
      if (data) {
        html += this.generateTacticAnalysis(tactic, data);
      }
    }
    
    // Add recommendations
    html += this.generateRecommendations(analysis);
    
    return html;
  }
  
  formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}

// Static properties
FieldBudget.SHEET_NAME = '2025_field_budget';
FieldBudget.COLUMNS = {
  FIRSTNAME: 2,
  LASTNAME: 3,
  CONTACTEMAIL: 4,
  ORGANIZATIONNAME: 5,
  TOTALBUDGET: 10,
  FUNDINGGAP: 11,
  DOORKNOCKINGTACTIC: 15,
  DOORKNOCKINGREQUEST: 16,
  PHONEBANKINGTACTIC: 20,
  PHONEBANKINGREQUEST: 21,
  ANALYZED: 50,
  ANALYZEDDATE: 51
};

FieldBudget.TARGET_RANGES = {
  doorKnocking: { min: 4.50, max: 6.00 },
  phoneBanking: { min: 2.00, max: 3.50 },
  textBanking: { min: 0.15, max: 0.30 }
};
```

### 2. **FieldPlanParent Class**

Base class for field plan data:

```javascript
class FieldPlanParent {
  constructor(rowData) {
    this.rowData = rowData;
    this.parseBaseData();
  }
  
  parseBaseData() {
    // Common properties for all field plans
    this.timestamp = this.rowData[FieldPlanParent.COLUMNS.TIMESTAMP - 1];
    this.email = this.rowData[FieldPlanParent.COLUMNS.EMAIL - 1];
    this.firstName = this.rowData[FieldPlanParent.COLUMNS.FIRSTNAME - 1];
    this.lastName = this.rowData[FieldPlanParent.COLUMNS.LASTNAME - 1];
    this.organization = this.rowData[FieldPlanParent.COLUMNS.ORGANIZATION - 1];
    
    // Contact information
    this.phone = this.rowData[FieldPlanParent.COLUMNS.PHONE - 1];
    this.pronouns = this.rowData[FieldPlanParent.COLUMNS.PRONOUNS - 1];
    
    // Program details
    this.dataStorage = this.rowData[FieldPlanParent.COLUMNS.DATASTORAGE - 1];
    this.counties = this.parseCounties();
    
    // Parse confidence level
    this.confidence = this.parseNumber(
      this.rowData[FieldPlanParent.COLUMNS.CONFIDENCE - 1]
    );
  }
  
  parseCounties() {
    const countiesStr = this.rowData[FieldPlanParent.COLUMNS.COUNTIES - 1];
    if (!countiesStr) return [];
    
    return countiesStr.split(',').map(c => c.trim()).filter(c => c);
  }
  
  parseNumber(value) {
    const num = parseInt(value);
    return isNaN(num) ? 0 : num;
  }
  
  // Template method pattern - subclasses implement these
  parseTacticData() {
    throw new Error('Subclass must implement parseTacticData');
  }
  
  getTacticAttempts(tacticName) {
    throw new Error('Subclass must implement getTacticAttempts');
  }
  
  // Common methods
  get fullName() {
    return `${this.firstName} ${this.lastName}`.trim();
  }
  
  get needsCoaching() {
    return this.confidence < 7;
  }
  
  get coachingRecommendation() {
    if (this.confidence >= 8) {
      return 'No coaching needed - high confidence level';
    } else if (this.confidence >= 6) {
      return 'Light touch coaching recommended';
    } else if (this.confidence >= 4) {
      return 'Moderate coaching support needed';
    } else {
      return 'Intensive coaching support required';
    }
  }
  
  // Factory method
  static fromRow(rowData) {
    // Determine which subclass to instantiate based on data
    const programType = rowData[FieldPlanParent.COLUMNS.PROGRAMTYPE - 1];
    
    if (programType === 'Field Program') {
      return new FieldProgram(rowData);
    } else if (programType === 'Field Tactics') {
      return new FieldTactics(rowData);
    } else {
      // Default to base class
      return new FieldPlanParent(rowData);
    }
  }
  
  // Email generation helper
  generateContactSection() {
    return `
      <h3>Contact Information</h3>
      <p><strong>Organization:</strong> ${this.organization}</p>
      <p><strong>Contact:</strong> ${this.fullName}</p>
      <p><strong>Email:</strong> ${this.email}</p>
      <p><strong>Phone:</strong> ${this.phone || 'Not provided'}</p>
      <p><strong>Pronouns:</strong> ${this.pronouns || 'Not specified'}</p>
    `;
  }
}

// Static properties
FieldPlanParent.SHEET_NAME = '2025_field_plan';
FieldPlanParent.COLUMNS = {
  TIMESTAMP: 1,
  EMAIL: 2,
  FIRSTNAME: 3,
  LASTNAME: 4,
  ORGANIZATION: 5,
  PHONE: 6,
  PRONOUNS: 7,
  DATASTORAGE: 10,
  COUNTIES: 15,
  CONFIDENCE: 25,
  PROGRAMTYPE: 30,
  PROCESSED: 50
};
```

### 3. **FieldProgram Extension**

Extends parent for program-specific data:

```javascript
class FieldProgram extends FieldPlanParent {
  constructor(rowData) {
    super(rowData);
    this.parseTacticData();
  }
  
  parseTacticData() {
    this.tactics = {};
    
    // Door knocking program
    this.tactics.doorKnocking = {
      enabled: this.rowData[FieldProgram.COLUMNS.DK_ENABLED - 1] === 'Yes',
      weeks: this.parseNumber(this.rowData[FieldProgram.COLUMNS.DK_WEEKS - 1]),
      volunteersPerWeek: this.parseNumber(
        this.rowData[FieldProgram.COLUMNS.DK_VOLUNTEERS - 1]
      ),
      hoursPerVolunteer: this.parseNumber(
        this.rowData[FieldProgram.COLUMNS.DK_HOURS - 1]
      ),
      attemptsPerHour: this.parseNumber(
        this.rowData[FieldProgram.COLUMNS.DK_ATTEMPTS_HOUR - 1]
      )
    };
    
    // Phone banking program
    this.tactics.phoneBanking = {
      enabled: this.rowData[FieldProgram.COLUMNS.PB_ENABLED - 1] === 'Yes',
      weeks: this.parseNumber(this.rowData[FieldProgram.COLUMNS.PB_WEEKS - 1]),
      volunteersPerWeek: this.parseNumber(
        this.rowData[FieldProgram.COLUMNS.PB_VOLUNTEERS - 1]
      ),
      hoursPerVolunteer: this.parseNumber(
        this.rowData[FieldProgram.COLUMNS.PB_HOURS - 1]
      ),
      attemptsPerHour: this.parseNumber(
        this.rowData[FieldProgram.COLUMNS.PB_ATTEMPTS_HOUR - 1]
      )
    };
    
    // Calculate derived metrics
    this.calculateMetrics();
  }
  
  calculateMetrics() {
    for (const [tacticName, tactic] of Object.entries(this.tactics)) {
      if (tactic.enabled) {
        // Total volunteer hours
        tactic.totalHours = tactic.weeks * 
                           tactic.volunteersPerWeek * 
                           tactic.hoursPerVolunteer;
        
        // Total attempts
        tactic.totalAttempts = tactic.totalHours * tactic.attemptsPerHour;
        
        // Weekly attempts
        tactic.weeklyAttempts = tactic.volunteersPerWeek * 
                               tactic.hoursPerVolunteer * 
                               tactic.attemptsPerHour;
      }
    }
  }
  
  getTacticAttempts(tacticName) {
    const tactic = this.tactics[tacticName];
    if (!tactic || !tactic.enabled) return 0;
    
    return tactic.totalAttempts || 0;
  }
  
  // Analysis methods
  analyzeCapacity() {
    const analysis = {
      totalVolunteerHours: 0,
      totalAttempts: 0,
      tactics: {}
    };
    
    for (const [name, tactic] of Object.entries(this.tactics)) {
      if (tactic.enabled) {
        analysis.totalVolunteerHours += tactic.totalHours;
        analysis.totalAttempts += tactic.totalAttempts;
        
        analysis.tactics[name] = {
          hours: tactic.totalHours,
          attempts: tactic.totalAttempts,
          efficiency: tactic.attemptsPerHour
        };
      }
    }
    
    return analysis;
  }
  
  // Validation
  validateProgram() {
    const errors = [];
    
    for (const [name, tactic] of Object.entries(this.tactics)) {
      if (tactic.enabled) {
        if (tactic.weeks <= 0) {
          errors.push(`${name}: Program length must be positive`);
        }
        
        if (tactic.volunteersPerWeek <= 0) {
          errors.push(`${name}: Must have at least one volunteer`);
        }
        
        if (tactic.hoursPerVolunteer <= 0 || tactic.hoursPerVolunteer > 40) {
          errors.push(`${name}: Hours per volunteer unrealistic`);
        }
        
        if (tactic.attemptsPerHour <= 0) {
          errors.push(`${name}: Attempts per hour must be positive`);
        }
      }
    }
    
    return errors;
  }
  
  // Report generation
  generateProgramSummary() {
    let html = '<h3>Field Program Summary</h3>';
    
    for (const [name, tactic] of Object.entries(this.tactics)) {
      if (tactic.enabled) {
        html += `
          <h4>${this.formatTacticName(name)}</h4>
          <ul>
            <li>Program Length: ${tactic.weeks} weeks</li>
            <li>Weekly Volunteers: ${tactic.volunteersPerWeek}</li>
            <li>Hours per Volunteer: ${tactic.hoursPerVolunteer}</li>
            <li>Total Program Hours: ${this.formatNumber(tactic.totalHours)}</li>
            <li>Attempts per Hour: ${tactic.attemptsPerHour}</li>
            <li>Total Program Attempts: ${this.formatNumber(tactic.totalAttempts)}</li>
          </ul>
        `;
      }
    }
    
    return html;
  }
  
  formatTacticName(name) {
    return name.replace(/([A-Z])/g, ' $1').trim()
      .replace(/^\w/, c => c.toUpperCase());
  }
  
  formatNumber(num) {
    return new Intl.NumberFormat('en-US').format(num);
  }
}

// Additional column definitions
FieldProgram.COLUMNS = Object.assign({}, FieldPlanParent.COLUMNS, {
  DK_ENABLED: 31,
  DK_WEEKS: 32,
  DK_VOLUNTEERS: 33,
  DK_HOURS: 34,
  DK_ATTEMPTS_HOUR: 35,
  PB_ENABLED: 36,
  PB_WEEKS: 37,
  PB_VOLUNTEERS: 38,
  PB_HOURS: 39,
  PB_ATTEMPTS_HOUR: 40
});
```

## Design Patterns

### 1. **Factory Pattern**

```javascript
class FieldPlanFactory {
  static create(rowData) {
    // Determine type based on data
    const indicators = this.detectType(rowData);
    
    if (indicators.isProgram) {
      return new FieldProgram(rowData);
    } else if (indicators.isTactics) {
      return new FieldTactics(rowData);
    } else {
      throw new Error('Unknown field plan type');
    }
  }
  
  static detectType(rowData) {
    // Logic to determine which type of plan this is
    const hasWeeklyData = rowData[FieldProgram.COLUMNS.DK_WEEKS - 1] !== '';
    const hasTotalData = rowData[FieldTactics.COLUMNS.DK_TOTAL - 1] !== '';
    
    return {
      isProgram: hasWeeklyData,
      isTactics: hasTotalData && !hasWeeklyData
    };
  }
  
  static createFromSheet(sheetName, rowIndex) {
    const sheet = SpreadsheetApp.getActiveSpreadsheet()
      .getSheetByName(sheetName);
    const rowData = sheet.getRange(rowIndex, 1, 1, sheet.getLastColumn())
      .getValues()[0];
    
    const plan = this.create(rowData);
    plan.rowIndex = rowIndex; // Store for updates
    plan.sheetName = sheetName;
    
    return plan;
  }
}
```

### 2. **Strategy Pattern**

```javascript
// Define analysis strategies
class AnalysisStrategy {
  analyze(budget, fieldPlan) {
    throw new Error('Subclass must implement analyze method');
  }
}

class CostPerAttemptStrategy extends AnalysisStrategy {
  analyze(budget, fieldPlan) {
    const results = {};
    
    for (const tactic in budget.tactics) {
      if (budget.tactics[tactic].enabled) {
        const attempts = fieldPlan.getTacticAttempts(tactic);
        const amount = budget.tactics[tactic].amount;
        
        results[tactic] = {
          costPerAttempt: attempts > 0 ? amount / attempts : null,
          withinTarget: this.checkTarget(amount / attempts, tactic)
        };
      }
    }
    
    return results;
  }
  
  checkTarget(costPerAttempt, tactic) {
    const range = FieldBudget.TARGET_RANGES[tactic];
    if (!range) return null;
    
    return costPerAttempt >= range.min && costPerAttempt <= range.max;
  }
}

class EfficiencyStrategy extends AnalysisStrategy {
  analyze(budget, fieldPlan) {
    const capacity = fieldPlan.analyzeCapacity();
    
    return {
      costPerHour: budget.totalRequest / capacity.totalVolunteerHours,
      costPerVolunteer: budget.totalRequest / 
        (fieldPlan.getUniqueVolunteers() || 1),
      utilizationRate: this.calculateUtilization(capacity)
    };
  }
  
  calculateUtilization(capacity) {
    // Complex utilization calculation
    const maxPossibleHours = capacity.weeks * 40 * capacity.volunteers;
    return capacity.totalVolunteerHours / maxPossibleHours;
  }
}

// Context class to use strategies
class BudgetAnalyzer {
  constructor(strategy) {
    this.strategy = strategy;
  }
  
  setStrategy(strategy) {
    this.strategy = strategy;
  }
  
  analyze(budget, fieldPlan) {
    return this.strategy.analyze(budget, fieldPlan);
  }
}
```

### 3. **Observer Pattern**

```javascript
// Event system for analysis updates
class AnalysisEventEmitter {
  constructor() {
    this.listeners = {};
  }
  
  on(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
  }
  
  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener:`, error);
        }
      });
    }
  }
}

// Usage in analysis
const analysisEvents = new AnalysisEventEmitter();

// Register listeners
analysisEvents.on('budgetAnalyzed', (data) => {
  // Send email notification
  sendAnalysisEmail(data.budget, data.analysis);
});

analysisEvents.on('analysisError', (data) => {
  // Log error and notify admin
  logError(data.error, data.context);
  notifyAdmin(data);
});

analysisEvents.on('analysisComplete', (data) => {
  // Update summary statistics
  updateSummaryStats(data.totalAnalyzed, data.totalPending);
});

// Emit events during analysis
function analyzeWithEvents(budget, fieldPlan) {
  try {
    const analysis = performAnalysis(budget, fieldPlan);
    
    analysisEvents.emit('budgetAnalyzed', {
      budget: budget,
      fieldPlan: fieldPlan,
      analysis: analysis
    });
    
    return analysis;
    
  } catch (error) {
    analysisEvents.emit('analysisError', {
      error: error,
      context: { budget: budget, fieldPlan: fieldPlan }
    });
    throw error;
  }
}
```

## Best Practices

### 1. **Encapsulation**

Keep internal state private and provide controlled access:

```javascript
class SecureBudget {
  #internalData; // Private field
  
  constructor(data) {
    this.#internalData = this.#validateData(data);
  }
  
  #validateData(data) {
    // Private validation method
    if (!data.organization) {
      throw new Error('Organization required');
    }
    return data;
  }
  
  // Public getter with computed property
  get summary() {
    return {
      organization: this.#internalData.organization,
      totalRequest: this.#calculateTotal(),
      status: this.#determineStatus()
    };
  }
  
  #calculateTotal() {
    // Private calculation method
    return Object.values(this.#internalData.tactics)
      .reduce((sum, t) => sum + t.amount, 0);
  }
  
  #determineStatus() {
    // Private business logic
    if (this.#internalData.analyzed) return 'complete';
    if (this.#internalData.hasFieldPlan) return 'ready';
    return 'pending';
  }
}
```

### 2. **Inheritance Best Practices**

```javascript
// Good: Clear inheritance hierarchy
class BasePlan {
  constructor(data) {
    if (new.target === BasePlan) {
      throw new Error('BasePlan is abstract');
    }
    this.data = data;
  }
  
  // Template method
  process() {
    this.validate();
    this.parse();
    this.analyze();
    return this.generateReport();
  }
  
  validate() {
    // Common validation
    if (!this.data.email) {
      throw new Error('Email required');
    }
  }
  
  // Abstract methods
  parse() {
    throw new Error('Subclass must implement parse');
  }
  
  analyze() {
    throw new Error('Subclass must implement analyze');
  }
  
  generateReport() {
    throw new Error('Subclass must implement generateReport');
  }
}

class ConcretePlan extends BasePlan {
  parse() {
    // Implementation specific parsing
    this.parsed = {
      name: this.data.name,
      tactics: this.parseTactics(this.data)
    };
  }
  
  analyze() {
    // Implementation specific analysis
    this.analysis = {
      score: this.calculateScore(),
      recommendations: this.generateRecommendations()
    };
  }
  
  generateReport() {
    return {
      plan: this.parsed,
      analysis: this.analysis
    };
  }
}
```

### 3. **Composition Over Inheritance**

```javascript
// Compose behaviors instead of deep inheritance
class TacticCalculator {
  calculate(tactic, amount, attempts) {
    return {
      costPerAttempt: amount / attempts,
      efficiency: this.calculateEfficiency(tactic, attempts)
    };
  }
  
  calculateEfficiency(tactic, attempts) {
    // Tactic-specific efficiency calculation
    const baseline = TACTIC_BASELINES[tactic];
    return attempts / baseline;
  }
}

class EmailGenerator {
  generateHTML(template, data) {
    // Email generation logic
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return data[key] || '';
    });
  }
}

class ValidationService {
  validateBudget(budget) {
    const errors = [];
    
    if (!budget.organization) {
      errors.push('Organization required');
    }
    
    if (budget.totalRequest <= 0) {
      errors.push('Request amount must be positive');
    }
    
    return errors;
  }
}

// Compose into analyzer
class ComposedAnalyzer {
  constructor() {
    this.calculator = new TacticCalculator();
    this.emailGenerator = new EmailGenerator();
    this.validator = new ValidationService();
  }
  
  analyze(budget, fieldPlan) {
    // Validate first
    const errors = this.validator.validateBudget(budget);
    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }
    
    // Calculate metrics
    const calculations = {};
    for (const tactic in budget.tactics) {
      calculations[tactic] = this.calculator.calculate(
        tactic,
        budget.tactics[tactic].amount,
        fieldPlan.getTacticAttempts(tactic)
      );
    }
    
    // Generate email
    const emailBody = this.emailGenerator.generateHTML(
      EMAIL_TEMPLATE,
      { budget, calculations }
    );
    
    return {
      calculations,
      emailBody
    };
  }
}
```

## Next Steps

- Learn about [Functional Programming](/appsscript/developers/fieldplan-analyzer/functional-programming) patterns
- Explore [Timer Implementation](/appsscript/developers/fieldplan-analyzer/timers)
- Master [Email Response Generation](/appsscript/developers/fieldplan-analyzer/email-responses)