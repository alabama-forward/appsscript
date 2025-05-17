class FieldBudget {

    // Get most recent entry (last row)
    static fromLastRow() {
      const budgetSheet = SpreadsheetApp.getActive().getSheetByName('2025_field_budget');
      const data = budgetSheet.getDataRange().getValues();
      const lastRowIndex = data.length - 1;
      const rowData = data[lastRowIndex];
      return new FieldBudget(rowData);
    }
  
    // Get first entry after header (row 2)
    static fromFirstRow() {
      const budgetSheet = SpreadsheetApp.getActive().getSheetByName('2025_field_budget');
      const data = budgetSheet.getDataRange().getValues();
      // Index 1 is the first row after header
      const rowData = data[1];
      return new FieldBudget(rowData);
    }
  
    // Get entry from specific row number (1-based for user friendliness)
    static fromSpecificRow(rowNumber) {
      const budgetSheet = SpreadsheetApp.getActive().getSheetByName('2025_field_budget');
      const data = budgetSheet.getDataRange().getValues();
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
        // Not sure I need this in this class. Keeping just incase
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
      this._designTotal = rowData[FieldBudget.COLUMNS.DESIGNTOTAL];
      this._designGap = rowData[FieldBudget.COLUMNS.DESIGNGAP];
      //Video
      this._videoRequested = rowData[FieldBudget.COLUMNS.VIDEOREQUESTED];
      this._videoTotal = rowData[FieldBudget.COLUMNS.VIDEOTOTAL];
      this._videoGap = rowData[FieldBudget.COLUMNS.VIDEOGAP];
      //Print
      this._printRequested = rowData[FieldBudget.COLUMNS.PRINTREQUESTED];
      this._printTotal = rowData[FieldBudget.COLUMNS.PRINTTOTAL];
      this._printGap = rowData[FieldBudget.COLUMNS.PRINTGAP];
      //Postage
      this._postageRequested = rowData[FieldBudget.COLUMNS.POSTAGEREQUESTED];
      this._postageTotal = rowData[FieldBudget.COLUMNS.POSTAGETOTAL];
      this._postageGap = rowData[FieldBudget.COLUMNS.POSTAGEGAP];
      //Training
      this._trainingRequested = rowData[FieldBudget.COLUMNS.TRAININGREQUESTED];
      this._trainingTotal = rowData[FieldBudget.COLUMNS.TRAININGTOTAL];
      this._trainingGap = rowData[FieldBudget.COLUMNS.TRAININGGAP];
      //Supplies
      this._suppliesRequested = rowData[FieldBudget.COLUMNS.SUPPLIESREQUESTED];
      this._suppliesTotal = rowData[FieldBudget.COLUMNS.SUPPLIESTOTAL];
      this._suppliesGap = rowData[FieldBudget.COLUMNS.SUPPLIESGAP];
      //Canvass
      this._canvassRequested = rowData[FieldBudget.COLUMNS.CANVASSREQUESTED];
      this._canvassTotal = rowData[FieldBudget.COLUMNS.CANVASSTOTAL];
      this._canvassGap = rowData[FieldBudget.COLUMNS.CANVASSGAP];
      //Phone
      this._phoneRequested = rowData[FieldBudget.COLUMNS.PHONEREQUESTED];
      this._phoneTotal = rowData[FieldBudget.COLUMNS.PHONETOTAL];
      this._phoneGap = rowData[FieldBudget.COLUMNS.PHONEGAP];
      //Text
      this._textRequested = rowData[FieldBudget.COLUMNS.TEXTREQUESTED];
      this._textTotal = rowData[FieldBudget.COLUMNS.TEXTTOTAL];
      this._textGap = rowData[FieldBudget.COLUMNS.TEXTGAP];
      //Event
      this._eventRequested = rowData[FieldBudget.COLUMNS.EVENTREQUESTED];
      this._eventTotal = rowData[FieldBudget.COLUMNS.EVENTTOTAL];
      this._eventGap = rowData[FieldBudget.COLUMNS.EVENTGAP];
      //Digital
      this._digitalRequested = rowData[FieldBudget.COLUMNS.DIGITALREQUESTED];
      this._digitalTotal = rowData[FieldBudget.COLUMNS.DIGITALTOTAL];
      this._digitalGap = rowData[FieldBudget.COLUMNS.DIGITALGAP];
      //Summary
      this._requestedTotal = rowData[FieldBudget.COLUMNS.REQUESTEDTOTAL]
      this._projectTotal = rowData[FieldBudget.COLUMNS.PROJECTTOTAL]
      this._gapTotal = rowData[FieldBudget.COLUMNS.GAPTOTAL]
      this._submitFieldPlan = rowData[FieldBudget.COLUMNS.SUBMITFIELDPLAN]
      //Meta
      this._analyzed = rowData[FieldBudget.COLUMNS.ANALYZED]
}

    //Getters
    //Contact
    get firstName() { return this._firstName || null; }
    get lastName() { return this._lastName || null; }
    get contactEmail() { return this._contactEmail || null; }
    get contactPhone() { return this._contactPhone || null; }
    get memberOrgName() { return this._memberOrgName || null; }
    //Admin
    get adminRequested() { return this._adminRequested || null; }
    get adminTotal() { return this._adminTotal || null; }
    get adminGap() { return this._adminGap || null; }
    //Data
    get dataRequested() { return this._dataRequested || null; }
    get dataTotal() { return this._dataTotal || null; }
    get dataGap() { return this._dataGap || null; }
    //Travel
    get travelRequested() { return this._travelRequested || null; }
    get travelTotal() { return this._travelTotal || null; }
    get travelGap() { return this._travelGap || null; }
    //Comms
    get commsRequested() { return this._commsRequested || null; }
    get commsTotal() { return this._commsTotal || null; }
    get commsGap() { return this._commsGap || null; }
    //Design
    get designRequested() { return this._designRequested || null; }
    get designTotal() { return this._designTotal || null; }
    get designGap() { return this._designGap || null; }
    //Video
    get videoRequested() { return this._videoRequested || null; }
    get videoTotal() { return this._videoTotal || null; }
    get videoGap() { return this._videoGap || null; }
    //Print
    get printRequested() { return this._printRequested || null; }
    get printTotal() { return this._printTotal || null; }
    get printGap() { return this._printGap || null; }
    //Postage
    get postageRequested() { return this._postageRequested || null; }
    get postageTotal() { return this._postageTotal || null; }
    get postageGap() { return this._postageGap || null; }
    //Training
    get trainingRequested() { return this._trainingRequested || null; }
    get trainingTotal() { return this._trainingTotal || null; }
    get trainingGap() { return this._trainingGap || null; }
    //Supplies
    get suppliesRequested() { return this._suppliesRequested || null; }
    get suppliesTotal() { return this._suppliesTotal || null; }
    get suppliesGap() { return this._suppliesGap || null; }
    //Canvass
    get canvassRequested() { return this._canvassRequested || null; }
    get canvassTotal() { return this._canvassTotal || null; }
    get canvassGap() { return this._canvassGap || null; }
    //Phone
    get phoneRequested() { return this._phoneRequested || null; }
    get phoneTotal() { return this._phoneTotal || null; }
    get phoneGap() { return this._phoneGap || null; }
    //Text
    get textRequested() { return this._textequested || null; }
    get textTotal() { return this._textTotal || null; }
    get textGap() { return this._textGap || null; }
    //Event
    get eventRequested() { return this._eventRequested || null; }
    get eventTotal() { return this._eventTotal || null; }
    get eventGap() { return this._eventGap || null; }
    //Digital
    get digitalRequested() { return this._digitalRequested || null; }
    get digitalTotal() { return this._digitalTotal || null; }
    get digitalGap() { return this._digitalGap || null; }
    //Summary
    get requestedTotal() { return this._requestedTotal || null; }
    get projectTotal() { return this._projectTotal || null; }
    get gapTotal() { return this._gapTotal || null; }
    get submitFieldPlan() { return this._submitFieldPlan || null; }
    //Meta
    get analyzed() { return this._analyzed || null; }
  
    // Helper functions for checking if arrays have items
  
    hasDataStorage(item) { return this._dataStorage.includes(item); }
    hasProgramTool(tool) { return this._programTools.includes(tool); }
    hasFieldTactic(tactic) { return this._programTools.includes(tactic); }
    hasFieldCounties(county) { return this._fieldCounties.includes(county); }
    hasDemoRace(race) { return this._demoRace.includes(race); }
    hasDemoGender(gender) { return this._demoGender.includes(gender); }
    hasDemoAffinity(affinity) { return this._demoAffinity.includes(affinity); }

    //Helper Functions
    countAnalyzed() {
      let analyzed = 0;
      let notAnalyzed = 0;

      for (let i = 1; i < data.length; i++) {
        const row = data[i]

        if (row[0]) {
          if (row[FieldBudget.COLUMNS.ANALYZED] === true) {
            analyzed++
          } else notAnalyzed++
        }
      }
      return `So far, ${analyzed} budgets have been analyzed and ${notAnalyzed} 
      remain to be analyzed because they are missing field plans.`
    }



      //Check row data at specific cell
        //If row data analyzed is TRUE
          //Increment analyzed counter
        // Else increment notAnalyzed counter

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
    ANALYZED: 54

  };