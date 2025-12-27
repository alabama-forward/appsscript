# 2026 Field Plan Analyzer - Update Preparation Guide

## Overview

This guide identifies all code that needs updating in the 2026 analyzer to work with the new 2026 Google Form structure. The current 2026 code is a **direct copy of 2025** and will **NOT work correctly** until these updates are made.

---

## 🚨 Critical Discovery

**The 2026 analyzer currently uses 2025 column mappings throughout!**

All references to:
- Column indices (FieldPlan.COLUMNS and PROGRAM_COLUMNS)
- Sheet names ('2025_field_plan')
- Script properties ('SHEET_FIELD_PLAN' defaults to '2025_field_plan')

Need to be updated for 2026 compatibility.

---

## Phase 1: Core Class Updates (REQUIRED - Must Be Done First)

### 1.1 Update field_plan_parent_class.js

**Location:** `src/field_plan_parent_class.js`

#### Required Changes:

**A. Update FieldPlan.COLUMNS constant (Line ~168)**
- ❌ Current: Uses 2025 column indices
- ✅ Required: Update to 2026 column indices (see column_mapping_guide.md)
- **Impact:** ALL data reading will fail without this
- **Priority:** CRITICAL

**B. Add 21 new constructor properties (Line ~40)**
New properties to add:
- `_attendedTraining` (column 1)
- `_dataStipend` (column 8)
- `_dataPlan` (column 9)
- `_dataShare` (column 11)
- `_shareOrg` (column 12)
- `_programDates` (column 14)
- `_programTypes` (column 15)
- `_teachComfortable` (column 17)
- `_fieldStaff` (column 18)
- `_fieldStaffNotes` (column 19)
- `_reviewedPlan` (column 20)
- `_runningForOffice` (column 21)
- `_cities` (column 23)
- `_knowsPrecincts` (column 24)
- `_diffPrecincts` (column 26)
- `_specialGeo` (column 27)
- `_demoNotes` (column 32)
- `_demoConfidence` (column 33)
- `_understandsReasonable` (column 34)
- `_understandsDisbursement` (column 35)
- `_understandsTraining` (column 36)
- 6 new confidence properties (columns 65-70)
- `_submissionUrl` (column 71)
- `_submissionId` (column 72)

**C. Add 21 new getter methods (Line ~88)**
One getter for each new property above

**D. Add 6 new helper methods for array fields (Line ~110)**
- `hasShareOrg(org)`
- `hasProgramType(type)`
- `hasTeachComfortable(tactic)`
- `hasFieldStaff(staff)`
- `hasCity(city)`
- `hasSpecialGeo(area)`

**E. Update needsCoaching() method (Line ~150)**
- ❌ Current: Uses `this._fieldPlanConfidence` (doesn't exist in 2026)
- ✅ Required: Rewrite to use 6 new confidence fields
- See column_mapping_guide.md for two implementation options

**F. Update static methods default sheet name (Lines 5, 15, 25)**
- ❌ Current: `'2025_field_plan'`
- ✅ Required: `'2026_field_plan'`

---

### 1.2 Update field_program_extension_class.js

**Location:** `src/field_program_extension_class.js`

#### Required Changes:

**A. Update PROGRAM_COLUMNS constant (Line 1)**
All column indices need to shift by +11:
```javascript
// OLD (2025):
PHONE: { PROGRAMLENGTH: 26, WEEKLYVOLUNTEERS: 27, WEEKLYHOURS: 28, HOURLYATTEMPTS: 29 }

// NEW (2026):
PHONE: { PROGRAMLENGTH: 37, WEEKLYVOLUNTEERS: 38, WEEKLYHOURS: 39, HOURLYATTEMPTS: 40 }
```

Apply this +11 shift to ALL 7 tactics:
- PHONE: 26-29 → 37-40
- DOOR: 30-33 → 41-44
- OPEN: 34-37 → 45-48
- RELATIONAL: 38-41 → 49-52
- REGISTRATION: 42-45 → 53-56
- TEXT: 46-49 → 57-60
- MAIL: 50-53 → 61-64

**Priority:** CRITICAL (Program metrics won't calculate without this)

---

### 1.3 field_tactics_extension_class.js - No Changes Needed ✓

**Location:** `src/field_tactics_extension_class.js`

This file inherits from FieldProgram and doesn't directly reference columns, so no changes are needed. However, it **depends on** the updates to the parent classes being done correctly.

**Validation:** After updating parent classes, test that tactic classes still work correctly.

---

## Phase 2: Email & Notification Updates (REQUIRED - For Email Functionality)

### 2.1 Update sendFieldPlanEmail() function

**Location:** `src/field_trigger_functions.js`, Line ~222

#### Current Email Sections:
1. Contact Information ✓ (works with existing fields)
2. Program Details (partial - missing new fields)
3. Demographics (partial - missing new fields)
4. Coaching Assessment (needs update)
5. Field Tactic Analysis ✓ (works if parent classes updated)

#### Required Additions:

**A. Add new "Training & Preparation" section:**
```javascript
<h3>Training & Preparation</h3>
<p><strong>Attended Training:</strong> ${fieldPlan.attendedTraining || 'Not specified'}</p>
<p><strong>Reviewed Table Field Plan:</strong> ${fieldPlan.reviewedPlan || 'Not specified'}</p>
<p><strong>Understands Requirements:</strong>
  Reasonable/Realistic: ${fieldPlan.understandsReasonable || 'Not specified'},
  Grant Disbursement: ${fieldPlan.understandsDisbursement || 'Not specified'},
  Training Importance: ${fieldPlan.understandsTraining || 'Not specified'}
</p>
```

**B. Enhance "Program Details" section:**
Add:
```javascript
<p><strong>Data Entry Stipend:</strong> ${fieldPlan.dataStipend || 'Not specified'}</p>
<p><strong>Data Digitization Plan:</strong> ${fieldPlan.dataPlan || 'Not specified'}</p>
<p><strong>Data Sharing:</strong> ${fieldPlan.dataShare || 'Not specified'}</p>
<p><strong>Share With Organizations:</strong> ${
  fieldPlan.shareOrg ?
  (Array.isArray(fieldPlan.shareOrg) ? fieldPlan.shareOrg.join(', ') : fieldPlan.shareOrg) :
  'None specified'
}</p>
<p><strong>Program Dates:</strong> ${fieldPlan.programDates || 'Not specified'}</p>
<p><strong>Program Activity Types:</strong> ${
  fieldPlan.programTypes ?
  (Array.isArray(fieldPlan.programTypes) ? fieldPlan.programTypes.join(', ') : fieldPlan.programTypes) :
  'None specified'
}</p>
```

**C. Add new "Field Tactics & Capacity" section:**
```javascript
<h3>Field Tactics & Capacity</h3>
<p><strong>Can Teach These Tactics:</strong> ${
  fieldPlan.teachComfortable ?
  (Array.isArray(fieldPlan.teachComfortable) ? fieldPlan.teachComfortable.join(', ') : fieldPlan.teachComfortable) :
  'None specified'
}</p>
<p><strong>Field Staff Type:</strong> ${
  fieldPlan.fieldStaff ?
  (Array.isArray(fieldPlan.fieldStaff) ? fieldPlan.fieldStaff.join(', ') : fieldPlan.fieldStaff) :
  'Not specified'
}</p>
<p><strong>Field Staff Notes:</strong> ${fieldPlan.fieldStaffNotes || 'None provided'}</p>
<p><strong>Running for Office:</strong> ${fieldPlan.runningForOffice || 'Not specified'}</p>
```

**D. Add new "Geographic Targeting" section:**
```javascript
<h3>Geographic Targeting</h3>
<p><strong>Counties:</strong> ${/* existing code */}</p>
<p><strong>Cities:</strong> ${
  fieldPlan.cities ?
  (Array.isArray(fieldPlan.cities) ? fieldPlan.cities.join(', ') : fieldPlan.cities) :
  'None specified'
}</p>
<p><strong>Special Geographic Areas:</strong> ${
  fieldPlan.specialGeo ?
  (Array.isArray(fieldPlan.specialGeo) ? fieldPlan.specialGeo.join(', ') : fieldPlan.specialGeo) :
  'None specified'
}</p>
<p><strong>Knows Specific Precincts:</strong> ${fieldPlan.knowsPrecincts || 'Not specified'}</p>
<p><strong>Precincts:</strong> ${/* existing code */}</p>
<p><strong>Willing to Work Different Precincts:</strong> ${fieldPlan.diffPrecincts || 'Not specified'}</p>
```

**E. Enhance "Demographics" section:**
Add after existing demographics:
```javascript
<p><strong>Additional Demographic Notes:</strong> ${fieldPlan.demoNotes || 'None provided'}</p>
<p><strong>Demographic Reach Confidence:</strong> ${fieldPlan.demoConfidence || 'Not specified'}</p>
```

**F. Add new "Confidence Assessment" section:**
Replace the single "Coaching Assessment" with:
```javascript
<h3>Confidence & Coaching Assessment</h3>
<p>${fieldPlan.needsCoaching()}</p>

<h4>Detailed Confidence Scores</h4>
<ul>
  <li><strong>Meets Reasonable/Realistic Expectations:</strong> ${fieldPlan.confidenceReasonable || 'Not provided'}/10</li>
  <li><strong>Data & Technology Usage:</strong> ${fieldPlan.confidenceData || 'Not provided'}/10</li>
  <li><strong>Field Plan Quality:</strong> ${fieldPlan.confidencePlan || 'Not provided'}/10</li>
  <li><strong>Staff/Volunteer Capacity:</strong> ${fieldPlan.confidenceCapacity || 'Not provided'}/10</li>
  <li><strong>Field Tactic Skills:</strong> ${fieldPlan.confidenceSkills || 'Not provided'}/10</li>
  <li><strong>Meeting Goals:</strong> ${fieldPlan.confidenceGoals || 'Not provided'}/10</li>
</ul>
```

**G. Add "Submission Metadata" footer:**
```javascript
<hr>
<p style="font-size: 0.9em; color: #666;">
  <strong>Submission URL:</strong> ${fieldPlan.submissionUrl || 'Not available'}<br>
  <strong>Submission ID:</strong> ${fieldPlan.submissionId || 'Not available'}
</p>
```

**Priority:** HIGH (emails will be incomplete without these)

---

### 2.2 Update buildFieldTargetsTable() and createFieldTargetsRow()

**Location:** `src/field_trigger_functions.js`, Lines ~194 & ~500

#### Current Table Columns:
1. Organization
2. Counties
3. Demographics
4. Precincts

#### Recommended Enhancements:

**Option A: Add New Columns**
```javascript
function buildFieldTargetsTable(fieldPlans) {
  let html = `
    <h2>Field Wide Targets</h2>
    <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
      <thead>
        <tr style="background-color: #f0f0f0;">
          <th>Organization</th>
          <th>Counties</th>
          <th>Cities</th>  <!-- NEW -->
          <th>Special Areas</th>  <!-- NEW -->
          <th>Demographics</th>
          <th>Precincts</th>
          <th>Running for Office</th>  <!-- NEW -->
          <th>Can Teach</th>  <!-- NEW -->
        </tr>
      </thead>
      <!-- ... -->
```

**Option B: Keep Existing Columns, Add Tooltips**
Keep table simple but add hover tooltips with additional info

**Priority:** MEDIUM (nice to have, not critical)

---

### 2.3 Update formatDemographics() function

**Location:** `src/field_trigger_functions.js`, Line ~647

#### Current Code:
- Formats: demoRace, demoAge, demoGender
- **BUG:** Doesn't include demoAffinity (exists in 2025 but not formatted!)

#### Required Changes:
```javascript
function formatDemographics(fieldPlan) {
  const parts = [];

  // Existing: Race, Age, Gender
  if (fieldPlan.demoRace && fieldPlan.demoRace.length > 0) {
    const race = Array.isArray(fieldPlan.demoRace)
      ? fieldPlan.demoRace.toString().replace(/\n/g, ', ')
      : fieldPlan.demoRace.toString().replace(/\n/g, ', ');
    parts.push(`Race: ${race}`);
  }

  if (fieldPlan.demoAge && fieldPlan.demoAge.length > 0) {
    const age = Array.isArray(fieldPlan.demoAge)
      ? fieldPlan.demoAge.toString().replace(/\n/g, ', ')
      : fieldPlan.demoAge.toString().replace(/\n/g, ', ');
    parts.push(`Age: ${age}`);
  }

  if (fieldPlan.demoGender && fieldPlan.demoGender.length > 0) {
    const gender = Array.isArray(fieldPlan.demoGender)
      ? fieldPlan.demoGender.toString().replace(/\n/g, ', ')
      : fieldPlan.demoGender.toString().replace(/\n/g, ', ');
    parts.push(`Gender: ${gender}`);
  }

  // ADD: Affinity (already exists but missing!)
  if (fieldPlan.demoAffinity && fieldPlan.demoAffinity.length > 0) {
    const affinity = Array.isArray(fieldPlan.demoAffinity)
      ? fieldPlan.demoAffinity.toString().replace(/\n/g, ', ')
      : fieldPlan.demoAffinity.toString().replace(/\n/g, ', ');
    parts.push(`Affinity: ${affinity}`);
  }

  // NEW 2026: Add notes if provided
  if (fieldPlan.demoNotes) {
    parts.push(`<em>Notes: ${fieldPlan.demoNotes}</em>`);
  }

  return parts.length > 0 ? parts.join('<br>') : 'None specified';
}
```

**Priority:** MEDIUM (bug fix + enhancement)

---

## Phase 3: Configuration & Property Updates

### 3.1 Update Script Properties

**Location:** Set via Google Apps Script project settings or in code defaults

#### Properties to Update:

| Property Name | Old Default | New Default | Where Used |
|---------------|-------------|-------------|------------|
| `SHEET_FIELD_PLAN` | '2025_field_plan' | '2026_field_plan' | All field plan functions |
| `SHEET_FIELD_BUDGET` | '2025_field_budget' | '2026_field_budget' | Budget matching functions |

**Methods to Update:**
1. `getLastRow()` - Line ~439
2. `checkForNewRows()` - Line ~446
3. `sendFieldPlanTargetsSummary()` - Line ~561
4. `processAllFieldPlans()` - Line ~598
5. `findMatchingBudget()` - Line ~529

**Search Pattern:** Find all instances of `'2025_field_plan'` and `'2025_field_budget'`

**Priority:** CRITICAL (will read wrong sheet otherwise)

---

### 3.2 Update Test Functions Sheet References

**Location:** `src/test_functions.js`

#### Functions to Update:

1. **testMostRecentFieldPlan()** - Line ~10
   - Line 53: `'2025_field_plan'` → `'2026_field_plan'`

2. **testTacticOrganizationNames()** - Line ~332
   - Line 336: `'2025_field_plan'` → `'2026_field_plan'`

3. **testFindMatchingBudget()** - Line ~206
   - Line 207: `'2025_field_budget'` → `'2026_field_budget'`

**Priority:** MEDIUM (testing will fail but won't affect production)

---

## Phase 4: Enhanced Features (OPTIONAL - Value-Add Improvements)

### 4.1 Add New Analysis Functions

#### A. Training Completion Analysis
```javascript
function analyzeTrainingCompletion(fieldPlans) {
  const attended = fieldPlans.filter(fp => fp.attendedTraining === 'Yes').length;
  const total = fieldPlans.length;
  const percentage = ((attended / total) * 100).toFixed(1);

  return {
    attended,
    total,
    percentage,
    needsFollowup: fieldPlans.filter(fp => fp.attendedTraining !== 'Yes')
  };
}
```

#### B. Capacity Sharing Analysis
```javascript
function analyzeTeachingCapacity(fieldPlans) {
  const tacticsMap = {};

  fieldPlans.forEach(fp => {
    if (fp.teachComfortable && Array.isArray(fp.teachComfortable)) {
      fp.teachComfortable.forEach(tactic => {
        if (!tacticsMap[tactic]) {
          tacticsMap[tactic] = [];
        }
        tacticsMap[tactic].push(fp.memberOrgName);
      });
    }
  });

  return tacticsMap; // { 'Phone Banking': ['Org A', 'Org B'], ... }
}
```

#### C. Electoral Coordination Flag
```javascript
function identifyElectoralConflicts(fieldPlans) {
  return fieldPlans.filter(fp =>
    fp.runningForOffice &&
    fp.runningForOffice.toLowerCase().includes('yes')
  ).map(fp => ({
    org: fp.memberOrgName,
    counties: fp.fieldCounties,
    contact: fp.contactEmail
  }));
}
```

**Priority:** LOW (nice to have future enhancements)

---

### 4.2 Create New Summary Emails

#### A. Training Attendance Summary
Send weekly email showing:
- Who attended training
- Who needs follow-up
- Training completion rate

#### B. Teaching Capacity Matrix
Send email showing which orgs can teach which tactics for peer-to-peer training coordination

#### C. Electoral Coordination Alert
Automatically flag and notify about organizations with staff running for office to avoid coordination issues

**Priority:** LOW (future enhancements)

---

## Phase 5: Testing Strategy

### 5.1 Unit Tests to Create/Update

**File:** `src/test_functions.js`

#### New Test Functions Needed:

1. **testNewFieldGetters()**
   - Test all 21 new getter methods
   - Verify they return correct data types
   - Check array fields normalize correctly

2. **testNeedsCoachingNew2026()**
   - Test updated needsCoaching() method
   - Verify it works with 6 confidence scores
   - Test edge cases (missing scores, zeros)

3. **testProgramColumnIndices()**
   - Verify PROGRAM_COLUMNS point to correct data
   - Test with real 2026 CSV data
   - Ensure tactics calculate correctly

4. **test2026EmailGeneration()**
   - Generate test email with all new fields
   - Verify HTML renders correctly
   - Check for missing or undefined values

5. **test2026TargetsSummary()**
   - Test field targets summary with new fields
   - Verify table formatting
   - Check cities and special geo areas display

**Priority:** HIGH (catch issues before production)

---

### 5.2 Integration Testing Checklist

- [ ] Load 2026 CSV into Google Sheet
- [ ] Test `FieldPlan.fromLastRow()` with 2026 data
- [ ] Verify all getters return correct values
- [ ] Test each tactic class constructor
- [ ] Generate test email for one submission
- [ ] Test field targets summary email
- [ ] Verify trigger functions work with 2026 sheet
- [ ] Test needsCoaching() with various confidence scores
- [ ] Validate PROGRAM_COLUMNS indices with real data
- [ ] Test budget matching (if applicable)

---

## Phase 6: Documentation Updates

### 6.1 Update README Files

If README exists:
- Update year references (2025 → 2026)
- Document new fields
- Update example outputs
- Add migration notes

### 6.2 Update Code Comments

Search for comments referencing:
- "2025" → update to "2026"
- Column numbers → verify they're still accurate
- Field descriptions → add new 2026 fields

**Priority:** LOW (nice to have)

---

## Implementation Order (Recommended)

### Week 1: Critical Core Updates
1. ✅ Update FieldPlan.COLUMNS constant
2. ✅ Update PROGRAM_COLUMNS constant
3. ✅ Add all 21 new properties to constructor
4. ✅ Add all 21 new getter methods
5. ✅ Add 6 new helper methods
6. ✅ Update needsCoaching() method
7. ✅ Update all sheet name references

### Week 2: Email & Testing
1. ✅ Update sendFieldPlanEmail() with all new sections
2. ✅ Update formatDemographics()
3. ✅ Create unit tests for new fields
4. ✅ Test with real 2026 CSV data
5. ✅ Fix any bugs found in testing

### Week 3: Enhancements & Polish
1. ⏳ Update field targets table
2. ⏳ Add new analysis functions (optional)
3. ⏳ Create new summary emails (optional)
4. ⏳ Update documentation
5. ⏳ Deploy to production

---

## Risk Assessment

### HIGH RISK - System Won't Work:
- ❌ Column mappings not updated
- ❌ PROGRAM_COLUMNS not updated
- ❌ Sheet names still reference 2025
- **Impact:** Complete system failure, wrong data read

### MEDIUM RISK - Incomplete Functionality:
- ⚠️ New fields not in emails
- ⚠️ needsCoaching() not updated
- ⚠️ Missing getters
- **Impact:** System works but provides incomplete information

### LOW RISK - Missing Enhancements:
- ℹ️ Field targets table not enhanced
- ℹ️ New analysis functions not added
- ℹ️ Documentation not updated
- **Impact:** System works fully, missing potential value-adds

---

## Quick Reference: Files to Modify

### MUST MODIFY (Critical):
1. ✅ `src/field_plan_parent_class.js` - Update columns, add properties/getters
2. ✅ `src/field_program_extension_class.js` - Update PROGRAM_COLUMNS
3. ✅ `src/field_trigger_functions.js` - Update emails, sheet names
4. ✅ `src/test_functions.js` - Update sheet name references

### SHOULD MODIFY (Important):
5. ⏳ `src/field_trigger_functions.js` - Enhance field targets table
6. ⏳ `src/test_functions.js` - Add new test functions

### COULD MODIFY (Nice to Have):
7. ⏳ `src/field_trigger_functions.js` - Add new analysis functions
8. ⏳ Documentation files - Update for 2026

---

## Validation Checklist

Before deploying to production, verify:

- [ ] All column constants updated to 2026 indices
- [ ] All 21 new properties added to constructor
- [ ] All 21 new getters implemented
- [ ] All 6 new helper methods added
- [ ] needsCoaching() method rewritten
- [ ] All sheet name references updated to 2026
- [ ] Email templates include all new fields
- [ ] Test functions pass with 2026 data
- [ ] getTacticInstances() works with updated columns
- [ ] Field targets summary includes relevant new fields
- [ ] Script properties updated to 2026
- [ ] Documentation reflects 2026 changes

---

## Common Pitfalls to Avoid

1. **Forgetting the +1 shift:** Column 1 is new (attended training), shifting everything
2. **Forgetting the +11 shift:** Program columns shifted by 11 due to new questions
3. **Not using normalizeField():** New array fields need normalization
4. **Hardcoded sheet names:** Use script properties or update all references
5. **Testing with old data:** Must test with actual 2026 CSV structure
6. **Forgetting getters:** Properties useless without getters
7. **Not updating needsCoaching():** Will crash trying to access removed field

---

## Support Resources

- **Column Mapping Guide:** `docs/column_mapping_guide.md` - Complete column index reference
- **2026 CSV:** `2026 Alabama Forward Field Planning Form - 2026_field_plan.csv`
- **2025 Code:** `../2025_analyzer/` - Reference for working implementation

---

**Last Updated:** 2025-12-26
**Status:** 🚧 Updates REQUIRED before 2026 production use
**Estimated Effort:** 8-12 hours for core updates, 4-8 hours for enhancements
