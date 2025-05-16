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
        // Not sure I need this in this class
        // If string with commas, split into array
        // if (typeof value === 'string' && value.includes(',')) {
        //   return value.split(',').map(item => item.trim());
        // }
        // Single value - return as single-item array
        // return [value];
      };


      //Contact
      this._firstName = rowData[FieldBudget.COLUMNS.FIRSTNAME];
      this._lastName = rowData[FieldBudget.COLUMNS.LASTNAME];
      this._contactEmail = rowData[FieldBudget.COLUMNS.CONTACTEMAIL];
      this._contactPhone = rowData[FieldBudget.COLUMNS.CONTACTPHONE];
      this._memberOrgName = rowData[FieldBudget.COLUMNS.MEMBERNAME];
      //Admin
      this._adminRequested = rowData[FieldBudget.COLUMNS.ADMINREQUESTED];
      this._adminTotal = rowData[FieldBudget.COLUMNS.ADMINTOTAL];
      this._adminGap = rowData[FieldBudget.COLUMNS.ADMINGAP];
      //Data
      this._dataRequested = rowData[FieldBudget.COLUMNS.DATAREQUESTED];
      this._dataTotal = rowData[FieldBudget.COLUMNS.DATATOTAL];
      this._dataGap = rowData[FieldBudget.COLUMNS.DATAGAP];
      //Travel
      this._travelRequested = rowData[FieldBudget.COLUMNS.TRAVELREQUESTED];
      this._travelTotal = rowData[FieldBudget.COLUMNS.TRAVELTOTAL];
      this._travelGap = rowData[FieldBudget.COLUMNS.TRAVELGAP];
      //Comms
      this._commsRequested = rowData[FieldBudget.COLUMNS.COMMSREQUESTED];
      this._commsTotal = rowData[FieldBudget.COLUMNS.COMMSTOTAL];
      this._commsGap = rowData[FieldBudget.COLUMNS.COMMSGAP];
      //Design
      this._designRequested = rowData[FieldBudget.COLUMNS.DESIGNREQUESTED];
      this._designTotal - rowData[FieldBudget.COLUMNS.DESIGNTOTAL];
      this._designGap = rowData[FieldBudget.COLUMNS.DESIGNGAP];
      //Video
      this._videoRequested = rowData[FieldBudget.COLUMNS.VIDEOREQUESTED];
      this._videoTotal = rowData[FieldBudget.COLUMNS.VIDEOTOTAL];
      this._videoGap = rowData[FieldBudget.COLUMNS.VIDEOGAP];



    VIDEOREQUESTED: 22,
    VIDEOTOTAL: 23,
    VIDEOGAP: 24,
    PRINTREQUESTED: 25,
    PRINTTOTAL: 26,
    PRINTGAP: 27,
    POSTAGEREQUESTED: 28,
    POSTAGETOTAL: 29,
    POSTAGEGAP: 30,
    TRAININGREQUESTED: 31,
    TRAININGTOTAL: 32,
    TRAININGGAP: 33,
    SUPPLIESREQUESTED: 34,
    SUPPLIESTOTAL: 35,
    SUPPLIESGAP: 36,
    CANVASSREQUESTED: 37,
    CANVASSTOTAL: 38,
    CANVASSGAP: 39,
    PHONEREQUESTED: 40,
    PHONETOTAL: 41,
    PHONEGAP: 42,
    TEXTREQUESTED: 43,
    TEXTTOTAL: 44,
    TEXTGAP: 45,
    EVENTREQUESTED: 46,
    EVENTTOTAL: 47,
    EVENTGAP: 48,
    DIGITALREQUESTED: 49,
    DIGITALTOTAL: 50,
    DIGITALGAP: 51,
    REQUESTEDTOTAL: 50,
    PROJECTTOTAL: 51,
    GAPTOTAL: 52,
    SUBMITFIELDPLAN: 53,
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
  
  FieldBudget.COLUMNS = {
    // All caps bcause they are constants
    FIRSTNAME: 2,
    LASTNAME: 3,
    CONTACTEMAIL: 4,
    CONTACTPHONE: 5,
    MEMBERNAME: 6,
    ADMINREQUESTED: 7,
    ADMINTOTAL: 8,
    ADMINGAP: 9,
    DATAREQUESTED: 10,
    DATATOTAL: 11,
    DATAGAP: 12,
    TRAVELREQUESTED: 13,
    TRAVELTOTAL: 14,
    TRAVELGAP: 15,   
    COMMSREQUESTED: 16,
    COMMSTOTAL: 17,
    COMMSGAP: 18,
    DESIGNREQUESTED: 19,
    DESIGNTOTAL: 20,
    DESIGNGAP: 21,
    VIDEOREQUESTED: 22,
    VIDEOTOTAL: 23,
    VIDEOGAP: 24,
    PRINTREQUESTED: 25,
    PRINTTOTAL: 26,
    PRINTGAP: 27,
    POSTAGEREQUESTED: 28,
    POSTAGETOTAL: 29,
    POSTAGEGAP: 30,
    TRAININGREQUESTED: 31,
    TRAININGTOTAL: 32,
    TRAININGGAP: 33,
    SUPPLIESREQUESTED: 34,
    SUPPLIESTOTAL: 35,
    SUPPLIESGAP: 36,
    CANVASSREQUESTED: 37,
    CANVASSTOTAL: 38,
    CANVASSGAP: 39,
    PHONEREQUESTED: 40,
    PHONETOTAL: 41,
    PHONEGAP: 42,
    TEXTREQUESTED: 43,
    TEXTTOTAL: 44,
    TEXTGAP: 45,
    EVENTREQUESTED: 46,
    EVENTTOTAL: 47,
    EVENTGAP: 48,
    DIGITALREQUESTED: 49,
    DIGITALTOTAL: 50,
    DIGITALGAP: 51,
    REQUESTEDTOTAL: 50,
    PROJECTTOTAL: 51,
    GAPTOTAL: 52,
    SUBMITFIELDPLAN: 53,

  };