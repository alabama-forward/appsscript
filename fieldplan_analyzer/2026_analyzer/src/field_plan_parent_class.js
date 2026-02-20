// Main Field Plan Class //
class FieldPlan {

    // Get most recent entry (last row)
    static fromLastRow() {
      const sheet = getSheet(scriptProps.getProperty('SHEET_FIELD_PLAN'));
      const data = sheet.getDataRange().getValues();
      const lastRowIndex = data.length - 1;
      const rowData = data[lastRowIndex];
      return new FieldPlan(rowData);
    }
  
    // Get first entry after header (row 2)
    static fromFirstRow() {
      const sheet = getSheet(scriptProps.getProperty('SHEET_FIELD_PLAN'));
      const data = sheet.getDataRange().getValues();
      // Index 1 is the first row after header
      const rowData = data[1];
      return new FieldPlan(rowData);
    }
  
    // Get entry from specific row number (1-based for user friendliness)
    static fromSpecificRow(rowNumber) {
      const sheet = getSheet(scriptProps.getProperty('SHEET_FIELD_PLAN'));
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
      this._submissionId = rowData[FIELD_PLAN_COLUMNS.SUBMISSIONID];

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

      //Geo & Tactics
      this._fieldTactics = normalizeField(rowData[FIELD_PLAN_COLUMNS.FIELDTACTICS]);
      this._teachComfortable = normalizeField(rowData[FIELD_PLAN_COLUMNS.TEACHCOMFORTABLE]);
      this._fieldStaff = normalizeField(rowData[FIELD_PLAN_COLUMNS.FIELDSTAFF]);
      this._fieldNarrative = rowData[FIELD_PLAN_COLUMNS.FIELDNARRATIVE];
      this._reviewedPlan = rowData[FIELD_PLAN_COLUMNS.REVIEWEDPLAN];
      this._runningForOffice = rowData[FIELD_PLAN_COLUMNS.RUNNINGFOROFFICE];
      this._fieldCounties = normalizeField(rowData[FIELD_PLAN_COLUMNS.FIELDCOUNTIES]);
      this._cities = normalizeField(rowData[FIELD_PLAN_COLUMNS.CITIES]);
      this._knowsPrecincts = rowData[FIELD_PLAN_COLUMNS.KNOWSPRECINCTS];
      this._fieldPrecincts = normalizeField(rowData[FIELD_PLAN_COLUMNS.FIELDPRECINCTS]); //Updated the name here, need to make sure it's updated across the code
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
    //Meta
    get submissionDateTime() { return this._submissionDateTime || null; }
    get submissionId() { return this._submissionId || null; }
    get submissionUrl() { return this._submissionUrl || null; }
    //Training
    get attendedTraining() { return this._attendedTraining || null;}
    //Contact
    get memberOrgName() {return this._memberOrgName || null; }
    get firstName() { return this._firstName || null; }
    get lastName() { return this._lastName || null; }
    get contactEmail() { return this._contactEmail || null; }
    get contactPhone() { return this._contactPhone || null; }
    //Data & Tools
    get dataStorage() { return this._dataStorage || null; }
    get dataStipend() { return this._dataStipend || null; }
    get dataPlan() { return this._dataPlan || null; }
    get dataShare() { return this._dataShare || null; }
    get vanCommittee() { return this._vanCommittee || null; }
    get shareOrg() { return this._shareOrg || null; }
    get programTools() { return this._programTools || null; }
    get programDates() { return this._programDates || null; }
    get programTypes() { return this._programTypes || null; }
    //Geo & Tactics
    get fieldTactics() { return this._fieldTactics || null; }
    get teachComfortable() { return this._teachComfortable || null; }
    get fieldStaff() { return this._fieldStaff || null; }
    get fieldNarrative() { return this._fieldNarrative || null; }
    get reviewedPlan() { return this._reviewedPlan || null; }
    get runningForOffice() { return this._runningForOffice || null; }
    get fieldCounties() { return this._fieldCounties || null; }
    get cities() { return this._cities || null; }
    get knowsPrecincts() { return this._knowsPrecincts || null; }
    get fieldPrecincts() { return this._fieldPrecincts || null;}
    get diffPrecincts() { return this._diffPrecincts || null; }
    get specialGeo() { return this._specialGeo || null; }
    //Demos
    get demoRace() { return this._demoRace || null; }
    get demoAge() { return this._demoAge || null; }
    get demoGender() { return this._demoGender || null; }
    get demoAffinity() { return this._demoAffinity || null; }
    get demoNotes() { return this._demoNotes || null; }
    get demoConfidence() { return this._demoConfidence || null; }
    //Acknowledgements
    get understandsReasonable() { return this._understandsReasonable || null; }
    get understandsDisbursement() { return this._understandsDisbursement || null; }
    get understandsTraining() { return this._understandsTraining || null; }
    //Confidence & Self Assessment
    get confidenceReasonable() { return this._confidenceReasonable || null; }
    get confidenceData() { return this._confidenceData || null; }
    get confidencePlan() { return this._confidencePlan || null; }
    get confidenceCapacity() { return this._confidenceCapacity || null; }
    get confidenceSkills() { return this._confidenceSkills || null; }
    get confidenceGoals() { return this._confidenceGoals || null; }
  
    // Helper functions for checking if arrays have items
  
    hasDataStorage(item) { return this._dataStorage.includes(item); }
    hasShareOrg(org) {return this._shareOrg.includes(org); }
    hasProgramTool(tool) { return this._programTools.includes(tool); }
    hasProgramType(type) { return this._programTypes.includes(type); }
    hasFieldTactic(tactic) { return this._fieldTactics.includes(tactic); }
    hasFieldCounties(county) { return this._fieldCounties.includes(county); }
    hasCity(city) { return this._cities.includes(city); }
    hasFieldPrecincts(precinct) { return this._fieldPrecincts.includes(precinct); }
    hasSpecialGeo(area) {return this._specialGeo.includes(area); }
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
  
    /**
     * Assesses coaching needs based on the six 2026 confidence scores
     * 
     * Calculates an average confidence score across all six dimensions:
     * reasonable expectations, data/technology, plan quality, staff capacity, 
     * tactic skills, and goal attainment.
     * 
     * Scoring thresholds:
     *    - Average <= 5: High coaching need, reach out
     *    - Average: 6-8: Medium need, offer coaching
     *    - Average: > 8: Low, no coaching needed
     * 
     * Also highlights specific low-scoring areas for targeted coaching
     * 
     * @returns {string} A formatted message describing coaching needs
     */
    needsCoaching() {
      const scores = {
        'meeting expectations': this._confidenceReasonable,
        'data and technology': this._confidenceData,
        'field plan quality': this._confidencePlan,
        'staff / volunteer capacity': this._confidenceCapacity,
        'field tactic skills': this._confidenceSkills,
        'meeting goals': this._confidenceGoals
      };

      const validScores = Object.entries(scores)
        .filter(([_, val]) => val != null && !isNaN(val));

      if (validScores.length === 0) {
        return `${this._memberOrgName} did not provide confidence scores.`;
      }

      const avgConfidence = validScores
        .reduce((sum, [_, val]) => sum + Number(val), 0) / validScores.length;
      
      const lowAreas = validScores
        .filter(([_, val]) => Number(val) <=5)
        .map(([area, _]) => area);
      
      let message = '';

      if (avgConfidence <= 5) {
        message = `${this._memberOrgName} had an average confidence score of ${avgConfidence.toFixed(1)}/10. Reach out to them to confirm what coaching they will need.`;
      } else if (avgConfidence <= 8) {
        message = `${this._memberOrgName} had an average confidence score of ${avgConfidence.toFixed(1)}/10. Reach out to them to ask if they would like some coaching on their field plan.`;
      } else {
        message = `${this._memberOrgName} had an average confidence score of ${avgConfidence.toFixed(1)}/10. They did not request coaching on their field plan.`;
      }

      if (lowAreas.length > 0) {
        message += ` Specific areas needing attention: ${lowAreas.join(', ')}.`;
      }

      Logger.log(message);
      return message;
    }
  };
  
