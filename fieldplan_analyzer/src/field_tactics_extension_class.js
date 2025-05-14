// Phone canvassing class
class PhoneTactic extends FieldProgram{
    constructor(rowData) {
      super(rowData, 'PHONE')
      this._phoneRange = [.05, .10];
      this._phoneReasonable = 30;
    }
  
    phoneAttemptReasonable() {
        const range = this.reasonableRange();
        if (range <= this._phoneReasonable) {
            return `${this._memberOrgName} has a reasonable hourly attempt where each volunteer is only expected to attempt to contact ${range} people per hour`;
        } else if (range > this._phoneReasonable && range <= this._phoneReasonable + 10) {  // Added 'range' before <=
            return `${this._memberOrgName} is at risk of expecting too many attempts for each volunteer. They expect ${range} attempts per hour per volunteer.`;
        } else {
            return `${this._memberOrgName} is expecting an unrealistic number of attempts per hour for their volunteers. They expect ${range} contacts each hour per volunteer.`;
        }
    }
  
    phoneExpectedContacts() {
      const phoneLowerRange = this.programAttempts() * this._phoneRange[0];
      const phoneUpperRange = this.programAttempts()* this._phoneRange[1];
  
      return `${this._memberOrgName} intends to successfully reach between ${phoneLowerRange} and ${phoneUpperRange} people during the course of their ${this._programLength} week program`
    }
  };
  
// Door canvassing class
class DoorTactic extends FieldProgram{
  constructor(rowData) {
    super(rowData, 'DOOR')
    this._doorRange = [.05, .10];
    this._doorReasonable = 30;
    }

  doorAttemptReasonable() {
    const range = this.reasonableRange();
    if (range <= this._doorReasonable) {
        return `${this._memberOrgName} has a reasonable hourly attempt where each volunteer is only expected to attempt to contact ${range} people per hour`;
    } else if (range > this._doorReasonable && range <= this._doorReasonable + 10) {  // Added 'range' before <=
        return `${this._memberOrgName} is at risk of expecting too many attempts for each volunteer. They expect ${range} attempts per hour per volunteer.`;
    } else {
        return `${this._memberOrgName} is expecting an unrealistic number of attempts per hour for their volunteers. They expect ${range} contacts each hour per volunteer.`;
    }
  }

  doorExpectedContacts() {
    const doorLowerRange = this.programAttempts() * this._doorRange[0];
    const doorUpperRange = this.programAttempts()* this._doorRange[1];

    return `${this._memberOrgName} intends to successfully reach between ${doorLowerRange} and ${doorUpperRange} people during the course of their ${this._programLength} week program`
  }
};


// Open Canvassing / Tabling Class
class OpenTactic extends FieldProgram{
  constructor(rowData) {
    super(rowData, 'OPEN')
    this._openRange = [.10, .20];
    this._openReasonable = 60;
  }
  openAttemptReasonable() {
    const range = this.reasonableRange();
    if (range <= this._openReasonable) {
        return `${this._memberOrgName} has a reasonable hourly attempt where each volunteer is only expected to attempt to contact ${range} people per hour`;
    } else if (range > this._openReasonable && range <= this._openReasonable + 10) {  // Added 'range' before <=
        return `${this._memberOrgName} is at risk of expecting too many attempts for each volunteer. They expect ${range} attempts per hour per volunteer.`;
    } else {
        return `${this._memberOrgName} is expecting an unrealistic number of attempts per hour for their volunteers. They expect ${range} contacts each hour per volunteer.`;
    }
  }

  openExpectedContacts() {
    const openLowerRange = this.programAttempts() * this._openRange[0];
    const openUpperRange = this.programAttempts()* this._openRange[1];

    return `${this._memberOrgName} intends to successfully reach between ${openLowerRange} and ${openUpperRange} people during the course of their ${this._programLength} week program`
  }
};

// Relational organizing class
class RelationalTactic extends FieldProgram{
  constructor(rowData) {
    super(rowData, 'RELATIONAL')
    this._relationalRange = [.50, .70];
    this._relationalReasonable = 30;
  }
  relationalAttemptReasonable() {
    const range = this.reasonableRange();
    if (range <= this._relationalReasonable) {
        return `${this._memberOrgName} has a reasonable hourly attempt where each volunteer is only expected to attempt to contact ${range} people per hour`;
    } else if (range > this._relationalReasonable && range <= this._relationalReasonable + 10) {  // Added 'range' before <=
        return `${this._memberOrgName} is at risk of expecting too many attempts for each volunteer. They expect ${range} attempts per hour per volunteer.`;
    } else {
        return `${this._memberOrgName} is expecting an unrealistic number of attempts per hour for their volunteers. They expect ${range} contacts each hour per volunteer.`;
    }
  }

  relationalExpectedContacts() {
    const relationalLowerRange = this.programAttempts() * this._relationalRange[0];
    const relationalUpperRange = this.programAttempts()* this._relationalRange[1];

    return `${this._memberOrgName} intends to successfully reach between ${relationalLowerRange} and ${relationalUpperRange} people during the course of their ${this._programLength} week program`
  }
};

// Voter registration tactic class
class RegistrationTactic extends FieldProgram{
  constructor(rowData) {
    super(rowData, 'REGISTRATION')
    this._registrationRange = [.10, .30];
    this._registrationReasonable = 5;
  }

  registrationAttemptReasonable() {
    const range = this.reasonableRange();
    if (range <= this._registrationReasonable) {
        return `${this._memberOrgName} has a reasonable hourly attempt where each volunteer is only expected to attempt to contact ${range} people per hour`;
    } else if (range > this._registrationReasonable && range <= this._registrationReasonable + 10) {  // Added 'range' before <=
        return `${this._memberOrgName} is at risk of expecting too many attempts for each volunteer. They expect ${range} attempts per hour per volunteer.`;
    } else {
        return `${this._memberOrgName} is expecting an unrealistic number of attempts per hour for their volunteers. They expect ${range} contacts each hour per volunteer.`;
    }
  }

  registrationExpectedContacts() {
    const registrationLowerRange = this.programAttempts() * this._registrationRange[0];
    const registrationUpperRange = this.programAttempts()* this._registrationRange[1];

    return `${this._memberOrgName} intends to successfully reach between ${registrationLowerRange} and ${registrationUpperRange} during the course of their ${this._programLength} week program`
  }
};

// Text banking class
class TextTactic extends FieldProgram{
  constructor(rowData) {
    super(rowData, 'TEXT')
    this._textRange = [.01, .05];
    this._textReasonable = 2000;
  }

  textAttemptReasonable() {
    const range = this.reasonableRange();
    if (range <= this._textReasonable) {
        return `${this._memberOrgName} has a reasonable hourly attempt where each volunteer is only expected to attempt to contact ${range} people per hour`;
    } else if (range > this._textReasonable && range <= this._textReasonable + 10) {
        return `${this._memberOrgName} is at risk of expecting too many attempts for each volunteer. They expect ${range} attempts per hour per volunteer.`;
    } else {
        return `${this._memberOrgName} is expecting an unrealistic number of attempts per hour for their volunteers. They expect ${range} contacts each hour per volunteer.`;
    }
  }

  textExpectedContacts() {
    const textLowerRange = this.programAttempts() * this._textRange[0];
    const textUpperRange = this.programAttempts()* this._textRange[1];

    return `${this._memberOrgName} intends to successfully reach between ${textLowerRange} and ${textUpperRange} people during the course of their ${this._programLength} week program`
  }
};

class MailTactic extends FieldProgram{
  constructor(rowData) {
    super(rowData, 'MAIL')
    this._mailRange = [.70, .90];
    this._mailReasonable = 1000;
  }

  mailAttemptReasonable() {
    const range = this.reasonableRange();
    if (range <= this._mailReasonable) {
        return `${this._memberOrgName} has a reasonable hourly attempt where each volunteer is only expected to attempt to contact ${range} people per hour`;
    } else if (range > this._mailReasonable && range <= this._mailReasonable + 10) {
        return `${this._memberOrgName} is at risk of expecting too many attempts for each volunteer. They expect ${range} attempts per hour per volunteer.`;
    } else {
        return `${this._memberOrgName} is expecting an unrealistic number of attempts per hour for their volunteers. They expect ${range} contacts each hour per volunteer.`;
    }
  }

  mailExpectedContacts() {
    const mailLowerRange = this.programAttempts() * this._mailRange[0];
    const mailUpperRange = this.programAttempts()* this._mailRange[1];

    return `${this._memberOrgName} intends to successfully reach between ${mailLowerRange} and ${mailUpperRange} people during the course of their ${this._programLength} week program`
  }
};
