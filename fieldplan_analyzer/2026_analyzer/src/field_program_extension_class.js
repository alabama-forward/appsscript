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

    /**
     * REFACTORED: Generic attempt reasonable check
     * Works for all tactic types using their specific threshold
     * Eliminates need for duplicate tactical calculations
     * @param {number} threshold -  Reasonable hourly attempts threshold for this tactic
     * @param {string} tacticName - Displau name (e.g. "Phone Banking")
     * @returns {string} Formatted message
     */
    attemptReasonableMessage(threshold, tacticName) {
      const range = this.reasonableRange();

      if (range <= threshold) {
        return `${this._memberOrgName} has a reasonable hourly attempt for ${tacticName} 
          where each volunteer is only expected to attempt to contact ${range} people per hour`;
      } else if (range > threshold && range <= threshold + 10) {
        return `${this._memberOrgName} is at risk of expecting too many ${tacticName} 
          attempts for each volunteer. They expect ${range} attempts per hour per volunteer.`;
      } else {
        return `${this._memberOrgName} is expecting an unreasonable number of ${tacticName} 
          attempts per hour for their volunteers. They expect ${range} contacts each hour per volunteer.`;
      }
    }

    /**
     * REFACTORED: Generic expected contacts calculation
     * Works for all tactic types using their specific contact rate range
     * Eliminates need for phoneExceptedContacts and other like methods
     * @param {Array<number>} contactRange - [min, max] contact rate
     * @param {string} tacticName - Display name
     * @returns {string} Formatted message
     */
    expectedContactsMessage(contactRange, tacticName) {
      const lowerContacts = Math.round(this.programAttempts() * contactRange[0]);
      const upperContacts = Math.round(this.programAttempts() * contactRange[1]);

      return `${this._memberOrgName} intends to successfully reach between ${lowerContacts}
        and ${upperContacts} people through ${tacticName} during the course of their
        ${this._programLength} week program`
    }
  };