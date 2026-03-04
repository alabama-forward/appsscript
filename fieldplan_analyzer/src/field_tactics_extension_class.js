/**
 * 2026 Field Plan Tactics
 * REFACTORING: Configuration-Driven Pattern
 * RESULT: Reduced from 210 lines to ~55 lines, improving maintainability
 * 
 * To Add New Tactic: Add to TACTIC_CONFIG
 * To Modify a Tactic: Update TACTIC_CONFIG
 * 
 * This file replaces 7 separate tactic classes with a single class + configuration
 */

// =============
// TACTIC CONFIGURATION
// =============

const TACTIC_CONFIG = {
  PHONE: {
    name: 'Phone Banking',
    columnKey: 'PHONE',
    contactRange: [0.05, 0.10],
    reasonableThreshold: 30,
    costTarget: 0.66,      //$0.66 per attempt
    costStdDev: 0.15       //+-$0.15 acceptable range ($0.15 - $0.81)
  },
  DOOR: {
    name: 'Door to Door Canvassing',
    columnKey: 'DOOR',
    contactRange: [0.05, 0.10],
    reasonableThreshold: 30,
    costTarget: 1.00,      // $1.00 per attempt
    costStdDev: 0.20       // ±$0.20 acceptable range ($0.80 - $1.20)
  },
  OPEN: {
    name: 'Open Canvassing / Tabling',
    columnKey: 'OPEN',
    contactRange: [0.10, 0.15],
    reasonableThreshold: 40,
    costTarget: 0.40,      // $0.40 per attempt
    costStdDev: 0.10       // ±$0.10 acceptable range ($0.30 - $0.50)
  },
  RELATIONAL: {
    name: 'Relational Organizing',
    columnKey: 'RELATIONAL',
    contactRange: [0.20, 0.30],
    reasonableThreshold: 50,
    costTarget: 0.50,      // $0.50 per attempt (estimated)
    costStdDev: 0.15       // ±$0.15 acceptable range
  },
  REGISTRATION: {
    name: 'Voter Registration',
    columnKey: 'REGISTRATION',
    contactRange: [0.15, 0.25],
    reasonableThreshold: 45,
    costTarget: 0.75,      // $0.75 per attempt (estimated)
    costStdDev: 0.20       // ±$0.20 acceptable range
  },
  TEXT: {
    name: 'Text Banking',
    columnKey: 'TEXT',
    contactRange: [0.05, 0.10],
    reasonableThreshold: 100,
    costTarget: 0.02,      // $0.02 per attempt
    costStdDev: 0.01       // ±$0.01 acceptable range ($0.01 - $0.03)
  },
  MAIL: {
    name: 'Mailers',
    columnKey: 'MAIL',
    contactRange: [1.0, 1.0],  // 100% delivery expected
    reasonableThreshold: 1000,
    costTarget: 0.50,      // $0.50 per mailer (estimated)
    costStdDev: 0.15       // ±$0.15 acceptable range
  }
};

const VOLUNTEER_HOURS_THRESHOLD = 6;

/**
 * Unified tactic class that works for ALL tactic types
 * Configuration is passed via tacticKey parameter
 */
class TacticProgram extends FieldProgram {
  constructor(rowData, tacticKey) {
    const config = TACTIC_CONFIG[tacticKey];
    if (!config) {
      throw new Error(`Invalid tactic key: ${tacticKey}. Valid keys:
        ${Object.keys(TACTIC_CONFIG).join(', ')}`);
    }

    super(rowData, config.columnKey);

    //store configuration
    this._tacticKey = tacticKey;
    this._name = config.name;
    this._contactRange = config.contactRange;
    this._reasonableThreshold = config.reasonableThreshold;
    this._costTarget = config.costTarget;
    this._costStdDev = config.costStdDev;
  }

  //Methods simplified into single series of methods
  /**
   * Uses TACTIC_CONFIG to generate "reasonable" message
   * @returns attemptReasonableMessage result
   */
  attemptReasonable() {
    return this.attemptReasonableMessage(this._reasonableThreshold, this._name);
  }

  /**
   * Uses TACTIC_CONFIG to generate "expected contact" message
   * @returns the results of expectedContactsMessage
   */
  expectedContacts() {
    return this.expectedContactsMessage(this._contactRange, this._name);
  }

  //Getters simplified
  get tacticKey() { return this._tacticKey; }
  get tacticName() { return this._name; }
  get costTarget() { return this._costTarget; }
  get costStdDev() { return this._costStdDev; }

  /**
   * Analyze cost efficiency given a funding amount
   * @param {number} fundingAmount - total funding requested for this tactic
   * @returns {Object} Cost analysis with status and bounds
   */
  analyzeCost(fundingAmount) {
    const programAttempts = this.programAttempts();
    const costPerAttempt = programAttempts > 0 ? fundingAmount / programAttempts : 0;

    const lowerBound = this._costTarget - this._costStdDev;
    const upperBound = this._costTarget + this._costStdDev;

    const status = costPerAttempt <= lowerBound ? 'below' :
                   costPerAttempt >= upperBound ? 'above' : 'within';

    return {
      tacticName: this._name,
      programAttempts: programAttempts,
      fundingAmount: fundingAmount,
      costPerAttempt: costPerAttempt,
      targetCost: this._costTarget,
      lowerBound: lowerBound,
      upperBound: upperBound,
      status: status
    }
  }

    /**
     * Checks whether this tactic's programLength (weeks) aligns with
     * the overall program duration (days)
     * 
     * A mismatch > 14 days suggests the org entered weeks that don't
     * match their state program dates and produces a "Do Not Approve" flag
     * 
     * @param {number|null} programDays - Total program days from FieldPlan.programDays
     * @returns {Object|null} Flag object if mismatch detected, null if aligned or unparseable
     */
  weeksVsDaysCheck(programDays) {
    if (!programDays || !this._programLength) return null;

    const tacticDays = this._programLength * 7;
    const difference = Math.abs(tacticDays - programDays);

    if (difference > 14) {
      return {
        type: 'weeks_vs_days',
        tacticName: this._name,
        tacticWeeks: this._programLength,
        tacticDays: tacticDays,
        programDays: programDays,
        difference: difference
      };
    }

    return null;
  }
}
