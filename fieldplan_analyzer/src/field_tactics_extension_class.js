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
    const context = {
      volunteerHoursFlagged: this._weeklyHours > VOLUNTEER_HOURS_THRESHOLD,
      volunteerHours: this._weeklyHours
    };
    return this.attemptReasonableMessage(this._reasonableThreshold, this._name, context);
  }

  /**
   * Uses TACTIC_CONFIG to generate "expected contact" message
   * @returns the results of expectedContactsMessage
   */
  expectedContacts() {
    const context = {
      volunteerHoursFlagged: this._weeklyHours > VOLUNTEER_HOURS_THRESHOLD,
      volunteerHours: this._weeklyHours
    };
    return this.expectedContactsMessage(this._contactRange, this._name, context);
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

/**
 * Runs the below validation checks across tactics and returns structured flags.
 *
 * Checks performed:
 *   1. Weeks vs Days — tactic programLength*7 vs fieldPlan.programDays
 *   2. Identical/Similar Inputs — 2+ tactics sharing 3 or 4 of their 4 input values
 *   3. Volunteer Hours — any tactic expecting > 6 hrs/week per individual volunteer
 *   4. Weekly Attempts — surfaces per-tactic and total weekly attempts (informational)
 *
 * @param {FieldPlan} fieldPlan - The field plan instance
 * @param {TacticProgram[]} tactics - Array of complete tactic instances
 * @returns {Object} { flags: Array, aggregates: Object }
 */
function analyzeTacticFlags(fieldPlan, tactics) {
  const flags = [];
  if (!tactics || tactics.length === 0) return { flags: flags, aggregates: {} };

  const programDays = fieldPlan.programDays;

  // --- Check 1: Weeks vs Days Alignment ---
  tactics.forEach(tactic => {
    const check = tactic.weeksVsDaysCheck(programDays);
    if (check) {
      flags.push({
        priority: 'high',
        type: 'weeks_vs_days',
        title: `Do Not Approve — ${check.tacticName}: Weeks vs Days Mismatch`,
        description: `${check.tacticName} is set to ${check.tacticWeeks} weeks (${check.tacticDays} days), ` +
          `but the program dates span ${check.programDays} days — a ${check.difference}-day difference. ` +
          `The organization may have entered the wrong program length for this tactic.`,
        tacticName: check.tacticName
      });
    }
  });

  // --- Check 2: Identical / Similar Tactic Inputs ---
  // Compare every pair of tactics on their 4 input values
  const inputKeys = ['programLength', 'weeklyVolunteers', 'weeklyVolunteerHours', 'hourlyAttempts'];

  for (let i = 0; i < tactics.length; i++) {
    for (let j = i + 1; j < tactics.length; j++) {
      const a = tactics[i];
      const b = tactics[j];

      const matches = inputKeys.filter(key => a[key] === b[key]);

      if (matches.length === 4) {
        flags.push({
          priority: 'medium',
          type: 'identical_inputs',
          title: `Review — Identical Inputs: ${a.tacticName} & ${b.tacticName}`,
          description: `${a.tacticName} and ${b.tacticName} have identical values for all 4 tactic inputs ` +
            `(${a.programLength} weeks, ${a.weeklyVolunteers} volunteers, ${a.weeklyVolunteerHours} hrs/wk, ` +
            `${a.hourlyAttempts} attempts/hr). Verify the organization set realistic goals for each tactic individually.`,
          tactics: [a.tacticName, b.tacticName]
        });
      } else if (matches.length === 3) {
        const diffKey = inputKeys.find(key => a[key] !== b[key]);
        const labels = {
          programLength: 'Program Length',
          weeklyVolunteers: 'Weekly Volunteers',
          weeklyVolunteerHours: 'Hours/Week',
          hourlyAttempts: 'Attempts/Hour'
        };

        flags.push({
          priority: 'medium',
          type: 'similar_inputs',
          title: `Review — Near-Identical Inputs: ${a.tacticName} & ${b.tacticName}`,
          description: `${a.tacticName} and ${b.tacticName} share 3 of 4 input values. ` +
            `Only ${labels[diffKey]} differs (${a[diffKey]} vs ${b[diffKey]}). ` +
            `Verify the organization set realistic goals for each tactic individually.`,
          tactics: [a.tacticName, b.tacticName]
        });
      }
    }
  }

  // --- Check 3: Volunteer Hours Reasonableness ---
  // VOLUNTEER_HOURS_THRESHOLD is defined in field_tactics_extension_class.js

  const VOLUNTEER_HOURS_CONFIRM = VOLUNTEER_HOURS_THRESHOLD + 4;

  tactics.forEach(tactic => {
    if (tactic.weeklyVolunteerHours > VOLUNTEER_HOURS_CONFIRM) {
      flags.push({
        priority: 'high',
        type: 'volunteer_hours',
        title: `Confirm — ${tactic.tacticName}: Excessive Volunteer Hours`,
        description: `${tactic.tacticName} expects each volunteer to work ${tactic.weeklyVolunteerHours} hours/week ` +
          `(threshold: ${VOLUNTEER_HOURS_THRESHOLD}). This may indicate the org entered total hours instead of per-volunteer hours.`,
        tacticName: tactic.tacticName,
        hoursPerVolunteer: tactic.weeklyVolunteerHours
      });
    } else if (tactic.weeklyVolunteerHours > VOLUNTEER_HOURS_THRESHOLD) {
      flags.push({
        priority: 'medium',
        type: 'volunteer_hours',
        title: `Review — ${tactic.tacticName}: High Volunteer Hours`,
        description: `${tactic.tacticName} expects each volunteer to work ${tactic.weeklyVolunteerHours} hours/week ` +
          `(recommended max: ${VOLUNTEER_HOURS_THRESHOLD}). Verify this is per-volunteer and not total hours.`,
        tacticName: tactic.tacticName,
        hoursPerVolunteer: tactic.weeklyVolunteerHours
      });
    }
  });

  // --- Aggregates (Check 3 continued + Check 4) ---
  const totalWeeklyVolunteers = tactics.reduce((sum, t) => sum + t.weeklyVolunteers, 0);
  const totalWeeklyVolunteerHours = tactics.reduce((sum, t) => sum + t.weekVolunteerHours(), 0);
  const totalProgramVolunteerHours = tactics.reduce((sum, t) => sum + t.programVolunteerHours(), 0);
  const totalWeeklyAttempts = tactics.reduce((sum, t) => sum + t.weeklyAttempts(), 0);
  const totalProgramAttempts = tactics.reduce((sum, t) => sum + t.programAttempts(), 0);
  const fteEquivalent = (totalWeeklyVolunteerHours / 40).toFixed(1);

  const aggregates = {
    totalWeeklyVolunteers: totalWeeklyVolunteers,
    totalWeeklyVolunteerHours: totalWeeklyVolunteerHours,
    totalProgramVolunteerHours: totalProgramVolunteerHours,
    totalWeeklyAttempts: totalWeeklyAttempts,
    totalProgramAttempts: totalProgramAttempts,
    fteEquivalent: fteEquivalent
  };

  return { flags: flags, aggregates: aggregates };
}

