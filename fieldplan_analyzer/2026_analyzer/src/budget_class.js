FieldBudget.COLUMNS = BUDGET_COLUMNS

class FieldBudget {

    // Get most recent entry (last row)
    static fromLastRow() {
      const budgetSheet = getSheet(scriptProps.getProperty('SHEET_FIELD_BUDGET'));
      const data = budgetSheet.getDataRange().getValues();
      const lastRowIndex = data.length - 1;
      const rowData = data[lastRowIndex];
      return new FieldBudget(rowData);
    }
  
    // Get first entry after header (row 2)
    static fromFirstRow() {
      const budgetSheet = getSheet(scriptProps.getProperty('SHEET_FIELD_BUDGET'));
      const data = budgetSheet.getDataRange().getValues();
      // Index 1 is the first row after header
      const rowData = data[1];
      return new FieldBudget(rowData);
    }
  
    // Get entry from specific row number (1-based for user friendliness)
    static fromSpecificRow(rowNumber) {
      const budgetSheet = getSheet(scriptProps.getProperty('SHEET_FIELD_BUDGET'));
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
      this._firstName = rowData[BUDGET_COLUMNS.FIRSTNAME];
      this._lastName = rowData[BUDGET_COLUMNS.LASTNAME];
      this._contactEmail = rowData[BUDGET_COLUMNS.CONTACTEMAIL];
      this._contactPhone = rowData[BUDGET_COLUMNS.CONTACTPHONE];
      this._memberOrgName = rowData[BUDGET_COLUMNS.MEMBERNAME];
      //Admin
      this._adminRequested = rowData[BUDGET_COLUMNS.ADMINREQUESTED];
      this._adminTotal = rowData[BUDGET_COLUMNS.ADMINTOTAL];
      this._adminGap = rowData[BUDGET_COLUMNS.ADMINGAP];
      //Data
      this._dataRequested = rowData[BUDGET_COLUMNS.DATAREQUESTED];
      this._dataTotal = rowData[BUDGET_COLUMNS.DATATOTAL];
      this._dataGap = rowData[BUDGET_COLUMNS.DATAGAP];
      //Travel
      this._travelRequested = rowData[BUDGET_COLUMNS.TRAVELREQUESTED];
      this._travelTotal = rowData[BUDGET_COLUMNS.TRAVELTOTAL];
      this._travelGap = rowData[BUDGET_COLUMNS.TRAVELGAP];
      //Comms
      this._commsRequested = rowData[BUDGET_COLUMNS.COMMSREQUESTED];
      this._commsTotal = rowData[BUDGET_COLUMNS.COMMSTOTAL];
      this._commsGap = rowData[BUDGET_COLUMNS.COMMSGAP];
      //Design
      this._designRequested = rowData[BUDGET_COLUMNS.DESIGNREQUESTED];
      this._designTotal = rowData[BUDGET_COLUMNS.DESIGNTOTAL];
      this._designGap = rowData[BUDGET_COLUMNS.DESIGNGAP];
      //Video
      this._videoRequested = rowData[BUDGET_COLUMNS.VIDEOREQUESTED];
      this._videoTotal = rowData[BUDGET_COLUMNS.VIDEOTOTAL];
      this._videoGap = rowData[BUDGET_COLUMNS.VIDEOGAP];
      //Print
      this._printRequested = rowData[BUDGET_COLUMNS.PRINTREQUESTED];
      this._printTotal = rowData[BUDGET_COLUMNS.PRINTTOTAL];
      this._printGap = rowData[BUDGET_COLUMNS.PRINTGAP];
      //Postage
      this._postageRequested = rowData[BUDGET_COLUMNS.POSTAGEREQUESTED];
      this._postageTotal = rowData[BUDGET_COLUMNS.POSTAGETOTAL];
      this._postageGap = rowData[BUDGET_COLUMNS.POSTAGEGAP];
      //Training
      this._trainingRequested = rowData[BUDGET_COLUMNS.TRAININGREQUESTED];
      this._trainingTotal = rowData[BUDGET_COLUMNS.TRAININGTOTAL];
      this._trainingGap = rowData[BUDGET_COLUMNS.TRAININGGAP];
      //Supplies
      this._suppliesRequested = rowData[BUDGET_COLUMNS.SUPPLIESREQUESTED];
      this._suppliesTotal = rowData[BUDGET_COLUMNS.SUPPLIESTOTAL];
      this._suppliesGap = rowData[BUDGET_COLUMNS.SUPPLIESGAP];
      //Canvass
      this._canvassRequested = rowData[BUDGET_COLUMNS.CANVASSREQUESTED];
      this._canvassTotal = rowData[BUDGET_COLUMNS.CANVASSTOTAL];
      this._canvassGap = rowData[BUDGET_COLUMNS.CANVASSGAP];
      //Phone
      this._phoneRequested = rowData[BUDGET_COLUMNS.PHONEREQUESTED];
      this._phoneTotal = rowData[BUDGET_COLUMNS.PHONETOTAL];
      this._phoneGap = rowData[BUDGET_COLUMNS.PHONEGAP];
      //Text
      this._textRequested = rowData[BUDGET_COLUMNS.TEXTREQUESTED];
      this._textTotal = rowData[BUDGET_COLUMNS.TEXTTOTAL];
      this._textGap = rowData[BUDGET_COLUMNS.TEXTGAP];
      //Event
      this._eventRequested = rowData[BUDGET_COLUMNS.EVENTREQUESTED];
      this._eventTotal = rowData[BUDGET_COLUMNS.EVENTTOTAL];
      this._eventGap = rowData[BUDGET_COLUMNS.EVENTGAP];
      //Digital
      this._digitalRequested = rowData[BUDGET_COLUMNS.DIGITALREQUESTED];
      this._digitalTotal = rowData[BUDGET_COLUMNS.DIGITALTOTAL];
      this._digitalGap = rowData[BUDGET_COLUMNS.DIGITALGAP];
      //Summary
      this._requestedTotal = rowData[BUDGET_COLUMNS.REQUESTEDTOTAL]
      this._projectTotal = rowData[BUDGET_COLUMNS.PROJECTTOTAL]
      this._gapTotal = rowData[BUDGET_COLUMNS.GAPTOTAL]
      this._submitFieldPlan = rowData[BUDGET_COLUMNS.SUBMITFIELDPLAN]
      //Meta
      this._analyzed = rowData[BUDGET_COLUMNS.ANALYZED]
}

    //Getters
    //Contact
    get firstName() { return this._firstName || null; }
    get lastName() { return this._lastName || null; }
    get contactEmail() { return this._contactEmail || null; }
    get contactPhone() { return this._contactPhone || null; }
    get memberOrgName() { return this._memberOrgName || null; }
    //Admin
    get adminRequested() { return parseFloat(this._adminRequested) || 0; }
    get adminTotal() { return parseFloat(this._adminTotal) || 0; }
    get adminGap() { return parseFloat(this._adminGap) || 0; }
    //Data
    get dataRequested() { return parseFloat(this._dataRequested) || 0; }
    get dataTotal() { return parseFloat(this._dataTotal) || 0; }
    get dataGap() { return parseFloat(this._dataGap) || 0; }
    //Travel
    get travelRequested() { return parseFloat(this._travelRequested) || 0; }
    get travelTotal() { return parseFloat(this._travelTotal) || 0; }
    get travelGap() { return parseFloat(this._travelGap) || 0; }
    //Comms
    get commsRequested() { return parseFloat(this._commsRequested) || 0; }
    get commsTotal() { return parseFloat(this._commsTotal) || 0; }
    get commsGap() { return parseFloat(this._commsGap) || 0; }
    //Design
    get designRequested() { return parseFloat(this._designRequested) || 0; }
    get designTotal() { return parseFloat(this._designTotal) || 0; }
    get designGap() { return parseFloat(this._designGap) || 0; }
    //Video
    get videoRequested() { return parseFloat(this._videoRequested) || 0; }
    get videoTotal() { return parseFloat(this._videoTotal) || 0; }
    get videoGap() { return parseFloat(this._videoGap) || 0; }
    //Print
    get printRequested() { return parseFloat(this._printRequested) || 0; }
    get printTotal() { return parseFloat(this._printTotal) || 0; }
    get printGap() { return parseFloat(this._printGap) || 0; }
    //Postage
    get postageRequested() { return parseFloat(this._postageRequested) || 0; }
    get postageTotal() { return parseFloat(this._postageTotal) || 0; }
    get postageGap() { return parseFloat(this._postageGap) || 0; }
    //Training
    get trainingRequested() { return parseFloat(this._trainingRequested) || 0; }
    get trainingTotal() { return parseFloat(this._trainingTotal) || 0; }
    get trainingGap() { return parseFloat(this._trainingGap) || 0; }
    //Supplies
    get suppliesRequested() { return parseFloat(this._suppliesRequested) || 0; }
    get suppliesTotal() { return parseFloat(this._suppliesTotal) || 0; }
    get suppliesGap() { return parseFloat(this._suppliesGap) || 0; }
    //Canvass
    get canvassRequested() { return parseFloat(this._canvassRequested) || 0; }
    get canvassTotal() { return parseFloat(this._canvassTotal) || 0; }
    get canvassGap() { return parseFloat(this._canvassGap) || 0; }
    //Phone
    get phoneRequested() { return parseFloat(this._phoneRequested) || 0; }
    get phoneTotal() { return parseFloat(this._phoneTotal) || 0; }
    get phoneGap() { return parseFloat(this._phoneGap) || 0; }
    //Text
    get textRequested() { return parseFloat(this._textRequested) || 0; }
    get textTotal() { return parseFloat(this._textTotal) || 0; }
    get textGap() { return parseFloat(this._textGap) || 0; }
    //Event
    get eventRequested() { return parseFloat(this._eventRequested) || 0; }
    get eventTotal() { return parseFloat(this._eventTotal) || 0; }
    get eventGap() { return parseFloat(this._eventGap) || 0; }
    //Digital
    get digitalRequested() { return parseFloat(this._digitalRequested) || 0; }
    get digitalTotal() { return parseFloat(this._digitalTotal) || 0; }
    get digitalGap() { return parseFloat(this._digitalGap) || 0; }
    //Summary
    get requestedTotal() { return parseFloat(this._requestedTotal) || 0; }
    get projectTotal() { return parseFloat(this._projectTotal) || 0; }
    get gapTotal() { return parseFloat(this._gapTotal) || 0; }
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

      let notOutreachProportion = Math.round((notOutreachTotal / this.requestedTotal)*100)

      return `${this.memberOrgName} is requesting $${notOutreachTotal} in resources for indirect costs.
      That represents ${notOutreachProportion}% of their total funding request.`
    };

    sumOutreach() {
      let outreachTotal = (this.canvassRequested
        + this.phoneRequested
        + this.textRequested
        + this.eventRequested
        + this.digitalRequested
      )

      let outreachProportion = Math.round((outreachTotal / this.requestedTotal)*100)

      return `${this.memberOrgName} is requesting $${outreachTotal} in resources for outreach costs.
      That represents ${outreachProportion}% of their total funding request.`
    };

    needDataStipend() {
      let hourlyRate = 20
      if (this.dataRequested){
        return `${this.memberOrgName} is requesting $${this.dataRequested} in data funding.
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
      const budgetSheet = getSheet(scriptProps.getProperty('SHEET_FIELD_BUDGET'));
      const data = budgetSheet.getDataRange().getValues();
      let analyzed = 0;
      let notAnalyzed = 0;

      for (let i = 1; i < data.length; i++) {
        const row = data[i]

        if (row[0]) {
          if (row[BUDGET_COLUMNS.ANALYZED] === true) {
            analyzed++
          } else notAnalyzed++
        }
      }
      return `So far, ${analyzed} budgets have been analyzed and ${notAnalyzed} remain to be analyzed.`
    }



    // Method to mark this budget as analyzed
    markAsAnalyzed(rowNumber) {
      const budgetSheet = getSheet(scriptProps.getProperty('SHEET_FIELD_BUDGET'));
      budgetSheet.getRange(rowNumber, BUDGET_COLUMNS.ANALYZED + 1).setValue(true);
      this._analyzed = true;
    }

    // Get all unanalyzed budgets
    static getUnanalyzedBudgets() {
      const budgetSheet = getSheet(scriptProps.getProperty('SHEET_FIELD_BUDGET'));
      const data = budgetSheet.getDataRange().getValues();
      const unanalyzedBudgets = [];
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        if (row[0] && row[BUDGET_COLUMNS.ANALYZED] !== true) {
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
