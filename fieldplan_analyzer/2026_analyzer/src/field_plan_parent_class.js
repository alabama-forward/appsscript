// Main Field Plan Class //
class FieldPlan {

    // Get most recent entry (last row)
    static fromLastRow() {
      const sheetName = PropertiesService.getScriptProperties().getProperty('SHEET_FIELD_PLAN') || '2025_field_plan';
      const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
      const data = sheet.getDataRange().getValues();
      const lastRowIndex = data.length - 1;
      const rowData = data[lastRowIndex];
      return new FieldPlan(rowData);
    }
  
    // Get first entry after header (row 2)
    static fromFirstRow() {
      const sheetName = PropertiesService.getScriptProperties().getProperty('SHEET_FIELD_PLAN') || '2025_field_plan';
      const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
      const data = sheet.getDataRange().getValues();
      // Index 1 is the first row after header
      const rowData = data[1];
      return new FieldPlan(rowData);
    }
  
    // Get entry from specific row number (1-based for user friendliness)
    static fromSpecificRow(rowNumber) {
      const sheetName = PropertiesService.getScriptProperties().getProperty('SHEET_FIELD_PLAN') || '2025_field_plan';
      const sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
      const data = sheet.getDataRange().getValues();
      // Convert from 1-based to 0-based index
      const rowIndex = rowNumber - 1;
      
      // Check if row number is valid
      if (rowIndex < 1 || rowIndex >= data.length) {
        throw new Error(`Invalid row number. Please choose a row between 2 and ${data.length}`);
      }
      
      const rowData = data[rowIndex];
      return new FieldPlan(rowData);
    }
  
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
      
      //Meta
      this._submissionDateTime = rowData[FIELD_PLAN_COLUMNS.SUBMISSIONDATETIME];
      this._submissionUrl = rowData[FIELD_PLAN_COLUMNS.SUBMISSIONURL];
      this._submissionId = rowData[FIELD_PLAN_COLUMNS.SUBMISSIONURL];

      //Training
      this._attendedTraining = rowData[FIELD_PLAN_COLUMNS.ATTENDEDTRAINING];

      //Contact
      this._memberOrgName = rowData[FIELD_PLAN_COLUMNS.MEMBERNAME];
      this._firstName = rowData[FIELD_PLAN_COLUMNS.FIRSTNAME];
      this._lastName = rowData[FIELD_PLAN_COLUMNS.LASTNAME];
      this._contactEmail = rowData[FIELD_PLAN_COLUMNS.CONTACTEMAIL];
      this._contactPhone = rowData[FIELD_PLAN_COLUMNS.CONTACTPHONE];

      //Data & Tools
      this._dataStorage = normalizeField(rowData[FIELD_PLAN_COLUMNS.DATASTORAGE]);
      this._dataStipend = rowData[FIELD_PLAN_COLUMNS.DATASTIPEND];
      this._dataPlan = normalizeField(rowData[FIELD_PLAN_COLUMNS.DATAPLAN]);
      this._vanCommittee = normalizeField(rowData[FIELD_PLAN_COLUMNS.VANCOMMITTEE]);
      this._dataShare = rowData[FIELD_PLAN_COLUMNS.DATASHARE];
      this._shareOrg = normalizeField(rowData[FIELD_PLAN_COLUMNS.SHAREORG]);
      this._programTools = normalizeField(rowData[FIELD_PLAN_COLUMNS.PROGRAMTOOLS]);
      this._programDates = rowData[FIELD_PLAN_COLUMNS.PROGRAMDATES];
      this._programTypes = normalizeField(rowData[FIELD_PLAN_COLUMNS.PROGRAMTYPES]);

      //Tactics & Locations
      this._fieldTactics = normalizeField(rowData[FIELD_PLAN_COLUMNS.FIELDTACTICS]);
      this._teachComfortable = normalizeField(rowData[FIELD_PLAN_COLUMNS.TEACHCOMFORTABLE]);
      this._fieldStaff = normalizeField(rowData[FIELD_PLAN_COLUMNS.FIELDSTAFF]);
      this._fieldNarrative = rowData[FIELD_PLAN_COLUMNS.FIELDNARRATIVE];
      this._reviewedPlan = rowData[FIELD_PLAN_COLUMNS.REVIEWEDPLAN];
      this._runningForOffice = rowData[FIELD_PLAN_COLUMNS.RUNNINGFOROFFICE];
      this._fieldCounties = normalizeField(rowData[FIELD_PLAN_COLUMNS.FIELDCOUNTIES]);
      this._cities = normalizeField(rowData[FIELD_PLAN_COLUMNS.CITIES]);
      this._knowsPrecincts = rowData[FIELD_PLAN_COLUMNS.KNOWSPRECINCTS];
      this._fieldPrecincts = normalizeField(rowData[FIELD_PLAN_COLUMNS.PRECINCTS]);
      this._diffPrecincts = rowData[FIELD_PLAN_COLUMNS.DIFFPRECINCTS];
      this._specialGeo = normalizeField(rowData[FIELD_PLAN_COLUMNS.SPECIALGEO]);

      //Demographics
      this._demoRace = normalizeField(rowData[FIELD_PLAN_COLUMNS.DEMORACE]);
      this._demoAge = normalizeField(rowData[FIELD_PLAN_COLUMNS.DEMOAGE]);
      this._demoGender = normalizeField(rowData[FIELD_PLAN_COLUMNS.DEMOGENDER]);
      this._demoAffinity = normalizeField(rowData[FIELD_PLAN_COLUMNS.DEMOAFFINITY]);
      this._demoNotes = rowData[FIELD_PLAN_COLUMNS.DEMONOTES];
      this._demoConfidence = rowData[FIELD_PLAN_COLUMNS.DEMOCONFIDENCE];

      //Acknowledgements
      this._understandsReasonable = rowData[FIELD_PLAN_COLUMNS.UNDERSTANDSREASONABLE];
      this._understandsDisbursement = rowData[FIELD_PLAN_COLUMNS.UNDERSTANDSDISBURSEMENT];
      this._understandsTraining = rowData[FIELD_PLAN_COLUMNS.UNDERSTANDSTRAINING];

      //Confidence & Experience
      this._confidenceReasonable = rowData[FIELD_PLAN_COLUMNS.CONFIDENCEREASONABLE];
      this._confidenceData = rowData[FIELD_PLAN_COLUMNS.CONFIDENCEDATA];
      this._confidencePlan = rowData[FIELD_PLAN_COLUMNS.CONFIDENCEPLAN];
      this._confidenceCapacity = rowData[FIELD_PLAN_COLUMNS.CONFIDENCECAPACITY];
      this._confidenceSkills = rowData[FIELD_PLAN_COLUMNS.CONFIDENCESKILLS];
      this._confidenceGoals = rowData[FIELD_PLAN_COLUMNS.CONFIDENCEGOALS];
    }

    //Getters
    get memberOrgName() { return this._memberOrgName || null; }
    get firstName() { return this._firstName || null; }
    get lastName() { return this._lastName || null; }
    get contactEmail() { return this._contactEmail || null; }
    get contactPhone() { return this._contactPhone || null; }
    get dataStorage() { return this._dataStorage || null; }
    get vanCommittee() { return this._vanCommittee || null; }
    get programTools() { return this._programTools || null; }
    get fieldTactics() { return this._fieldTactics || null; }
    get fieldCounties() { return this._fieldCounties || null; }
    get fieldPrecincts() { return this._fieldPrecincts || null;}
    get demoRace() { return this._demoRace || null; }
    get demoAge() { return this._demoAge || null; }
    get demoGender() { return this._demoGender || null; }
    get demoAffinity() { return this._demoAffinity || null; }
    get fieldPlanConfidence() { return this._fieldPlanConfidence || null; }
    get implementationAffect() { return this._implementationAffect || null; }
    get coachingNeed() { return this._coachingNeed || null; }
    get experienceUsingForm() { return this._experienceUsingForm || null;}
    get submissionDateTime() { return this._submissionDateTime || null; }
  
    // Helper functions for checking if arrays have items
  
    hasDataStorage(item) { return this._dataStorage.includes(item); }
    hasProgramTool(tool) { return this._programTools.includes(tool); }
    hasFieldTactic(tactic) { return this._programTools.includes(tactic); }
    hasFieldCounties(county) { return this._fieldCounties.includes(county); }
    hasFieldPrecincts(precinct) { return this._fieldPrecincts.includes(precinct); }
    hasDemoRace(race) { return this._demoRace.includes(race); }
    hasDemoGender(gender) { return this._demoGender.includes(gender); }
    hasDemoAffinity(affinity) { return this._demoAffinity.includes(affinity); }
  
    // Other Helper functions 
    countItems(fieldName) {
      const field = this[`_${fieldName}`];
      return Array.isArray(field) ? field.length : 0;
    };
  
    hasMultipleItems(fieldName) {
      const field = this[`_${fieldName}`];
      // Now we pass fieldName to countItems
      if (this.countItems(fieldName) > 0) {
          // Log each item and include the field name for clarity
          console.log(`Items in ${fieldName}:`);
          field.forEach((item) => console.log(item));
          return true;  // Return true to indicate items were found
      } else {
          return `No items in ${fieldName}`;
      }
    };
  
    // Add methods to get first/primary value if needed
    getPrimaryDataStorage() {
      return this._dataStorage[0] || null;
    };
  
    // Add methods to check if field has multiple values
    hasMultipleDataStorage() {
      return this._dataStorage.length > 1;
    };
  
    needsCoaching() {
      let message = '';
      
      if (this._fieldPlanConfidence <= 5) {
        message = `${this._memberOrgName} had a confidence score of ${this._fieldPlanConfidence}.
        Reach out to them to confirm what coaching they will need.`;
      } else if (this._fieldPlanConfidence >= 6 && this._fieldPlanConfidence <= 8) {
        message = `${this._memberOrgName} had a confidence score of ${this._fieldPlanConfidence}.
        Reach out to them to ask if they would like some coaching on their field plan.`;
      } else {
        message = `${this._memberOrgName} had a confidence score of ${this._fieldPlanConfidence}.
        They did not request coaching on their field plan.`;
      }
      Logger.log(message);
      return message;
    };
  };
  
