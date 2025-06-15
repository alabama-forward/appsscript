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
    get textRequested() { return this._textRequested || null; }
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
  
    // Helper functions

    sumNotOutreach() {
      let notOutreachTotal = (this.adminRequested
        + this.dataRequested
        + this.travelRequested 
        + this.commsRequested
        + this.designRequested
        + this.videoRequested
        + this.printRequested
        + this.postageRequested
        + this.trainingRequested
        + this.suppliesRequested
      )

      let notOutreachProportion = (notOutreachTotal / this.requestedTotal)*100

      return `${this.memberOrgName} is requesting $${notOutreachTotal} in resources for indirect costs.
      That represents %${notOutreachProportion} of their total funding request.`
    };

    sumOutreach() {
      let outreachTotal = (this.canvassRequested
        + this.phoneRequested
        + this.textRequested
        + this.eventRequested
        + this.digitalRequested
      )

      let outreachProportion = (outreachTotal / this.requestedTotal)*100

      return `${this.memberOrgName} is requesting $${outreachTotal} in resources for outreach costs.
      That represents %${outreachProportion} of their total funding request.`
    };

    needDataStipend() {
      let hourlyRate = 20
      if (this.dataRequested){
        return `${this.memberOrgName} is requesting ${this.dataRequested} in data funding.
        This represents ${this.dataRequested / hourlyRate} hours of labor that can be offset
        by a data stipend.`
      } else {
        return `${this.memberOrgName} did not request data funding.`
      }
    };

    requestSummary() {
      const requestedAmount = this.requestedTotal || 0;
      const rawGap = this.gapTotal || 0;
      const displayGap = Math.abs(rawGap);
      
      // If gap equals requested amount, program is entirely funded by this request
      if (displayGap === requestedAmount && requestedAmount > 0) {
        return `This program will be entirely funded by this request. Reach out to ask if they will be seeking additional funds for this program or if they will only run their program with support from Alabama Forward.`;
      }
      
      // Standard summary for programs with funding requests or gaps
      const gapNote = rawGap < 0 ? ' (gap was originally negative, converted to positive for analysis)' : '';
      
      // Handle null/undefined project total
      const projectCost = this.projectTotal !== null && this.projectTotal !== undefined ? 
        `$${this.projectTotal}` : 
        'an unspecified amount';
      
      return `${this.memberOrgName} requested $${requestedAmount} and described a funding gap of
      $${displayGap}${gapNote}. Their project costs ${projectCost} to run.`
    }




    //Helper Functions
    static countAnalyzed() {
      const budgetSheet = SpreadsheetApp.getActive().getSheetByName('2025_field_budget');
      const data = budgetSheet.getDataRange().getValues();
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
      return `So far, ${analyzed} budgets have been analyzed and ${notAnalyzed} remain to be analyzed.`
    }



    // Method to mark this budget as analyzed
    markAsAnalyzed(rowNumber) {
      const budgetSheet = SpreadsheetApp.getActive().getSheetByName('2025_field_budget');
      budgetSheet.getRange(rowNumber, FieldBudget.COLUMNS.ANALYZED + 1).setValue(true);
      this._analyzed = true;
    }

    // Get all unanalyzed budgets
    static getUnanalyzedBudgets() {
      const budgetSheet = SpreadsheetApp.getActive().getSheetByName('2025_field_budget');
      const data = budgetSheet.getDataRange().getValues();
      const unanalyzedBudgets = [];
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[0] && row[FieldBudget.COLUMNS.ANALYZED] !== true) {
          unanalyzedBudgets.push({
            budget: new FieldBudget(row),
            rowNumber: i + 1 // 1-based row number
          });
        }
      }
      
      return unanalyzedBudgets;
    }

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
    FIRSTNAME: 1,
    LASTNAME: 2,
    CONTACTEMAIL: 3,
    CONTACTPHONE: 4,
    MEMBERNAME: 5,
    ADMINREQUESTED: 6,
    ADMINTOTAL: 7,
    ADMINGAP: 8,
    DATAREQUESTED: 9,
    DATATOTAL: 10,
    DATAGAP: 11,
    TRAVELREQUESTED: 12,
    TRAVELTOTAL: 13,
    TRAVELGAP: 14,   
    COMMSREQUESTED: 15,
    COMMSTOTAL: 16,
    COMMSGAP: 17,
    DESIGNREQUESTED: 18,
    DESIGNTOTAL: 19,
    DESIGNGAP: 20,
    VIDEOREQUESTED: 21,
    VIDEOTOTAL: 22,
    VIDEOGAP: 23,
    PRINTREQUESTED: 24,
    PRINTTOTAL: 25,
    PRINTGAP: 26,
    POSTAGEREQUESTED: 27,
    POSTAGETOTAL: 28,
    POSTAGEGAP: 29,
    TRAININGREQUESTED: 30,
    TRAININGTOTAL: 31,
    TRAININGGAP: 32,
    SUPPLIESREQUESTED: 33,
    SUPPLIESTOTAL: 34,
    SUPPLIESGAP: 35,
    CANVASSREQUESTED: 36,
    CANVASSTOTAL: 37,
    CANVASSGAP: 38,
    PHONEREQUESTED: 39,
    PHONETOTAL: 40,
    PHONEGAP: 41,
    TEXTREQUESTED: 42,
    TEXTTOTAL: 43,
    TEXTGAP: 44,
    EVENTREQUESTED: 45,
    EVENTTOTAL: 46,
    EVENTGAP: 47,
    DIGITALREQUESTED: 48,
    DIGITALTOTAL: 49,
    DIGITALGAP: 50,
    REQUESTEDTOTAL: 51,
    PROJECTTOTAL: 52,
    GAPTOTAL: 53,
    SUBMITFIELDPLAN: 54,
    ANALYZED: 55
  };