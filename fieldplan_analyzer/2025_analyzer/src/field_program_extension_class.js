const PROGRAM_COLUMNS = {
    PHONE: {
      PROGRAMLENGTH: 26,
      WEEKLYVOLUNTEERS: 27,
      WEEKLYHOURS: 28,
      HOURLYATTEMPTS: 29
    },
    DOOR: {
      PROGRAMLENGTH: 30,
      WEEKLYVOLUNTEERS: 31,
      WEEKLYHOURS: 32,
      HOURLYATTEMPTS: 33
    },
    OPEN: {
      PROGRAMLENGTH: 34,
      WEEKLYVOLUNTEERS: 35,
      WEEKLYHOURS: 36,
      HOURLYATTEMPTS: 37
    },
    RELATIONAL: {
      PROGRAMLENGTH: 38,
      WEEKLYVOLUNTEERS: 39,
      WEEKLYHOURS: 40,
      HOURLYATTEMPTS: 41
    },
    REGISTRATION: {
      PROGRAMLENGTH: 42,
      WEEKLYVOLUNTEERS: 43,
      WEEKLYHOURS: 44,
      HOURLYATTEMPTS: 45
    },
    TEXT: {
      PROGRAMLENGTH: 46,
      WEEKLYVOLUNTEERS: 47,
      WEEKLYHOURS: 48,
      HOURLYATTEMPTS: 49
    },
    MAIL: {
      PROGRAMLENGTH: 50,
      WEEKLYVOLUNTEERS: 51,
      WEEKLYHOURS: 52,
      HOURLYATTEMPTS: 53
    }
  
  }; 
  /**
   * Represents a field program with volunteer and activity tracking
   * @extends FieldPlan
   */
  class FieldProgram extends FieldPlan {
    constructor(rowData, tacticType) {
      Logger.log('FieldProgram Constructor called with tacticType:', tacticType);
      super(rowData);  // Call parent constructor
      Logger.log('FieldProgram: Parent constructor completed');
    
    const columns = PROGRAM_COLUMNS[tacticType];
    if (!columns) {
      throw new Error (`Invalid tactic type: ${tacticType}`);
    }
  
    // Helper function inside constructor
        const validateColumn = (columnIndex, fieldName) => {
          const value = rowData[columnIndex];
          if (typeof value !== 'number' || isNaN(value)) {
            throw new TypeError(
              `Invalid data in column ${columnIndex}: ${fieldName} must be a valid number. Got: ${value}`
            );
          }
          if (value <= 0) {
            throw new RangeError(
              `Invalid data in column ${columnIndex}: ${fieldName} must be greater than 0. Got: ${value}`
            );
          }
          return value;
        };
  
    // Assign validated values once
    this._programLength = validateColumn(columns.PROGRAMLENGTH, 'Program Length');
    this._weeklyVolunteers = validateColumn(columns.WEEKLYVOLUNTEERS, 'Weekly Volunteers');
    this._weeklyHours = validateColumn(columns.WEEKLYHOURS, 'Weekly Hours');
    this._hourlyAttempts = validateColumn(columns.HOURLYATTEMPTS, 'Hourly Attempts');
  
  }
    // Getters
    get programLength() { return this._programLength || null; }
    get weeklyVolunteers() { return this._weeklyVolunteers || null; }
    get weeklyVolunteerHours() { return this._weeklyHours || null; }
    get hourlyAttempts() { return this._hourlyAttempts || null; }
  
    /** Calculates the number of volunteer hours for the program
     * @param {number} weeklyVolunteers - Weekly Volunteers Expected
     * @param {number} weeklyHours - Weekly Volunteer Hours
     * @param {number} programLength - Length of program in Weeks
     * @returns {number} Total volunteer hours for the program.
     */
    programVolunteerHours() { 
      return (this._weeklyVolunteers * this._weeklyHours * this._programLength)
    }
  
    /** Calculates the number of weekly volunteer hours
     * @param {number} weeklyVolunteers - Weekly Volunteers Expected
     * @param {number} weeklyHours - Weekly Volunteer Hours
     * @returns {number} Weekly volunteer hours for the program.
     */
    weekVolunteerHours() {
      return (this._weeklyVolunteers * this._weeklyHours)
    }
  
    /** Calculates the number of contact attempts each week
     * @param {number} weeklyVolunteers - Weekly Volunteers Expected
     * @param {number} weeklyHours - Weekly Volunteer Hours
     * @param {number} hourlyAttempts - Contact attempts per hour
     * @returns {number} Contact attempts each week
     */
    weeklyAttempts() {
      return (this._weeklyVolunteers * this._weeklyHours * this._hourlyAttempts)
    }
    /** Calculates the number of attempts for the entire program
     * @param {number} programLength - Length of program in Weeks
     * @param {number} weeklyVolunteers - Weekly Volunteers Expected
     * @param {number} weeklyHours - Weekly Volunteer Hours 
     * @param {number} hourlyAttempts - Contact attempts per hour
     * @returns {number} Contact attempts each week
     */
    programAttempts() {
      return (this._programLength * this._weeklyVolunteers * this._weeklyHours * this._hourlyAttempts)
    }
    /**
     * Calculates the reasonable range of attempts per volunteer
     * @returns {number} Weekly attempts divided by number of volunteers
     */
    reasonableRange() {
      return (this._hourlyAttempts)
    }
  };