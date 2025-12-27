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

## Side-by-Side Comparison: 2025 vs 2026

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
| **FIELDSTAFFNOTES** | ❌ N/A | **19** | 🆕 **NEW** | Use this space to answer the questions above |
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

### 1. Update FieldPlan.COLUMNS in field_plan_parent_class.js

Replace the existing `FieldPlan.COLUMNS` constant (starting at line 168) with:

```javascript
FieldPlan.COLUMNS = {
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
  FIELDSTAFFNOTES: 19,       // NEW
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

### 2. Update PROGRAM_COLUMNS in field_program_extension_class.js

Replace the existing `PROGRAM_COLUMNS` constant (starting at line 1) with:

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
  Logger.log(rowData[FieldPlan.COLUMNS.FIELDTACTICS]);

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
  this._submissionDateTime = rowData[FieldPlan.COLUMNS.SUBMISSIONDATETIME];

  // NEW: Training
  this._attendedTraining = rowData[FieldPlan.COLUMNS.ATTENDEDTRAINING];

  // Contact
  this._memberOrgName = rowData[FieldPlan.COLUMNS.MEMBERNAME];
  this._firstName = rowData[FieldPlan.COLUMNS.FIRSTNAME];
  this._lastName = rowData[FieldPlan.COLUMNS.LASTNAME];
  this._contactEmail = rowData[FieldPlan.COLUMNS.CONTACTEMAIL];
  this._contactPhone = rowData[FieldPlan.COLUMNS.CONTACTPHONE];

  // Data & Tools
  this._dataStorage = normalizeField(rowData[FieldPlan.COLUMNS.DATASTORAGE]);
  this._dataStipend = rowData[FieldPlan.COLUMNS.DATASTIPEND];
  this._dataPlan = rowData[FieldPlan.COLUMNS.DATAPLAN];
  this._vanCommittee = normalizeField(rowData[FieldPlan.COLUMNS.VANCOMMITTEE]);
  this._dataShare = rowData[FieldPlan.COLUMNS.DATASHARE];
  this._shareOrg = normalizeField(rowData[FieldPlan.COLUMNS.SHAREORG]);
  this._programTools = normalizeField(rowData[FieldPlan.COLUMNS.PROGRAMTOOLS]);
  this._programDates = rowData[FieldPlan.COLUMNS.PROGRAMDATES];
  this._programTypes = normalizeField(rowData[FieldPlan.COLUMNS.PROGRAMTYPES]);

  // Tactics & Locations
  this._fieldTactics = normalizeField(rowData[FieldPlan.COLUMNS.FIELDTACTICS]);
  this._teachComfortable = normalizeField(rowData[FieldPlan.COLUMNS.TEACHCOMFORTABLE]);  // NEW
  this._fieldStaff = normalizeField(rowData[FieldPlan.COLUMNS.FIELDSTAFF]);
  this._fieldStaffNotes = rowData[FieldPlan.COLUMNS.FIELDSTAFFNOTES];  // NEW
  this._reviewedPlan = rowData[FieldPlan.COLUMNS.REVIEWEDPLAN];  // NEW
  this._runningForOffice = rowData[FieldPlan.COLUMNS.RUNNINGFOROFFICE];  // NEW
  this._fieldCounties = normalizeField(rowData[FieldPlan.COLUMNS.FIELDCOUNTIES]);
  this._cities = normalizeField(rowData[FieldPlan.COLUMNS.CITIES]);  // NEW
  this._knowsPrecincts = rowData[FieldPlan.COLUMNS.KNOWSPRECINCTS];  // NEW
  this._fieldPrecincts = normalizeField(rowData[FieldPlan.COLUMNS.PRECINCTS]);
  this._diffPrecincts = rowData[FieldPlan.COLUMNS.DIFFPRECINCTS];
  this._specialGeo = normalizeField(rowData[FieldPlan.COLUMNS.SPECIALGEO]);  // NEW

  // Demographics
  this._demoRace = normalizeField(rowData[FieldPlan.COLUMNS.DEMORACE]);
  this._demoAge = normalizeField(rowData[FieldPlan.COLUMNS.DEMOAGE]);
  this._demoGender = normalizeField(rowData[FieldPlan.COLUMNS.DEMOGENDER]);
  this._demoAffinity = normalizeField(rowData[FieldPlan.COLUMNS.DEMOAFFINITY]);
  this._demoNotes = rowData[FieldPlan.COLUMNS.DEMONOTES];  // NEW
  this._demoConfidence = rowData[FieldPlan.COLUMNS.DEMOCONFIDENCE];  // NEW

  // Understanding Acknowledgments (NEW)
  this._understandsReasonable = rowData[FieldPlan.COLUMNS.UNDERSTANDSREASONABLE];
  this._understandsDisbursement = rowData[FieldPlan.COLUMNS.UNDERSTANDSDISBURSEMENT];
  this._understandsTraining = rowData[FieldPlan.COLUMNS.UNDERSTANDSTRAINING];

  // Confidence & Self-Assessment (NEW section - replaces old confidence fields)
  this._confidenceReasonable = rowData[FieldPlan.COLUMNS.CONFIDENCEREASONABLE];
  this._confidenceData = rowData[FieldPlan.COLUMNS.CONFIDENCEDATA];
  this._confidencePlan = rowData[FieldPlan.COLUMNS.CONFIDENCEPLAN];
  this._confidenceCapacity = rowData[FieldPlan.COLUMNS.CONFIDENCECAPACITY];
  this._confidenceSkills = rowData[FieldPlan.COLUMNS.CONFIDENCESKILLS];
  this._confidenceGoals = rowData[FieldPlan.COLUMNS.CONFIDENCEGOALS];

  // Submission Metadata (NEW)
  this._submissionUrl = rowData[FieldPlan.COLUMNS.SUBMISSIONURL];
  this._submissionId = rowData[FieldPlan.COLUMNS.SUBMISSIONID];
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
get fieldStaffNotes() { return this._fieldStaffNotes || null; }   // NEW
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
- `fieldStaffNotes` (column 19)
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
this._fieldStaffNotes
```

### Getter Names (camelCase, no prefix)
```javascript
get attendedTraining()
get teachComfortable()
get fieldStaffNotes()
```

### Helper Method Names (for arrays)
```javascript
hasTeachComfortable(tactic)
hasCity(city)
hasSpecialGeo(area)
```

---

**Last Updated:** 2025-12-24
**For:** 2026 Alabama Forward Field Planning Form
**Status:** 🚨 Code updates REQUIRED for 2026 compatibility
