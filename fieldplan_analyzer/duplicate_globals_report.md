# Duplicate Global Variables Report
## Field Plan Analyzer Project

### Summary
After analyzing all JavaScript files in the fieldplan_analyzer project, I found the following global variables and their occurrences:

### Global Variables Found

#### 1. **PROGRAM_COLUMNS** (const)
- **File:** `field_program_extension_class.js`
- **Line:** 1
- **Type:** Object constant containing column mappings for different program types
- **Duplicates:** None found

#### 2. **scriptProps** (const)
- **File:** `field_trigger_functions.js`
- **Line:** 2
- **Type:** PropertiesService.getScriptProperties() reference
- **Duplicates:** None found (referenced in other files but not redeclared)

#### 3. **EMAIL_CONFIG** (const)
- **File:** `field_trigger_functions.js`
- **Line:** 3-7
- **Type:** Object containing email configuration
- **Duplicates:** None found

### Class Definitions (Global Scope)
These are class definitions at the global scope, which are not duplicates but are globally accessible:

1. **FieldProgram** - `field_program_extension_class.js:50`
2. **PhoneTactic** - `field_tactics_extension_class.js:2`
3. **DoorTactic** - `field_tactics_extension_class.js:30`
4. **OpenTactic** - `field_tactics_extension_class.js:59`
5. **RelationalTactic** - `field_tactics_extension_class.js:86`
6. **RegistrationTactic** - `field_tactics_extension_class.js:113`
7. **TextTactic** - `field_tactics_extension_class.js:141`
8. **MailTactic** - `field_tactics_extension_class.js:168`
9. **FieldBudget** - `budget_class.js:1`
10. **FieldPlan** - `field_plan_parent_class.js:1`

### Static Properties on Classes
These are defined as static properties on classes, effectively making them global constants:

1. **FieldBudget.COLUMNS** - `budget_class.js:348-405`
2. **FieldPlan.COLUMNS** - `field_plan_parent_class.js:165-195`

### Function Definitions (Global Scope)
All functions defined at the top level are technically global, but I've focused on variable declarations as requested.

### Analysis Results

**No duplicate global variables were found.** 

The codebase follows good practices by:
1. Using a single global constant `PROGRAM_COLUMNS` that's referenced across multiple files
2. Defining `scriptProps` once and using it throughout
3. Using class static properties for column definitions instead of global variables
4. Avoiding redeclaration of global variables across files

### Recommendations

While no duplicates were found, here are some observations:
1. The code makes good use of Apps Script's shared global scope
2. Constants are properly defined once and reused
3. The use of static class properties for `COLUMNS` definitions helps namespace the constants appropriately

### Cross-File Dependencies

- `budget_trigger_functions.js` references:
  - `PROGRAM_COLUMNS` (from `field_program_extension_class.js`)
  - `scriptProps` (from `field_trigger_functions.js`)
  - `getEmailRecipients()` (from `field_trigger_functions.js`)

- Multiple files reference the class definitions from:
  - `field_plan_parent_class.js` (FieldPlan)
  - `budget_class.js` (FieldBudget)
  - `field_program_extension_class.js` (FieldProgram)
  - `field_tactics_extension_class.js` (various tactic classes)

All cross-file references are valid and don't create duplicates, which is expected behavior in Google Apps Script where all files share the same global scope.