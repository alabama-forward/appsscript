# TypeScript Migration Guide for 2026 Field Plan Analyzer

This guide will walk you through converting your Google Apps Script project from JavaScript to TypeScript, including environment setup, clasp integration, and specific refactoring needs for your codebase.

---

## Table of Contents

1. [Why TypeScript?](#why-typescript)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [clasp Configuration](#clasp-configuration)
5. [Project Files Analysis](#project-files-analysis)
6. [Migration Steps](#migration-steps)
7. [File-by-File Refactoring](#file-by-file-refactoring)
8. [Testing TypeScript Code](#testing-typescript-code)
9. [Common Issues & Solutions](#common-issues--solutions)
10. [Benefits You'll See](#benefits-youll-see)

---

## Why TypeScript?

### Immediate Benefits for Your Project

1. **Catch Errors Early** - TypeScript will catch bugs like:
   - Accessing wrong column indices
   - Misspelling property names
   - Passing wrong types to functions

2. **Better IDE Support** - VS Code will:
   - Show all available properties on objects
   - Autocomplete method names
   - Show inline documentation

3. **Easier Refactoring** - When you need to:
   - Rename properties across multiple files
   - Change function signatures
   - Restructure data models

4. **Self-Documenting Code** - Types serve as inline documentation:
   ```typescript
   // JavaScript - unclear what rowData contains
   function processFieldPlan(rowData) { }

   // TypeScript - crystal clear!
   function processFieldPlan(rowData: any[]): FieldPlan { }
   ```

5. **Safer Column Mapping Updates** - TypeScript will error if you:
   - Forget to update a column mapping
   - Use the wrong column constant
   - Miss a property in the constructor

---

## Prerequisites

### What You Need

1. **Node.js** (version 16 or higher)
   ```bash
   node --version
   # Should show v16.x.x or higher
   ```

2. **VS Code** (you have this)

3. **clasp** (Google Apps Script CLI)
   ```bash
   # Check if installed
   clasp --version

   # If not installed
   npm install -g @google/clasp
   ```

4. **Your existing 2026_analyzer project**

---

## Environment Setup

### Step 1: Install TypeScript and Type Definitions

```bash
cd /Users/richardscc1/alf_dev/appsscript/fieldplan_analyzer/2026_analyzer

# Install TypeScript
npm install --save-dev typescript

# Install Google Apps Script type definitions
npm install --save-dev @types/google-apps-script

# Install Node.js type definitions (for local testing)
npm install --save-dev @types/node
```

### Step 2: Create TypeScript Configuration

Create **tsconfig.json** in your project root:

```json
{
  "compilerOptions": {
    // Target environment
    "lib": ["esnext"],
    "target": "ES2019",
    "module": "ESNext",

    // Apps Script specific
    "experimentalDecorators": true,

    // Type checking (start strict!)
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": false,  // Needed for class properties

    // Module resolution
    "moduleResolution": "node",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,

    // Quality of life
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,

    // Source maps for debugging
    "sourceMap": true,
    "inlineSourceMap": false,

    // Output
    "outDir": "./build"
  },
  "include": [
    "src/**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "build",
    "test_data"
  ]
}
```

### Step 3: Update package.json Scripts

Add TypeScript scripts to **package.json**:

```json
{
  "name": "field-plan-analyzer-2026",
  "version": "1.0.0",
  "scripts": {
    "compile": "tsc",
    "watch": "tsc --watch",
    "push": "npm run compile && clasp push",
    "push:watch": "npm run watch & clasp push --watch",
    "download": "node scripts/download_sheet_data.js",
    "test": "npm run download:sample && npm run compile && node tests/run_all_tests.js",
    "lint": "tsc --noEmit"
  },
  "devDependencies": {
    "@types/google-apps-script": "^1.0.83",
    "@types/node": "^20.10.0",
    "typescript": "^5.3.3"
  }
}
```

---

## clasp Configuration

### Step 1: Login to clasp

```bash
# Login to your Google account
clasp login
```

### Step 2: Clone Your Existing Apps Script Project

First, get your Script ID:
1. Open your Apps Script project in browser
2. Go to **Project Settings** (gear icon)
3. Copy the **Script ID**

Then clone it:

```bash
# Clone your existing project
clasp clone YOUR_SCRIPT_ID

# This creates .clasp.json
```

### Step 3: Configure .clasp.json

Edit **.clasp.json**:

```json
{
  "scriptId": "YOUR_SCRIPT_ID_HERE",
  "rootDir": "./src"
}
```

### Step 4: Update .claspignore

Create **.claspignore** to exclude unnecessary files:

```
# Exclude from pushing to Apps Script
**/*.ts
node_modules/**
test_data/**
tests/**
.auth/**
*.md
tsconfig.json
package.json
package-lock.json
.gitignore
build/**
```

**Important:** We exclude `.ts` files because clasp will push the compiled `.js` files instead!

---

## Project Files Analysis

### Your Current JavaScript Files

Let's analyze what needs to be refactored:

```
src/
├── column_mappings.js             → column_mappings.ts
├── field_plan_parent_class.js     → field_plan_parent_class.ts
├── field_program_extension_class.js → field_program_extension_class.ts
├── field_tactics_extension_class.js → field_tactics_extension_class.ts
├── field_trigger_functions.js     → field_trigger_functions.ts
└── test_functions.js              → test_functions.ts
```

### Refactoring Complexity (1-5, 5 being most complex)

| File | Complexity | Main Changes Needed |
|------|-----------|---------------------|
| `column_mappings.js` | ⭐⭐ | Add interfaces, type constants |
| `field_plan_parent_class.js` | ⭐⭐⭐⭐ | Add types to all properties, getters, methods |
| `field_program_extension_class.js` | ⭐⭐⭐ | Type class properties, add return types |
| `field_tactics_extension_class.js` | ⭐⭐⭐ | Type each tactic class, method signatures |
| `field_trigger_functions.js` | ⭐⭐⭐⭐ | Type all function parameters and returns |
| `test_functions.js` | ⭐⭐ | Add types, return types for test functions |

### Key Refactoring Areas

1. **Column Mappings** - Need type definitions for:
   - Column index objects
   - Column name unions
   - Validation functions

2. **FieldPlan Class** - Need types for:
   - All 30+ private properties
   - Constructor parameter
   - All getter return types
   - Helper method signatures

3. **FieldProgram Class** - Need types for:
   - Numeric validation
   - Calculation method returns
   - Tactic type parameter

4. **Tactic Classes** - Need types for:
   - Range arrays
   - Method return values
   - Inherited properties

5. **Trigger Functions** - Need types for:
   - Event parameters
   - Email options
   - Budget/plan matching logic

---

## Migration Steps

### Phase 1: Setup (30 minutes)

1. ✅ Install dependencies
2. ✅ Create tsconfig.json
3. ✅ Configure clasp
4. ✅ Test compilation

```bash
# Test that everything is set up correctly
npm run compile

# Should see: "Compilation complete" or similar
```

### Phase 2: Create Type Definitions (1 hour)

Start with a types file that all others can use:

**src/types.ts:**

```typescript
/**
 * Core type definitions for Field Plan Analyzer
 */

// ============================================================================
// Raw Data Types
// ============================================================================

/**
 * Raw row data from Google Sheets
 */
export type RowData = any[];

/**
 * Normalized array field (handles both arrays and comma-separated strings)
 */
export type NormalizedField<T> = T[];

// ============================================================================
// Column Mapping Types
// ============================================================================

/**
 * All field plan column names as a union type
 */
export type FieldPlanColumnName =
  | 'SUBMISSIONDATETIME'
  | 'ATTENDEDTRAINING'
  | 'MEMBERNAME'
  | 'FIRSTNAME'
  | 'LASTNAME'
  | 'CONTACTEMAIL'
  | 'CONTACTPHONE'
  | 'DATASTORAGE'
  | 'DATASTIPEND'
  | 'DATAPLAN'
  | 'VANCOMMITTEE'
  | 'DATASHARE'
  | 'SHAREORG'
  | 'PROGRAMTOOLS'
  | 'PROGRAMDATES'
  | 'PROGRAMTYPES'
  | 'FIELDTACTICS'
  | 'TEACHCOMFORTABLE'
  | 'FIELDSTAFF'
  | 'FIELDNARRATIVE'
  | 'REVIEWEDPLAN'
  | 'RUNNINGFOROFFICE'
  | 'FIELDCOUNTIES'
  | 'CITIES'
  | 'KNOWSPRECINCTS'
  | 'PRECINCTS'
  | 'DIFFPRECINCTS'
  | 'SPECIALGEO'
  | 'DEMORACE'
  | 'DEMOAGE'
  | 'DEMOGENDER'
  | 'DEMOAFFINITY'
  | 'DEMONOTES'
  | 'DEMOCONFIDENCE'
  | 'UNDERSTANDSREASONABLE'
  | 'UNDERSTANDSDISBURSEMENT'
  | 'UNDERSTANDSTRAINING'
  | 'CONFIDENCEREASONABLE'
  | 'CONFIDENCEDATA'
  | 'CONFIDENCEPLAN'
  | 'CONFIDENCECAPACITY'
  | 'CONFIDENCESKILLS'
  | 'CONFIDENCEGOALS'
  | 'SUBMISSIONURL'
  | 'SUBMISSIONID';

/**
 * Tactic names
 */
export type TacticName = 'PHONE' | 'DOOR' | 'OPEN' | 'RELATIONAL' | 'REGISTRATION' | 'TEXT' | 'MAIL';

/**
 * Program metric names
 */
export type MetricName = 'PROGRAMLENGTH' | 'WEEKLYVOLUNTEERS' | 'WEEKLYHOURS' | 'HOURLYATTEMPTS';

// ============================================================================
// Interface Definitions
// ============================================================================

/**
 * Structure of field plan column mappings
 */
export interface FieldPlanColumns {
  SUBMISSIONDATETIME: number;
  ATTENDEDTRAINING: number;
  MEMBERNAME: number;
  FIRSTNAME: number;
  LASTNAME: number;
  CONTACTEMAIL: number;
  CONTACTPHONE: number;
  DATASTORAGE: number;
  DATASTIPEND: number;
  DATAPLAN: number;
  VANCOMMITTEE: number;
  DATASHARE: number;
  SHAREORG: number;
  PROGRAMTOOLS: number;
  PROGRAMDATES: number;
  PROGRAMTYPES: number;
  FIELDTACTICS: number;
  TEACHCOMFORTABLE: number;
  FIELDSTAFF: number;
  FIELDNARRATIVE: number;
  REVIEWEDPLAN: number;
  RUNNINGFOROFFICE: number;
  FIELDCOUNTIES: number;
  CITIES: number;
  KNOWSPRECINCTS: number;
  PRECINCTS: number;
  DIFFPRECINCTS: number;
  SPECIALGEO: number;
  DEMORACE: number;
  DEMOAGE: number;
  DEMOGENDER: number;
  DEMOAFFINITY: number;
  DEMONOTES: number;
  DEMOCONFIDENCE: number;
  UNDERSTANDSREASONABLE: number;
  UNDERSTANDSDISBURSEMENT: number;
  UNDERSTANDSTRAINING: number;
  CONFIDENCEREASONABLE: number;
  CONFIDENCEDATA: number;
  CONFIDENCEPLAN: number;
  CONFIDENCECAPACITY: number;
  CONFIDENCESKILLS: number;
  CONFIDENCEGOALS: number;
  SUBMISSIONURL: number;
  SUBMISSIONID: number;
}

/**
 * Program metrics structure
 */
export interface ProgramMetrics {
  PROGRAMLENGTH: number;
  WEEKLYVOLUNTEERS: number;
  WEEKLYHOURS: number;
  HOURLYATTEMPTS: number;
}

/**
 * Program columns organized by tactic
 */
export interface ProgramColumns {
  PHONE: ProgramMetrics;
  DOOR: ProgramMetrics;
  OPEN: ProgramMetrics;
  RELATIONAL: ProgramMetrics;
  REGISTRATION: ProgramMetrics;
  TEXT: ProgramMetrics;
  MAIL: ProgramMetrics;
}

// ============================================================================
// Email Types
// ============================================================================

/**
 * Email options for sending emails
 */
export interface EmailOptions {
  to: string;
  subject: string;
  htmlBody: string;
  body?: string;
  name?: string;
  replyTo?: string;
}

/**
 * Field plan email data
 */
export interface FieldPlanEmailData {
  organization: string;
  contactEmail: string;
  attendedTraining: string;
  narrative: string;
  tactics: string[];
  counties: string[];
  cities: string[];
  confidenceScores: ConfidenceScores;
}

/**
 * Confidence scores structure
 */
export interface ConfidenceScores {
  reasonable: number;
  data: number;
  plan: number;
  capacity: number;
  skills: number;
  goals: number;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Make all properties optional
 */
export type PartialFieldPlan = Partial<FieldPlanColumns>;

/**
 * Required fields for validation
 */
export type RequiredFieldPlanFields = Pick<
  FieldPlanColumns,
  'MEMBERNAME' | 'CONTACTEMAIL' | 'FIELDTACTICS'
>;
```

### Phase 3: Migrate Column Mappings (30 minutes)

**src/column_mappings.ts:**

```typescript
/**
 * 2026 Field Plan Column Mappings
 * TypeScript version with full type safety
 */

import type {
  FieldPlanColumns,
  ProgramColumns,
  FieldPlanColumnName,
  TacticName,
  MetricName
} from './types';

// ============================================================================
// FIELD PLAN COLUMNS
// ============================================================================

export const FIELD_PLAN_COLUMNS: FieldPlanColumns = {
  // Meta
  SUBMISSIONDATETIME: 0,
  ATTENDEDTRAINING: 1,

  // Contact
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
  TEACHCOMFORTABLE: 17,
  FIELDSTAFF: 18,
  FIELDNARRATIVE: 19,
  REVIEWEDPLAN: 20,
  RUNNINGFOROFFICE: 21,
  FIELDCOUNTIES: 22,
  CITIES: 23,
  KNOWSPRECINCTS: 24,
  PRECINCTS: 25,
  DIFFPRECINCTS: 26,
  SPECIALGEO: 27,

  // Demographics
  DEMORACE: 28,
  DEMOAGE: 29,
  DEMOGENDER: 30,
  DEMOAFFINITY: 31,
  DEMONOTES: 32,
  DEMOCONFIDENCE: 33,

  // Understanding
  UNDERSTANDSREASONABLE: 34,
  UNDERSTANDSDISBURSEMENT: 35,
  UNDERSTANDSTRAINING: 36,

  // Confidence
  CONFIDENCEREASONABLE: 65,
  CONFIDENCEDATA: 66,
  CONFIDENCEPLAN: 67,
  CONFIDENCECAPACITY: 68,
  CONFIDENCESKILLS: 69,
  CONFIDENCEGOALS: 70,

  // Metadata
  SUBMISSIONURL: 71,
  SUBMISSIONID: 72
};

// ============================================================================
// PROGRAM COLUMNS
// ============================================================================

export const PROGRAM_COLUMNS: ProgramColumns = {
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
  OPEN: {
    PROGRAMLENGTH: 45,
    WEEKLYVOLUNTEERS: 46,
    WEEKLYHOURS: 47,
    HOURLYATTEMPTS: 48
  },
  RELATIONAL: {
    PROGRAMLENGTH: 49,
    WEEKLYVOLUNTEERS: 50,
    WEEKLYHOURS: 51,
    HOURLYATTEMPTS: 52
  },
  REGISTRATION: {
    PROGRAMLENGTH: 53,
    WEEKLYVOLUNTEERS: 54,
    WEEKLYHOURS: 55,
    HOURLYATTEMPTS: 56
  },
  TEXT: {
    PROGRAMLENGTH: 57,
    WEEKLYVOLUNTEERS: 58,
    WEEKLYHOURS: 59,
    HOURLYATTEMPTS: 60
  },
  MAIL: {
    PROGRAMLENGTH: 61,
    WEEKLYVOLUNTEERS: 62,
    WEEKLYHOURS: 63,
    HOURLYATTEMPTS: 64
  }
};

// ============================================================================
// HELPER FUNCTIONS (with type safety!)
// ============================================================================

/**
 * Get column index with type checking
 * TypeScript ensures columnName is valid!
 */
export function getColumnIndex(columnName: FieldPlanColumnName): number {
  return FIELD_PLAN_COLUMNS[columnName];
}

/**
 * Get program column index with type checking
 * TypeScript ensures both tactic and metric are valid!
 */
export function getProgramColumnIndex(
  tactic: TacticName,
  metric: MetricName
): number {
  return PROGRAM_COLUMNS[tactic][metric];
}

/**
 * Validate a column index is in expected range
 */
export function isValidColumnIndex(index: number): boolean {
  return index >= 0 && index <= 72;
}

/**
 * Get all column indices as an array
 */
export function getAllColumnIndices(): number[] {
  return Object.values(FIELD_PLAN_COLUMNS);
}

/**
 * Get all program column indices
 */
export function getAllProgramIndices(): number[] {
  const indices: number[] = [];
  for (const tactic of Object.values(PROGRAM_COLUMNS)) {
    indices.push(...Object.values(tactic));
  }
  return indices;
}
```

### Phase 4: Migrate FieldPlan Class (2-3 hours)

This is the most complex file. Here's the complete TypeScript version:

**src/field_plan_parent_class.ts:**

```typescript
/**
 * FieldPlan Parent Class - TypeScript Version
 * Represents a field plan submission with full type safety
 */

import { FIELD_PLAN_COLUMNS } from './column_mappings';
import type { RowData, NormalizedField } from './types';

/**
 * Helper function to normalize array fields
 */
function normalizeField(value: any): string[] {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string' && value.includes(',')) {
    return value.split(',').map((item: string) => item.trim());
  }
  return [String(value)];
}

/**
 * FieldPlan class with full TypeScript types
 */
export class FieldPlan {
  // Meta properties
  private _submissionDateTime: string | null;
  private _attendedTraining: string | null;

  // Contact properties
  private _memberOrgName: string | null;
  private _firstName: string | null;
  private _lastName: string | null;
  private _contactEmail: string | null;
  private _contactPhone: string | null;

  // Data & Tools properties
  private _dataStorage: string[];
  private _dataStipend: string | null;
  private _dataPlan: string | null;
  private _vanCommittee: string[];
  private _dataShare: string | null;
  private _shareOrg: string[];
  private _programTools: string[];
  private _programDates: string | null;
  private _programTypes: string[];

  // Tactics & Locations properties
  private _fieldTactics: string[];
  private _teachComfortable: string[];
  private _fieldStaff: string[];
  private _fieldNarrative: string | null;
  private _reviewedPlan: string | null;
  private _runningForOffice: string | null;
  private _fieldCounties: string[];
  private _cities: string[];
  private _knowsPrecincts: string | null;
  private _fieldPrecincts: string[];
  private _diffPrecincts: string | null;
  private _specialGeo: string[];

  // Demographics properties
  private _demoRace: string[];
  private _demoAge: string[];
  private _demoGender: string[];
  private _demoAffinity: string[];
  private _demoNotes: string | null;
  private _demoConfidence: string | null;

  // Understanding properties
  private _understandsReasonable: string | null;
  private _understandsDisbursement: string | null;
  private _understandsTraining: string | null;

  // Confidence properties
  private _confidenceReasonable: number | null;
  private _confidenceData: number | null;
  private _confidencePlan: number | null;
  private _confidenceCapacity: number | null;
  private _confidenceSkills: number | null;
  private _confidenceGoals: number | null;

  // Metadata properties
  private _submissionUrl: string | null;
  private _submissionId: string | null;

  /**
   * Constructor - takes raw row data from Google Sheets
   */
  constructor(rowData: RowData) {
    Logger.log('FieldPlan Constructor rowData:');
    Logger.log(rowData);

    // Meta
    this._submissionDateTime = rowData[FIELD_PLAN_COLUMNS.SUBMISSIONDATETIME] || null;
    this._attendedTraining = rowData[FIELD_PLAN_COLUMNS.ATTENDEDTRAINING] || null;

    // Contact
    this._memberOrgName = rowData[FIELD_PLAN_COLUMNS.MEMBERNAME] || null;
    this._firstName = rowData[FIELD_PLAN_COLUMNS.FIRSTNAME] || null;
    this._lastName = rowData[FIELD_PLAN_COLUMNS.LASTNAME] || null;
    this._contactEmail = rowData[FIELD_PLAN_COLUMNS.CONTACTEMAIL] || null;
    this._contactPhone = rowData[FIELD_PLAN_COLUMNS.CONTACTPHONE] || null;

    // Data & Tools
    this._dataStorage = normalizeField(rowData[FIELD_PLAN_COLUMNS.DATASTORAGE]);
    this._dataStipend = rowData[FIELD_PLAN_COLUMNS.DATASTIPEND] || null;
    this._dataPlan = rowData[FIELD_PLAN_COLUMNS.DATAPLAN] || null;
    this._vanCommittee = normalizeField(rowData[FIELD_PLAN_COLUMNS.VANCOMMITTEE]);
    this._dataShare = rowData[FIELD_PLAN_COLUMNS.DATASHARE] || null;
    this._shareOrg = normalizeField(rowData[FIELD_PLAN_COLUMNS.SHAREORG]);
    this._programTools = normalizeField(rowData[FIELD_PLAN_COLUMNS.PROGRAMTOOLS]);
    this._programDates = rowData[FIELD_PLAN_COLUMNS.PROGRAMDATES] || null;
    this._programTypes = normalizeField(rowData[FIELD_PLAN_COLUMNS.PROGRAMTYPES]);

    // Tactics & Locations
    this._fieldTactics = normalizeField(rowData[FIELD_PLAN_COLUMNS.FIELDTACTICS]);
    this._teachComfortable = normalizeField(rowData[FIELD_PLAN_COLUMNS.TEACHCOMFORTABLE]);
    this._fieldStaff = normalizeField(rowData[FIELD_PLAN_COLUMNS.FIELDSTAFF]);
    this._fieldNarrative = rowData[FIELD_PLAN_COLUMNS.FIELDNARRATIVE] || null;
    this._reviewedPlan = rowData[FIELD_PLAN_COLUMNS.REVIEWEDPLAN] || null;
    this._runningForOffice = rowData[FIELD_PLAN_COLUMNS.RUNNINGFOROFFICE] || null;
    this._fieldCounties = normalizeField(rowData[FIELD_PLAN_COLUMNS.FIELDCOUNTIES]);
    this._cities = normalizeField(rowData[FIELD_PLAN_COLUMNS.CITIES]);
    this._knowsPrecincts = rowData[FIELD_PLAN_COLUMNS.KNOWSPRECINCTS] || null;
    this._fieldPrecincts = normalizeField(rowData[FIELD_PLAN_COLUMNS.PRECINCTS]);
    this._diffPrecincts = rowData[FIELD_PLAN_COLUMNS.DIFFPRECINCTS] || null;
    this._specialGeo = normalizeField(rowData[FIELD_PLAN_COLUMNS.SPECIALGEO]);

    // Demographics
    this._demoRace = normalizeField(rowData[FIELD_PLAN_COLUMNS.DEMORACE]);
    this._demoAge = normalizeField(rowData[FIELD_PLAN_COLUMNS.DEMOAGE]);
    this._demoGender = normalizeField(rowData[FIELD_PLAN_COLUMNS.DEMOGENDER]);
    this._demoAffinity = normalizeField(rowData[FIELD_PLAN_COLUMNS.DEMOAFFINITY]);
    this._demoNotes = rowData[FIELD_PLAN_COLUMNS.DEMONOTES] || null;
    this._demoConfidence = rowData[FIELD_PLAN_COLUMNS.DEMOCONFIDENCE] || null;

    // Understanding
    this._understandsReasonable = rowData[FIELD_PLAN_COLUMNS.UNDERSTANDSREASONABLE] || null;
    this._understandsDisbursement = rowData[FIELD_PLAN_COLUMNS.UNDERSTANDSDISBURSEMENT] || null;
    this._understandsTraining = rowData[FIELD_PLAN_COLUMNS.UNDERSTANDSTRAINING] || null;

    // Confidence (convert to numbers)
    this._confidenceReasonable = this.parseNumber(rowData[FIELD_PLAN_COLUMNS.CONFIDENCEREASONABLE]);
    this._confidenceData = this.parseNumber(rowData[FIELD_PLAN_COLUMNS.CONFIDENCEDATA]);
    this._confidencePlan = this.parseNumber(rowData[FIELD_PLAN_COLUMNS.CONFIDENCEPLAN]);
    this._confidenceCapacity = this.parseNumber(rowData[FIELD_PLAN_COLUMNS.CONFIDENCECAPACITY]);
    this._confidenceSkills = this.parseNumber(rowData[FIELD_PLAN_COLUMNS.CONFIDENCESKILLS]);
    this._confidenceGoals = this.parseNumber(rowData[FIELD_PLAN_COLUMNS.CONFIDENCEGOALS]);

    // Metadata
    this._submissionUrl = rowData[FIELD_PLAN_COLUMNS.SUBMISSIONURL] || null;
    this._submissionId = rowData[FIELD_PLAN_COLUMNS.SUBMISSIONID] || null;
  }

  /**
   * Helper to safely parse numbers
   */
  private parseNumber(value: any): number | null {
    const num = Number(value);
    return isNaN(num) ? null : num;
  }

  // ============================================================================
  // GETTERS (all with explicit return types!)
  // ============================================================================

  // Meta getters
  get submissionDateTime(): string | null { return this._submissionDateTime; }
  get attendedTraining(): string | null { return this._attendedTraining; }

  // Contact getters
  get memberOrgName(): string | null { return this._memberOrgName; }
  get firstName(): string | null { return this._firstName; }
  get lastName(): string | null { return this._lastName; }
  get contactEmail(): string | null { return this._contactEmail; }
  get contactPhone(): string | null { return this._contactPhone; }

  // Data & Tools getters
  get dataStorage(): string[] { return this._dataStorage; }
  get dataStipend(): string | null { return this._dataStipend; }
  get dataPlan(): string | null { return this._dataPlan; }
  get vanCommittee(): string[] { return this._vanCommittee; }
  get dataShare(): string | null { return this._dataShare; }
  get shareOrg(): string[] { return this._shareOrg; }
  get programTools(): string[] { return this._programTools; }
  get programDates(): string | null { return this._programDates; }
  get programTypes(): string[] { return this._programTypes; }

  // Tactics & Locations getters
  get fieldTactics(): string[] { return this._fieldTactics; }
  get teachComfortable(): string[] { return this._teachComfortable; }
  get fieldStaff(): string[] { return this._fieldStaff; }
  get fieldNarrative(): string | null { return this._fieldNarrative; }
  get reviewedPlan(): string | null { return this._reviewedPlan; }
  get runningForOffice(): string | null { return this._runningForOffice; }
  get fieldCounties(): string[] { return this._fieldCounties; }
  get cities(): string[] { return this._cities; }
  get knowsPrecincts(): string | null { return this._knowsPrecincts; }
  get fieldPrecincts(): string[] { return this._fieldPrecincts; }
  get diffPrecincts(): string | null { return this._diffPrecincts; }
  get specialGeo(): string[] { return this._specialGeo; }

  // Demographics getters
  get demoRace(): string[] { return this._demoRace; }
  get demoAge(): string[] { return this._demoAge; }
  get demoGender(): string[] { return this._demoGender; }
  get demoAffinity(): string[] { return this._demoAffinity; }
  get demoNotes(): string | null { return this._demoNotes; }
  get demoConfidence(): string | null { return this._demoConfidence; }

  // Understanding getters
  get understandsReasonable(): string | null { return this._understandsReasonable; }
  get understandsDisbursement(): string | null { return this._understandsDisbursement; }
  get understandsTraining(): string | null { return this._understandsTraining; }

  // Confidence getters
  get confidenceReasonable(): number | null { return this._confidenceReasonable; }
  get confidenceData(): number | null { return this._confidenceData; }
  get confidencePlan(): number | null { return this._confidencePlan; }
  get confidenceCapacity(): number | null { return this._confidenceCapacity; }
  get confidenceSkills(): number | null { return this._confidenceSkills; }
  get confidenceGoals(): number | null { return this._confidenceGoals; }

  // Metadata getters
  get submissionUrl(): string | null { return this._submissionUrl; }
  get submissionId(): string | null { return this._submissionId; }

  // ============================================================================
  // HELPER METHODS (all with parameter and return types!)
  // ============================================================================

  hasDataStorage(item: string): boolean {
    return this._dataStorage.includes(item);
  }

  hasProgramTool(tool: string): boolean {
    return this._programTools.includes(tool);
  }

  hasFieldTactic(tactic: string): boolean {
    return this._fieldTactics.includes(tactic);
  }

  hasFieldCounty(county: string): boolean {
    return this._fieldCounties.includes(county);
  }

  hasCity(city: string): boolean {
    return this._cities.includes(city);
  }

  hasFieldPrecinct(precinct: string): boolean {
    return this._fieldPrecincts.includes(precinct);
  }

  hasDemoRace(race: string): boolean {
    return this._demoRace.includes(race);
  }

  hasDemoAge(age: string): boolean {
    return this._demoAge.includes(age);
  }

  hasDemoGender(gender: string): boolean {
    return this._demoGender.includes(gender);
  }

  hasDemoAffinity(affinity: string): boolean {
    return this._demoAffinity.includes(affinity);
  }

  // ============================================================================
  // STATIC FACTORY METHODS
  // ============================================================================

  /**
   * Create FieldPlan from last row of sheet
   */
  static fromLastRow(): FieldPlan {
    const sheet = SpreadsheetApp.getActive().getSheetByName('2026_field_plan');
    if (!sheet) {
      throw new Error('Sheet "2026_field_plan" not found');
    }

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) {
      throw new Error('No data rows found in sheet');
    }

    const rowData = sheet.getRange(lastRow, 1, 1, sheet.getLastColumn()).getValues()[0];
    return new FieldPlan(rowData);
  }

  /**
   * Create FieldPlan from specific row number
   */
  static fromSpecificRow(rowNumber: number): FieldPlan {
    const sheet = SpreadsheetApp.getActive().getSheetByName('2026_field_plan');
    if (!sheet) {
      throw new Error('Sheet "2026_field_plan" not found');
    }

    if (rowNumber < 2) {
      throw new Error('Row number must be 2 or greater (row 1 is headers)');
    }

    const rowData = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
    return new FieldPlan(rowData);
  }
}
```

### Phase 5: Migrate FieldProgram Class (1-2 hours)

**src/field_program_extension_class.ts:**

```typescript
/**
 * FieldProgram Extension Class - TypeScript Version
 * Extends FieldPlan to add program metrics
 */

import { FieldPlan } from './field_plan_parent_class';
import { PROGRAM_COLUMNS } from './column_mappings';
import type { RowData, TacticName } from './types';

/**
 * FieldProgram class with typed program metrics
 */
export class FieldProgram extends FieldPlan {
  protected _programLength: number;
  protected _weeklyVolunteers: number;
  protected _weeklyHours: number;
  protected _hourlyAttempts: number;

  constructor(rowData: RowData, tacticType: TacticName) {
    Logger.log('FieldProgram Constructor called with tacticType:', tacticType);
    super(rowData);
    Logger.log('FieldProgram: Parent constructor completed');

    const columns = PROGRAM_COLUMNS[tacticType];
    if (!columns) {
      throw new Error(`Invalid tactic type: ${tacticType}`);
    }

    // Validate and assign program metrics
    this._programLength = this.validateColumn(
      rowData[columns.PROGRAMLENGTH],
      'Program Length'
    );
    this._weeklyVolunteers = this.validateColumn(
      rowData[columns.WEEKLYVOLUNTEERS],
      'Weekly Volunteers'
    );
    this._weeklyHours = this.validateColumn(
      rowData[columns.WEEKLYHOURS],
      'Weekly Hours'
    );
    this._hourlyAttempts = this.validateColumn(
      rowData[columns.HOURLYATTEMPTS],
      'Hourly Attempts'
    );
  }

  /**
   * Validate that a column value is a valid positive number
   */
  private validateColumn(value: any, fieldName: string): number {
    const num = Number(value);

    if (typeof value !== 'number' || isNaN(num)) {
      throw new TypeError(
        `Invalid data: ${fieldName} must be a valid number. Got: ${value}`
      );
    }

    if (num <= 0) {
      throw new RangeError(
        `Invalid data: ${fieldName} must be greater than 0. Got: ${num}`
      );
    }

    return num;
  }

  // ============================================================================
  // GETTERS
  // ============================================================================

  get programLength(): number { return this._programLength; }
  get weeklyVolunteers(): number { return this._weeklyVolunteers; }
  get weeklyVolunteerHours(): number { return this._weeklyHours; }
  get hourlyAttempts(): number { return this._hourlyAttempts; }

  // ============================================================================
  // CALCULATION METHODS
  // ============================================================================

  /**
   * Calculate total volunteer hours for entire program
   */
  programVolunteerHours(): number {
    return this._weeklyVolunteers * this._weeklyHours * this._programLength;
  }

  /**
   * Calculate volunteer hours per week
   */
  weekVolunteerHours(): number {
    return this._weeklyVolunteers * this._weeklyHours;
  }

  /**
   * Calculate contact attempts per week
   */
  weeklyAttempts(): number {
    return this._weeklyVolunteers * this._weeklyHours * this._hourlyAttempts;
  }

  /**
   * Calculate total contact attempts for entire program
   */
  programAttempts(): number {
    return (
      this._programLength *
      this._weeklyVolunteers *
      this._weeklyHours *
      this._hourlyAttempts
    );
  }

  /**
   * Get reasonable range (attempts per hour)
   */
  reasonableRange(): number {
    return this._hourlyAttempts;
  }
}
```

### Phase 6: Migrate Tactic Classes (1 hour)

**src/field_tactics_extension_class.ts:**

```typescript
/**
 * Field Tactics Extension Classes - TypeScript Version
 * Individual tactic classes (Phone, Door, etc.)
 */

import { FieldProgram } from './field_program_extension_class';
import type { RowData } from './types';

/**
 * Base range configuration for tactics
 */
interface TacticRange {
  lower: number;
  upper: number;
}

// ============================================================================
// PHONE BANKING
// ============================================================================

export class PhoneTactic extends FieldProgram {
  private _name: string;
  private _phoneRange: TacticRange;
  private _phoneReasonable: number;

  constructor(rowData: RowData) {
    super(rowData, 'PHONE');
    this._name = 'Phone';
    this._phoneRange = { lower: 0.05, upper: 0.10 };
    this._phoneReasonable = 30;
  }

  phoneAttemptReasonable(): string {
    const range = this.reasonableRange();

    if (range <= this._phoneReasonable) {
      return `${this.memberOrgName} has a reasonable hourly attempt where each volunteer is only expected to attempt to contact ${range} people per hour`;
    } else if (range > this._phoneReasonable && range <= this._phoneReasonable + 10) {
      return `${this.memberOrgName} is at risk of expecting too many attempts for each volunteer. They expect ${range} attempts per hour per volunteer.`;
    } else {
      return `${this.memberOrgName} is expecting an unrealistic number of attempts per hour for their volunteers. They expect ${range} contacts each hour per volunteer.`;
    }
  }

  phoneExpectedContacts(): string {
    const attempts = this.programAttempts();
    const phoneLowerRange = Math.round(attempts * this._phoneRange.lower);
    const phoneUpperRange = Math.round(attempts * this._phoneRange.upper);

    return `${this.memberOrgName} intends to successfully reach between ${phoneLowerRange} and ${phoneUpperRange} people during the course of their ${this.programLength} week program`;
  }
}

// ============================================================================
// DOOR TO DOOR CANVASSING
// ============================================================================

export class DoorTactic extends FieldProgram {
  private _name: string;
  private _doorRange: TacticRange;
  private _doorReasonable: number;

  constructor(rowData: RowData) {
    super(rowData, 'DOOR');
    this._name = 'Door';
    this._doorRange = { lower: 0.05, upper: 0.10 };
    this._doorReasonable = 30;
  }

  doorAttemptReasonable(): string {
    const range = this.reasonableRange();

    if (range <= this._doorReasonable) {
      return `${this.memberOrgName} has a reasonable hourly attempt where each volunteer is only expected to attempt to contact ${range} people per hour`;
    } else if (range > this._doorReasonable && range <= this._doorReasonable + 10) {
      return `${this.memberOrgName} is at risk of expecting too many attempts for each volunteer. They expect ${range} attempts per hour per volunteer.`;
    } else {
      return `${this.memberOrgName} is expecting an unrealistic number of attempts per hour for their volunteers. They expect ${range} contacts each hour per volunteer.`;
    }
  }

  doorExpectedContacts(): string {
    const attempts = this.programAttempts();
    const doorLowerRange = Math.round(attempts * this._doorRange.lower);
    const doorUpperRange = Math.round(attempts * this._doorRange.upper);

    return `${this.memberOrgName} intends to successfully reach between ${doorLowerRange} and ${doorUpperRange} people during the course of their ${this.programLength} week program`;
  }
}

// ============================================================================
// OPEN CANVASSING / TABLING
// ============================================================================

export class OpenTactic extends FieldProgram {
  private _name: string;
  private _openRange: TacticRange;
  private _openReasonable: number;

  constructor(rowData: RowData) {
    super(rowData, 'OPEN');
    this._name = 'Open Canvassing';
    this._openRange = { lower: 0.10, upper: 0.20 };
    this._openReasonable = 60;
  }

  openAttemptReasonable(): string {
    const range = this.reasonableRange();

    if (range <= this._openReasonable) {
      return `${this.memberOrgName} has a reasonable hourly attempt where each volunteer is only expected to attempt to contact ${range} people per hour`;
    } else if (range > this._openReasonable && range <= this._openReasonable + 10) {
      return `${this.memberOrgName} is at risk of expecting too many attempts for each volunteer. They expect ${range} attempts per hour per volunteer.`;
    } else {
      return `${this.memberOrgName} is expecting an unrealistic number of attempts per hour for their volunteers. They expect ${range} contacts each hour per volunteer.`;
    }
  }

  openExpectedContacts(): string {
    const attempts = this.programAttempts();
    const openLowerRange = Math.round(attempts * this._openRange.lower);
    const openUpperRange = Math.round(attempts * this._openRange.upper);

    return `${this.memberOrgName} intends to successfully reach between ${openLowerRange} and ${openUpperRange} people during the course of their ${this.programLength} week program`;
  }
}

// ============================================================================
// RELATIONAL ORGANIZING
// ============================================================================

export class RelationalTactic extends FieldProgram {
  private _name: string;
  private _relationalRange: TacticRange;
  private _relationalReasonable: number;

  constructor(rowData: RowData) {
    super(rowData, 'RELATIONAL');
    this._name = 'Relational Organizing';
    this._relationalRange = { lower: 0.50, upper: 0.70 };
    this._relationalReasonable = 30;
  }

  relationalAttemptReasonable(): string {
    const range = this.reasonableRange();

    if (range <= this._relationalReasonable) {
      return `${this.memberOrgName} has a reasonable hourly attempt where each volunteer is only expected to attempt to contact ${range} people per hour`;
    } else if (range > this._relationalReasonable && range <= this._relationalReasonable + 10) {
      return `${this.memberOrgName} is at risk of expecting too many attempts for each volunteer. They expect ${range} attempts per hour per volunteer.`;
    } else {
      return `${this.memberOrgName} is expecting an unrealistic number of attempts per hour for their volunteers. They expect ${range} contacts each hour per volunteer.`;
    }
  }

  relationalExpectedContacts(): string {
    const attempts = this.programAttempts();
    const relationalLowerRange = Math.round(attempts * this._relationalRange.lower);
    const relationalUpperRange = Math.round(attempts * this._relationalRange.upper);

    return `${this.memberOrgName} intends to successfully reach between ${relationalLowerRange} and ${relationalUpperRange} people during the course of their ${this.programLength} week program`;
  }
}

// ============================================================================
// VOTER REGISTRATION
// ============================================================================

export class RegistrationTactic extends FieldProgram {
  private _name: string;
  private _registrationRange: TacticRange;
  private _registrationReasonable: number;

  constructor(rowData: RowData) {
    super(rowData, 'REGISTRATION');
    this._name = 'Voter Registration';
    this._registrationRange = { lower: 0.10, upper: 0.30 };
    this._registrationReasonable = 5;
  }

  registrationAttemptReasonable(): string {
    const range = this.reasonableRange();

    if (range <= this._registrationReasonable) {
      return `${this.memberOrgName} has a reasonable hourly attempt where each volunteer is only expected to attempt to contact ${range} people per hour`;
    } else if (range > this._registrationReasonable && range <= this._registrationReasonable + 10) {
      return `${this.memberOrgName} is at risk of expecting too many attempts for each volunteer. They expect ${range} attempts per hour per volunteer.`;
    } else {
      return `${this.memberOrgName} is expecting an unrealistic number of attempts per hour for their volunteers. They expect ${range} contacts each hour per volunteer.`;
    }
  }

  registrationExpectedContacts(): string {
    const attempts = this.programAttempts();
    const registrationLowerRange = Math.round(attempts * this._registrationRange.lower);
    const registrationUpperRange = Math.round(attempts * this._registrationRange.upper);

    return `${this.memberOrgName} intends to successfully reach between ${registrationLowerRange} and ${registrationUpperRange} during the course of their ${this.programLength} week program`;
  }
}

// ============================================================================
// TEXT BANKING
// ============================================================================

export class TextTactic extends FieldProgram {
  private _name: string;
  private _textRange: TacticRange;
  private _textReasonable: number;

  constructor(rowData: RowData) {
    super(rowData, 'TEXT');
    this._name = 'Text Banking';
    this._textRange = { lower: 0.01, upper: 0.05 };
    this._textReasonable = 2000;
  }

  textAttemptReasonable(): string {
    const range = this.reasonableRange();

    if (range <= this._textReasonable) {
      return `${this.memberOrgName} has a reasonable hourly attempt where each volunteer is only expected to attempt to contact ${range} people per hour`;
    } else if (range > this._textReasonable && range <= this._textReasonable + 10) {
      return `${this.memberOrgName} is at risk of expecting too many attempts for each volunteer. They expect ${range} attempts per hour per volunteer.`;
    } else {
      return `${this.memberOrgName} is expecting an unrealistic number of attempts per hour for their volunteers. They expect ${range} contacts each hour per volunteer.`;
    }
  }

  textExpectedContacts(): string {
    const attempts = this.programAttempts();
    const textLowerRange = Math.round(attempts * this._textRange.lower);
    const textUpperRange = Math.round(attempts * this._textRange.upper);

    return `${this.memberOrgName} intends to successfully reach between ${textLowerRange} and ${textUpperRange} people during the course of their ${this.programLength} week program`;
  }
}

// ============================================================================
// MAILERS
// ============================================================================

export class MailTactic extends FieldProgram {
  private _name: string;
  private _mailRange: TacticRange;
  private _mailReasonable: number;

  constructor(rowData: RowData) {
    super(rowData, 'MAIL');
    this._name = 'Mail';
    this._mailRange = { lower: 0.70, upper: 0.90 };
    this._mailReasonable = 1000;
  }

  mailAttemptReasonable(): string {
    const range = this.reasonableRange();

    if (range <= this._mailReasonable) {
      return `${this.memberOrgName} has a reasonable hourly attempt where each volunteer is only expected to attempt to contact ${range} people per hour`;
    } else if (range > this._mailReasonable && range <= this._mailReasonable + 10) {
      return `${this.memberOrgName} is at risk of expecting too many attempts for each volunteer. They expect ${range} attempts per hour per volunteer.`;
    } else {
      return `${this.memberOrgName} is expecting an unrealistic number of attempts per hour for their volunteers. They expect ${range} contacts each hour per volunteer.`;
    }
  }

  mailExpectedContacts(): string {
    const attempts = this.programAttempts();
    const mailLowerRange = Math.round(attempts * this._mailRange.lower);
    const mailUpperRange = Math.round(attempts * this._mailRange.upper);

    return `${this.memberOrgName} intends to successfully reach between ${mailLowerRange} and ${mailUpperRange} people during the course of their ${this.programLength} week program`;
  }
}
```

---

## Testing TypeScript Code

### Compile and Test

```bash
# Compile TypeScript to JavaScript
npm run compile

# You should see output in build/ directory

# Test compilation without errors
npm run lint

# If no errors, you're good to go!
```

### Push to Apps Script

```bash
# Compile and push to Apps Script
npm run push

# Or watch for changes
npm run push:watch
```

### Test in Apps Script

1. Open your Apps Script project
2. You should see compiled `.js` files
3. Run your test functions
4. Everything should work exactly as before!

---

## Common Issues & Solutions

### Issue 1: "Cannot find module './types'"

**Solution:**
Make sure all imports use relative paths:
```typescript
// ✅ Correct
import type { RowData } from './types';

// ❌ Wrong
import type { RowData } from 'types';
```

### Issue 2: "Property does not exist on type"

**Solution:**
This means TypeScript caught a real bug! Check:
- Are you accessing the right property name?
- Did you define all properties in your interface?
- Is the property actually available at runtime?

### Issue 3: Compilation errors with "strictNullChecks"

**Solution:**
Use null checks:
```typescript
// ❌ Error: Object is possibly 'null'
const length = this._memberOrgName.length;

// ✅ Fixed: Check for null first
const length = this._memberOrgName?.length ?? 0;
```

### Issue 4: clasp push fails

**Solution:**
```bash
# Make sure .claspignore excludes .ts files
cat .claspignore

# Should include:
# **/*.ts

# Compile first, then push
npm run compile
clasp push
```

---

## Benefits You'll See

### 1. Immediate Error Detection

**Before (JavaScript):**
```javascript
// Typo goes unnoticed until runtime
const email = fieldPlan.contactEmial;  // undefined!
```

**After (TypeScript):**
```typescript
// TypeScript catches typo at compile time
const email = fieldPlan.contactEmial;
//                      ^^^^^^^^^
// Error: Property 'contactEmial' does not exist.
// Did you mean 'contactEmail'?
```

### 2. Better Refactoring

**Scenario:** You need to rename `memberOrgName` to `organizationName`

**Before:** Search and replace, hope you didn't miss anything

**After:** Rename in one place, TypeScript shows you ALL places that need updating

### 3. Autocomplete Everything

In VS Code, when you type `fieldPlan.`, you'll see:
- All available properties
- Their types
- Inline documentation

### 4. Catch Logic Errors

```typescript
// TypeScript catches this!
const confidence: number = fieldPlan.contactEmail;
//    ^^^^^^^^^^
// Error: Type 'string | null' is not assignable to type 'number'
```

### 5. Self-Documenting

```typescript
// The types tell you exactly what's expected
function sendEmail(plan: FieldPlan, rowNumber: number): void {
  // Clear what goes in and what comes out!
}
```

---

## Next Steps

1. ✅ **Start Small** - Convert column_mappings.js first
2. ✅ **Test Often** - Compile after each file
3. ✅ **Use Git** - Commit after each successful migration
4. ✅ **Learn Gradually** - Don't worry about advanced TypeScript features yet

**You're now ready to migrate to TypeScript! Start with Phase 1 and work through step-by-step.** 🚀
