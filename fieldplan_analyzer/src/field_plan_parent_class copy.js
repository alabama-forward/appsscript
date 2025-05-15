class FieldBudget {

    // Get most recent entry (last row)
    static fromLastRow() {
      const sheet = SpreadsheetApp.getActiveSheet().getSheetByName('2025_field_budget');
      const data = sheet.getDataRange().getValues();
      const lastRowIndex = data.length - 1;
      const rowData = data[lastRowIndex];
      return new FieldBudget(rowData);
    }
  
    // Get first entry after header (row 2)
    static fromFirstRow() {
      const sheet = SpreadsheetApp.getActiveSheet().getSheetByName('2025_field_budget');
      const data = sheet.getDataRange().getValues();
      // Index 1 is the first row after header
      const rowData = data[1];
      return new FieldBudget(rowData);
    }
  
    // Get entry from specific row number (1-based for user friendliness)
    static fromSpecificRow(rowNumber) {
      const sheet = SpreadsheetApp.getActiveSheet().getSheetByName('2025_field_budget');
      const data = sheet.getDataRange().getValues();
      // Convert from 1-based to 0-based index
      const rowIndex = rowNumber - 1;
      
      // Check if row number is valid
      if (rowIndex < 1 || rowIndex >= data.length) {
        throw new Error(`Invalid row number. Please choose a row between 2 and ${data.length}`);
      }
      
      const rowData = data[rowIndex];
      return new FieldBudget(rowData);
    }
  
    constructor(rowData) {
      Logger.log('Budget Constructor rowData:');
      Logger.log(rowData);
  
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
      

      this._memberOrgName = rowData[FieldPlan.COLUMNS.MEMBERNAME];
      this._firstName = rowData[FieldPlan.COLUMNS.FIRSTNAME];
      this._lastName = rowData[FieldPlan.COLUMNS.LASTNAME];
      this._contactEmail = rowData[FieldPlan.COLUMNS.CONTACTEMAIL];
      this._contactPhone = rowData[FieldPlan.COLUMNS.CONTACTPHONE];
      this._dataStorage = normalizeField(rowData[FieldPlan.COLUMNS.DATASTORAGE]);
      this._vanCommittee = rowData[FieldPlan.COLUMNS.VANCOMMITTEE];
      this._programTools = normalizeField(rowData[FieldPlan.COLUMNS.PROGRAMTOOLS]);
      this._fieldTactics = rowData[FieldPlan.COLUMNS.FIELDTACTICS];
      this._fieldCounties = normalizeField(rowData[FieldPlan.COLUMNS.FIELDCOUNTIES]);
      this._demoRace = normalizeField(rowData[FieldPlan.COLUMNS.DEMORACE]);
      this._demoAge = normalizeField(rowData[FieldPlan.COLUMNS.DEMOAGE]);
      this._demoGender = normalizeField(rowData[FieldPlan.COLUMNS.DEMOGENDER]);
      this._demoAffinity = normalizeField(rowData[FieldPlan.COLUMNS.DEMOAFFINITY]);
      this._fieldPlanConfidence = rowData[FieldPlan.COLUMNS.PLANCONFIDENCE];
      this._implementationAffect = rowData[FieldPlan.COLUMNS.IMPLEMENTATION];
      this._coachingNeed = rowData[FieldPlan.COLUMNS.NEEDCOACHING];
      this._experienceUsingForm = rowData[FieldPlan.COLUMNS.FPEXPERIENCE];
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
    get demoRace() { return this._demoRace || null; }
    get demoAge() { return this._demoAge || null; }
    get demoGender() { return this._demoGender || null; }
    get demoAffinity() { return this._demoAffinity || null; }
    get fieldPlanConfidence() { return this._fieldPlanConfidence || null; }
    get implementationAffect() { return this._implementationAffect || null; }
    get coachingNeed() { return this._coachingNeed || null; }
    get experienceUsingForm() { return this._experienceUsingForm || null;}
  
    // Helper functions for checking if arrays have items
  
    hasDataStorage(item) { return this._dataStorage.includes(item); }
    hasProgramTool(tool) { return this._programTools.includes(tool); }
    hasFieldTactic(tactic) { return this._programTools.includes(tactic); }
    hasFieldCounties(county) { return this._fieldCounties.includes(county); }
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
      
      if (this._coachingNeed <= 5) {
        message = `${this._memberOrgName} had a confidence score of ${this._coachingNeed}.
        Reach out to them to confirm what coaching they will need.`;
      } else if (this._coachingNeed >= 6 && this._coachingNeed <= 8) {
        message = `${this._memberOrgName} had a confidence score of ${this._coachingNeed}.
        Reach out to them to ask if they would like some coaching on their field plan.`;
      } else {
        message = `${this._memberOrgName} had a confidence score of ${this._coachingNeed}.
        They did not request coaching on their field plan.`;
      }
      Logger.log(message);
      return message;
    };
  };
  
  FieldPlan.COLUMNS = {
    // All caps bcause they are constants
    MEMBERNAME: 1,
    FIRSTNAME: 2,
    LASTNAME: 3,
    CONTACTEMAIL: 4,
    CONTACTPHONE: 5,
    DATASTORAGE: 6,
    DATASTIPEND: 7, // Add getter
    DATAPLAN: 8, //Add getter
    VANCOMMITTEE: 9, //Add getter?? Minimum add to email
    DATASHARE: 10, //Add getter
    SHAREORG: 11, //Add getter
    PROGRAMTOOLS: 12,
    PROGRAMDATES: 13, //Add getter
    PROGRAMTYPES: 14, //Add getter
    FIELDTACTICS: 15,
    FIELDSTAFF: 16, //Add getter
    FIELDCOUNTIES: 17,
    PRECINCTS: 19, //Add getter
    DIFFPRECINCTS: 20, //Add getter
    DEMORACE: 21,
    DEMOAGE: 22,
    DEMOGENDER: 23,
    DEMOAFFINITY: 24,
    PLANCONFIDENCE: 54,
    IMPLEMENTATION: 55,
    NEEDCOACHING: 56,
    FPEXPERIENCE: 57
  };