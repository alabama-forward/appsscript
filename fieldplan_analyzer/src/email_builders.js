// All email composition and HTML generation functions.
// When email format needs to change, edit this file.

const EMAIL_COLORS = {
  primary: '#363d4a',       // Alabama Forward navy
  secondary: '#b53d1a',     // Alabama Forward rust
  accent: '#FF6B35',        // Alert/warning color
  text: '#202124',          // Material primary text
  textLight: '#5F6368',     // Material secondary text
  background: '#FFFFFF',    // White page background
  white: '#FFFFFF',         // Card background
  border: '#E0E0E0',       // Material border
  surface: '#F8F9FA',      // Card/row background
  divider: '#DADCE0',      // Section dividers
  success: '#1E8E3E',       // Material green
  warning: '#F9AB00',       // Material amber
  danger: '#D93025'         // Material red
};

function buildTestModeBanner() {
  return '<div style="background-color:#FFFFCC;padding:12px 20px;border:2px solid #FFC107;margin:0;text-align:center;font-size:14px;font-weight:bold;color:#856404;">' +
    'TEST MODE EMAIL - This is a test email sent only to datateam@alforward.org</div>';
}

function buildEmailShell(title, subtitle, contentRows, colors) {
  return '<!DOCTYPE html>' +
    '<html lang="en"><head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>' + title + '</title>' +
    '</head>' +
    '<body style="margin:0;padding:0;font-family:Arial,sans-serif;font-size:16px;line-height:1.6;color:' + colors.text + ';background-color:' + colors.background + ';">' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:' + colors.background + ';">' +
    '<tr><td style="padding:20px 0;">' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin:0 auto;background-color:' + colors.white + ';border:1px solid ' + colors.divider + ';border-radius:8px;max-width:600px;">' +
    '<tr><td style="background-color:' + colors.secondary + ';padding:24px;text-align:center;border-radius:8px 8px 0 0;">' +
    '<p style="margin:0 0 8px 0;font-size:14px;color:#FFFFFF;">' + title + '</p>' +
    (subtitle ? '<h1 style="margin:0;font-size:24px;font-weight:bold;color:#FFFFFF;">' + subtitle + '</h1>' : '') +
    '</td></tr>' +
    contentRows +
    buildEmailFooter(colors) +
    '</table>' +
    '</td></tr></table>' +
    '</body></html>';
}

/**
 * Builds the complete field plan notification email HTML.
 *
 * Assembles all sections: header, summary, stats, contact, program details,
 * geography, demographics, tactics, confidence, action items, and footer.
 *
 * @param {FieldPlan} fieldPlan - A FieldPlan instance with all 2026 fields
 * @param {TacticProgram[]} tactics - Array of TacticProgram instances from getTacticInstances()
 * @returns {string} Complete HTML email ready for MailApp.sendEmail({ htmlBody: ... })
 */
function buildFieldPlanEmailHTML(fieldPlan, tactics) {
  tactics = tactics || [];

  const colors = EMAIL_COLORS;

  const html = '<!DOCTYPE html>' +
    '<html lang="en"><head>' +
    '<meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    '<title>Field Plan: ' + (fieldPlan.memberOrgName || 'Submission') + '</title>' +
    '</head>' +
    '<body style="margin:0;padding:0;font-family:Arial,sans-serif;font-size:16px;line-height:1.6;color:' + colors.text + ';background-color:' + colors.background + ';">' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:' + colors.background + ';">' +
    '<tr><td style="padding:20px 0;">' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="margin:0 auto;background-color:' + colors.white + ';border:1px solid ' + colors.divider + ';border-radius:8px;max-width:600px;">' +
    buildEmailHeader(fieldPlan, colors) +
    buildOrgSummaryCard(fieldPlan, colors) +
    buildQuickStatsGrid(fieldPlan, tactics, colors) +
    buildActionItemsSection(fieldPlan, tactics, colors) +
    buildTacticsSection(fieldPlan, tactics, colors) +
    buildContactSection(fieldPlan, colors) +
    buildConfidenceSection(fieldPlan, colors) +
    buildProgramDetailsSection(fieldPlan, colors) +
    buildNarrativeSection(fieldPlan, colors) +
    buildGeographicSection(fieldPlan, colors) +
    buildDemographicsSection(fieldPlan, colors) +
    buildEmailFooter(colors) +
    '</table>' +
    '</td></tr></table>' +
    '</body></html>';

  return html;
}

function buildEmailHeader(fieldPlan, colors) {
  const trained = fieldPlan.attendedTraining &&
    fieldPlan.attendedTraining.toString().toLowerCase().indexOf('yes') !== -1;
  const badgeColor = trained ? colors.success : colors.warning;
  const badgeText = trained ? 'TRAINED' : 'NEEDS TRAINING';

  return '<tr><td style="background-color:' + colors.secondary + ';padding:24px;text-align:center;border-radius:8px 8px 0 0;">' +
    '<p style="margin:0 0 8px 0;font-size:14px;color:#FFFFFF;">New Field Plan Submission</p>' +
    '<h1 style="margin:0 0 12px 0;font-size:24px;font-weight:bold;color:#FFFFFF;">' + (fieldPlan.memberOrgName || 'Unknown Organization') + '</h1>' +
    '<span style="display:inline-block;background-color:' + badgeColor + ';color:#FFFFFF;padding:4px 12px;border-radius:12px;font-size:12px;font-weight:bold;">' + badgeText + '</span>' +
    '</td></tr>';
}

function buildOrgSummaryCard(fieldPlan, colors) {
  let dateStr = 'Not available';
  if (fieldPlan.submissionDateTime) {
    try {
      dateStr = new Date(fieldPlan.submissionDateTime).toLocaleString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });
    } catch (e) { dateStr = fieldPlan.submissionDateTime.toString(); }
  }

  return '<tr><td style="padding:20px 30px;">' +
    '<div style="background-color:' + colors.surface + ';border-left:4px solid ' + colors.primary + ';padding:15px;border-radius:4px;">' +
    '<p style="margin:0 0 4px 0;font-size:12px;color:' + colors.textLight + ';text-transform:uppercase;font-weight:bold;">Submitted</p>' +
    '<p style="margin:0;font-size:15px;color:' + colors.text + ';">' + dateStr + '</p>' +
    '</div></td></tr>';
}

function buildQuickStatsGrid(fieldPlan, tactics, colors) {
  const totalCounties = (fieldPlan.fieldCounties && Array.isArray(fieldPlan.fieldCounties)) ? fieldPlan.fieldCounties.length : 0;
  const totalTactics = tactics.length;
  let totalReachLow = 0;
  let totalReachHigh = 0;
  for (let t = 0; t < tactics.length; t++) {
    const attempts = tactics[t].programAttempts();
    const range = tactics[t]._contactRange;
    if (attempts && range && range.length === 2) {
      totalReachLow += Math.round(attempts * range[0]);
      totalReachHigh += Math.round(attempts * range[1]);
    }
  }
  const reachDisplay = (totalReachLow > 0) ? totalReachLow.toLocaleString() + ' - ' + totalReachHigh.toLocaleString() : 'N/A';

  const confScores = [fieldPlan.confidenceReasonable, fieldPlan.confidenceData, fieldPlan.confidencePlan,
    fieldPlan.confidenceCapacity, fieldPlan.confidenceSkills, fieldPlan.confidenceGoals]
    .filter(function(s) { return s && !isNaN(s); });
  const avgConf = confScores.length > 0
    ? (confScores.reduce(function(a, b) { return a + Number(b); }, 0) / confScores.length).toFixed(1)
    : 'N/A';

  // Compute validation aggregates for the summary
  const analysis = analyzeTacticFlags(fieldPlan, tactics);
  const agg = analysis.aggregates;
  const weeklyAttemptsDisplay = agg.totalWeeklyAttempts ? agg.totalWeeklyAttempts.toLocaleString() : 'N/A';
  const weeklyVolHoursDisplay = agg.totalWeeklyVolunteerHours ? agg.totalWeeklyVolunteerHours.toLocaleString() : 'N/A';

  // Determine stat cell colors based on flags — flagged stats use the flag's
  // unflagged stats default to success (approval green)
  const flagPriorityColors = { high: colors.danger, medium: colors.warning };

  function flagColorForType(type) {
    const flag = analysis.flags.find(function(f) { return f.type === type; });
    return flag ? (flagPriorityColors[flag.priority] || colors.success) : colors.success;
  }

  const volunteerHoursColor = flagColorForType('volunteer_hours');
  const weeksVsDaysColor = flagColorForType('weeks_vs_days');

  // Est. Reach depends on both volunteer hours and weeks/days — use the worst color
  const reachColor = (weeksVsDaysColor === colors.danger || volunteerHoursColor === colors.danger)
    ? colors.danger
    : (weeksVsDaysColor === colors.warning || volunteerHoursColor === colors.warning)
      ? colors.warning
      : colors.success;

  function statCell(label, value, color) {
    return '<td style="background-color:' + colors.white + ';border-radius:8px;padding:15px;text-align:center;border:1px solid ' + colors.divider + ';border-bottom:2px solid ' + color + ';width:50%;">' +
      '<div style="font-size:28px;font-weight:bold;color:' + color + ';margin-bottom:4px;">' + value + '</div>' +
      '<div style="font-size:11px;color:' + colors.textLight + ';text-transform:uppercase;font-weight:bold;">' + label + '</div></td>';
  }

  return '<tr><td style="padding:0 30px 25px 30px;">' +
    buildSectionHeader('Quick Overview', colors) +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">' +
    '<tr><td colspan="3" style="background-color:' + colors.white + ';border-radius:8px;padding:15px;text-align:center;border:1px solid ' + colors.divider + ';border-bottom:2px solid ' + reachColor + ';">' +
    '<div style="font-size:28px;font-weight:bold;color:' + reachColor + ';margin-bottom:4px;">' + reachDisplay + '</div>' +
    '<div style="font-size:11px;color:' + colors.textLight + ';text-transform:uppercase;font-weight:bold;">Estimated Reach</div></td></tr>' +
    '<tr><td colspan="3" style="height:10px;"></td></tr>' +
    '<tr>' + statCell('Counties', totalCounties, colors.success) + '<td style="width:10px;"></td>' + statCell('Tactics', totalTactics, colors.success) + '</tr>' +
    '<tr><td colspan="3" style="height:10px;"></td></tr>' +
    '<tr>' + statCell('Confidence', avgConf, colors.success) + '<td style="width:10px;"></td>' + statCell('Volunteers', agg.totalWeeklyVolunteers || 'N/A', volunteerHoursColor) + '</tr>' +
    '<tr><td colspan="3" style="height:10px;"></td></tr>' +
    '<tr>' + statCell('Weekly Attempts', weeklyAttemptsDisplay, weeksVsDaysColor) + '<td style="width:10px;"></td>' + statCell('Weekly Vol. Hours', weeklyVolHoursDisplay, volunteerHoursColor) + '</tr>' +
    '</table></td></tr>';
}

function buildContactSection(fieldPlan, colors) {
  return '<tr><td style="padding:0 30px 25px 30px;">' +
    buildSectionHeader('Contact Information', colors) +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">' +
    buildInfoRow('Name', (fieldPlan.firstName || '') + ' ' + (fieldPlan.lastName || ''), colors) +
    buildInfoRow('Email', fieldPlan.contactEmail || 'Not provided', colors) +
    buildInfoRow('Phone', fieldPlan.contactPhone || 'Not provided', colors) +
    '</table></td></tr>';
}

function buildProgramDetailsSection(fieldPlan, colors) {
  return '<tr><td style="padding:0 30px 25px 30px;">' +
    buildSectionHeader('Program Details', colors) +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">' +
    buildInfoRow('Data Storage', formatArray(fieldPlan.dataStorage), colors) +
    buildInfoRow('Program Tools', formatArray(fieldPlan.programTools), colors) +
    buildInfoRow('Program Dates', fieldPlan.programDates || 'Not specified', colors) +
    buildInfoRow('Program Types', formatArray(fieldPlan.programTypes), colors) +
    buildInfoRow('VAN Committee', formatArray(fieldPlan.vanCommittee), colors) +
    buildInfoRow('Data Sharing', fieldPlan.dataShare || 'Not specified', colors) +
    '</table></td></tr>';
}

function buildNarrativeSection(fieldPlan, colors) {
  const narrative = fieldPlan.fieldNarrative;
  if (!narrative) {
    return '<tr><td style="padding:0 30px 25px 30px;">' +
      buildSectionHeader('Field Program Narrative', colors) +
      '<p style="color:' + colors.textLight + ';font-style:italic;">No narrative was provided.</p>' +
      '</td></tr>';
  }

  const formatted = narrative.toString().replace(/\n/g, '<br>');

  return '<tr><td style="padding:0 30px 25px 30px;">' +
    buildSectionHeader('Field Program Narrative', colors) +
    '<div style="background-color:' + colors.surface + ';border-left:4px solid ' + colors.primary + ';padding:15px;border-radius:4px;">' +
    '<p style="margin:0;font-size:14px;color:' + colors.text + ';line-height:1.6;">' + formatted + '</p>' +
    '</div></td></tr>';
}

function buildGeographicSection(fieldPlan, colors) {
  return '<tr><td style="padding:0 30px 25px 30px;">' +
    buildSectionHeader('Geographic Targeting', colors) +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">' +
    buildInfoRow('Counties', formatArray(fieldPlan.fieldCounties), colors) +
    buildInfoRow('Cities', formatArray(fieldPlan.cities), colors) +
    buildInfoRow('Precincts', formatArray(fieldPlan.fieldPrecincts), colors) +
    buildInfoRow('Special Areas', formatArray(fieldPlan.specialGeo), colors) +
    buildInfoRow('Knows Precincts', fieldPlan.knowsPrecincts || 'Not specified', colors) +
    buildInfoRow('Willing to Work Different Precincts', fieldPlan.diffPrecincts || 'Not specified', colors) +
    '</table></td></tr>';
}

function buildDemographicsSection(fieldPlan, colors) {
  let rows = buildInfoRow('Race/Ethnicity', formatArray(fieldPlan.demoRace), colors) +
    buildInfoRow('Age Groups', formatArray(fieldPlan.demoAge), colors) +
    buildInfoRow('Gender/Sexuality', formatArray(fieldPlan.demoGender), colors) +
    buildInfoRow('Affinity Groups', formatArray(fieldPlan.demoAffinity), colors);
  if (fieldPlan.demoNotes) {
    rows += buildInfoRow('Additional Notes', fieldPlan.demoNotes, colors);
  }

  return '<tr><td style="padding:0 30px 25px 30px;">' +
    buildSectionHeader('Target Demographics', colors) +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">' +
    rows + '</table></td></tr>';
}

/**
 * Builds the tactics analysis section.
 *
 * Uses the unified TacticProgram class methods:
 * - tactic.tacticName (display name from TACTIC_CONFIG)
 * - tactic.tacticKey (e.g., 'PHONE', 'DOOR')
 * - tactic.programLength, weeklyVolunteers, weeklyVolunteerHours, hourlyAttempts
 * - tactic.programVolunteerHours(), programAttempts(), weeklyAttempts()
 * - tactic.attemptReasonable() — generic message for all tactic types
 * - tactic.expectedContacts() — generic message for all tactic types
 *
 * @param {TacticProgram[]} tactics - Array from getTacticInstances()
 * @param {Object} colors
 * @returns {string} HTML table row
 */
function buildTacticsSection(fieldPlan, tactics, colors) {
  let html = '<tr><td style="padding:0 30px 25px 30px;">' +
    buildSectionHeader('Field Tactics Analysis', colors);

  // No tactic data at all — should not happen, flag loudly
  if (!tactics || (tactics.length === 0 && (!tactics.incomplete || tactics.incomplete.length === 0))) {
    const noTacticsWarning = tactics && tactics.noTacticsAtAll
      ? 'This field plan was submitted with no tactic goals. This should not be possible — please follow up with the organization.'
      : 'No field tactics were specified in this plan.';

    html += '<div style="background-color:' + colors.white + ';border-left:4px solid ' + colors.danger + ';padding:15px;border-radius:4px;">' +
      '<p style="margin:0;font-weight:bold;color:' + colors.danger + ';">' + noTacticsWarning + '</p></div>';

    html += '</td></tr>';
    return html;
  }

  // Render complete tactics with per-tactic validation flags
  const programDays = fieldPlan ? fieldPlan.programDays : null;

  for (let i = 0; i < tactics.length; i++) {
    const tactic = tactics[i];
    const mt = (i === 0) ? '0' : '20px';

    // Collect per-tactic flags
    const tacticFlags = [];
    const wvdCheck = tactic.weeksVsDaysCheck(programDays);
    if (wvdCheck) {
      tacticFlags.push('Weeks vs Days mismatch: ' + wvdCheck.tacticWeeks + ' weeks (' + wvdCheck.tacticDays + ' days) vs ' + wvdCheck.programDays + ' program days (' + wvdCheck.difference + '-day difference)');
    }
    if (tactic.weeklyVolunteerHours > VOLUNTEER_HOURS_THRESHOLD) {
      tacticFlags.push('Excessive volunteer hours: ' + tactic.weeklyVolunteerHours + ' hrs/week per volunteer (max recommended: ' + VOLUNTEER_HOURS_THRESHOLD + ')');
    }

    // Per-tactic badge
    let badgeText, badgeColor;
    if (wvdCheck) {
      badgeText = 'REJECT';
      badgeColor = colors.danger;
    } else if (tactic.weeklyVolunteerHours > VOLUNTEER_HOURS_THRESHOLD + 4) {
      badgeText = 'NEEDS EDITS';
      badgeColor = colors.danger;
    } else if (tactic.weeklyVolunteerHours > VOLUNTEER_HOURS_THRESHOLD) {
      badgeText = 'REVIEW';
      badgeColor = colors.warning;
    } else {
      badgeText = 'APPROVE';
      badgeColor = colors.success;
    }

    // Determine border color: red if flags, default secondary otherwise
    const borderColor = tacticFlags.length > 0 ? colors.danger : colors.secondary;

    html += '<div style="background-color:' + colors.surface + ';border-radius:8px;padding:20px;margin-top:' + mt + ';border-top:2px solid ' + borderColor + ';">' +
      '<h3 style="margin:0 0 12px 0;font-size:18px;font-weight:bold;color:' + colors.text + ';">' + tactic.tacticName +
      ' <span style="display:inline-block;background-color:' + badgeColor + ';color:#FFFFFF;padding:2px 10px;border-radius:10px;font-size:11px;font-weight:bold;margin-left:8px;text-transform:uppercase;">' + badgeText + '</span></h3>' +
      '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">' +
      '<tr><td style="padding:6px 0;width:50%;"><strong>Program Length:</strong> ' + tactic.programLength + ' weeks</td>' +
      '<td style="padding:6px 0;"><strong>Weekly Volunteers:</strong> ' + tactic.weeklyVolunteers + '</td></tr>' +
      '<tr><td style="padding:6px 0;"><strong>Hours/Week (per volunteer):</strong> ' + tactic.weeklyVolunteerHours + '</td>' +
      '<td style="padding:6px 0;"><strong>Attempts/Hour:</strong> ' + tactic.hourlyAttempts + '</td></tr>' +
      '</table>';

    // Per-tactic flags (if any)
    if (tacticFlags.length > 0) {
      html += '<div style="background-color:' + colors.white + ';border-left:4px solid ' + colors.danger + ';padding:10px 12px;margin-top:12px;border-radius:4px;">';
      for (let f = 0; f < tacticFlags.length; f++) {
        html += '<p style="margin:' + (f === 0 ? '0' : '6px 0 0 0') + ';font-size:13px;color:' + colors.danger + ';font-weight:bold;">' + tacticFlags[f] + '</p>';
      }
      html += '</div>';
    }

    // Volunteer hours breakdown
    html += '<div style="background-color:' + colors.white + ';border-radius:4px;padding:12px;margin-top:12px;border-top:1px solid ' + colors.divider + ';">' +
      '<p style="margin:0 0 8px 0;font-weight:bold;color:' + colors.primary + ';">Volunteer Hours</p>' +
      '<p style="margin:0 0 4px 0;font-size:14px;"><strong>Per Volunteer:</strong> ' + tactic.weeklyVolunteerHours + ' hrs/week</p>' +
      '<p style="margin:0 0 4px 0;font-size:14px;"><strong>Total Weekly:</strong> ' + tactic.weekVolunteerHours() + ' hrs/week (' + tactic.weeklyVolunteers + ' volunteers × ' + tactic.weeklyVolunteerHours + ' hrs)</p>' +
      '<p style="margin:0;font-size:14px;"><strong>Entire Program:</strong> ' + tactic.programVolunteerHours().toLocaleString() + ' hrs (' + tactic.programLength + ' weeks)</p>' +
      '</div>';

    // Projections + weekly attempts
    html += '<div style="background-color:' + colors.white + ';border-radius:4px;padding:12px;margin-top:12px;border-top:1px solid ' + colors.divider + ';">' +
      '<p style="margin:0 0 8px 0;font-weight:bold;color:' + colors.primary + ';">Projections</p>';

    // Projection warning banner when volunteer hours are flagged
    if (tactic.weeklyVolunteerHours > VOLUNTEER_HOURS_THRESHOLD) {
      html += '<div style="background-color:#FFF8E1;border-left:4px solid ' + colors.warning + ';padding:8px 12px;margin-bottom:10px;border-radius:4px;">' +
        '<p style="margin:0;font-size:13px;font-weight:bold;color:' + colors.warning + ';">' +
        '\u26A0 These projections are based on ' + tactic.weeklyVolunteerHours + ' volunteer hours/week, which exceeds the ' + VOLUNTEER_HOURS_THRESHOLD + ' hr/week threshold. Actual results may differ significantly.</p></div>';
    }

    html += '<p style="margin:0 0 4px 0;font-size:14px;"><strong>Weekly Attempts:</strong> ' + tactic.weeklyAttempts().toLocaleString() + '</p>' +
      '<p style="margin:0 0 4px 0;font-size:14px;"><strong>Total Attempts:</strong> ' + tactic.programAttempts().toLocaleString() + '</p>' +
      '<p style="margin:0 0 4px 0;font-size:14px;">' + tactic.attemptReasonable() + '</p>' +
      '<p style="margin:0;font-size:14px;">' + tactic.expectedContacts() + '</p>' +
      '</div></div>';
  }

  // Render incomplete tactics with a warning
  if (tactics.incomplete && tactics.incomplete.length > 0) {
    html += '<div style="background-color:' + colors.white + ';border-left:4px solid ' + colors.warning + ';padding:15px;border-radius:4px;margin-top:20px;">' +
      '<p style="margin:0 0 10px 0;font-weight:bold;color:' + colors.text + ';">Incomplete Tactic Goals</p>' +
      '<p style="margin:0 0 12px 0;font-size:14px;color:' + colors.textLight + ';">The following tactics had partial data submitted. Analysis could not be completed because missing fields prevent calculating projections. Follow up with the organization to complete these goals.</p>';

    for (let j = 0; j < tactics.incomplete.length; j++) {
      const inc = tactics.incomplete[j];
      html += '<div style="background-color:' + colors.white + ';border-radius:4px;padding:10px 12px;margin-top:8px;">' +
        '<p style="margin:0 0 4px 0;font-weight:bold;font-size:14px;color:' + colors.text + ';">' + inc.tacticName + '</p>' +
        '<p style="margin:0;font-size:13px;color:' + colors.danger + ';">Missing: ' + inc.missingFields.join(', ') + '</p>' +
        '</div>';
    }

    html += '</div>';
  }

  html += '</td></tr>';
  return html;
}

function buildConfidenceSection(fieldPlan, colors) {
  const scores = [
    { label: 'Meets Expectations', value: fieldPlan.confidenceReasonable },
    { label: 'Data & Technology', value: fieldPlan.confidenceData },
    { label: 'Plan Quality', value: fieldPlan.confidencePlan },
    { label: 'Staff Capacity', value: fieldPlan.confidenceCapacity },
    { label: 'Tactic Skills', value: fieldPlan.confidenceSkills },
    { label: 'Meeting Goals', value: fieldPlan.confidenceGoals }
  ];

  const validScores = scores.filter(function(s) { return s.value && !isNaN(s.value); });
  const avgScore = validScores.length > 0
    ? (validScores.reduce(function(sum, s) { return sum + Number(s.value); }, 0) / validScores.length).toFixed(1)
    : 0;
  const needsCoaching = avgScore < 6;
  const coachingColor = needsCoaching ? colors.danger : colors.success;

  let html = '<tr><td style="padding:0 30px 25px 30px;">' +
    buildSectionHeader('Confidence Assessment', colors) +
    '<div style="background-color:' + colors.white + ';border-left:4px solid ' + coachingColor + ';padding:12px;border-radius:4px;margin-bottom:15px;">' +
    '<p style="margin:0 0 4px 0;font-weight:bold;color:' + colors.text + ';">' + (needsCoaching ? 'Coaching Recommended' : 'Confident in Plan') + '</p>' +
    '<p style="margin:0;font-size:14px;color:' + colors.text + ';">' + fieldPlan.needsCoaching() + '</p></div>';

  // Progress bars for each score
  for (let i = 0; i < scores.length; i++) {
    const score = Number(scores[i].value) || 0;
    const pct = (score / 10) * 100;
    const barColor = score >= 8 ? colors.success : score >= 6 ? colors.warning : colors.danger;

    html += '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:12px;">' +
      '<tr><td style="font-size:13px;font-weight:bold;color:' + colors.text + ';padding-bottom:4px;">' + scores[i].label + '</td>' +
      '<td style="font-size:13px;font-weight:bold;color:' + barColor + ';text-align:right;padding-bottom:4px;">' + score + '/10</td></tr>' +
      '<tr><td colspan="2">' +
      '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"><tr>' +
      '<td style="width:' + pct + '%;height:8px;background-color:' + barColor + ';border-radius:4px 0 0 4px;"></td>' +
      '<td style="width:' + (100 - pct) + '%;height:8px;background-color:' + colors.border + ';border-radius:0 4px 4px 0;"></td>' +
      '</tr></table></td></tr></table>';
  }

  // Average score display
  html += '<div style="text-align:center;margin-top:15px;padding:18px;">' +
    '<p style="margin:0 0 5px 0;font-size:12px;color:' + colors.textLight + ';text-transform:uppercase;font-weight:bold;">Average Confidence Score</p>' +
    '<p style="margin:0;font-size:36px;font-weight:bold;color:' + coachingColor + ';">' + avgScore + '/10</p></div>' +
    '</td></tr>';
  return html;
}

function buildActionItemsSection(fieldPlan, tactics, colors) {
  // --- Analyze flags first so severity is known before building the list ---
  const analysis = analyzeTacticFlags(fieldPlan, tactics || []);
  const hasHighPriorityFlags = analysis.flags.some(function(flag) { return flag.priority === 'high'; });
  const hasMediumPriorityFlags = analysis.flags.some(function(flag) { return flag.priority === 'medium'; });
  const hasBlockingTacticIssues = tactics && (tactics.noTacticsAtAll || (tactics.incomplete && tactics.incomplete.length > 0));
  const hasAnyFlags = hasBlockingTacticIssues || hasHighPriorityFlags || hasMediumPriorityFlags;

  // --- Build actions top-down in display order ---
  const actions = [];

  // 1. Approval recommendation and follow-up — always first
  if (hasBlockingTacticIssues || hasHighPriorityFlags) {
    actions.push({ priority: 'high', title: 'Significant Concerns', description: 'This field plan has issues that should be resolved before approval. Review the flagged items below and follow up with the organization.' });
  } else if (hasMediumPriorityFlags) {
    actions.push({ priority: 'medium', title: 'Some Concerns', description: 'This field plan has items that warrant review. Verify the flagged items below before approving.' });
  } else {
    actions.push({ priority: 'low', title: 'Review and Approve', description: 'Review field plan details and approve or request revisions.' });
  }

  actions.push({ priority: hasAnyFlags ? 'high' : 'low', title: 'Follow Up', description: 'Schedule a check-in call to discuss the field plan.' });

  // 2. Tactic goal issues — these block approval
  if (tactics && tactics.noTacticsAtAll) {
    actions.push({ priority: 'high', title: 'Do Not Approve — No Tactic Goals', description: 'This field plan was submitted with zero tactic goals. This should not be possible. Reach out to the organization to complete their goals before approving.' });
  } else if (tactics && tactics.incomplete && tactics.incomplete.length > 0) {
    const missingNames = tactics.incomplete.map(function(t) { return t.tacticName; }).join(', ');
    actions.push({ priority: 'high', title: 'Do Not Approve — Incomplete Tactic Goals', description: 'The following tactics have missing data and cannot be analyzed: ' + missingNames + '. Reach out to the organization to complete these goals before approving.' });
  }

  // 3. Validation check flags — grouped by type
  const FLAG_GROUP_TITLES = {
    weeks_vs_days: 'Weeks vs Days Mismatch',
    identical_inputs: 'Identical Tactic Inputs',
    similar_inputs: 'Near-Identical Tactic Inputs',
    volunteer_hours: 'Volunteer Hours Concern'
  };

  const groupedFlags = analysis.flags.reduce(function(groups, flag) {
    if (!groups[flag.type]) {
      groups[flag.type] = { flags: [], highestPriority: flag.priority };
    }
    groups[flag.type].flags.push(flag);
    if (flag.priority === 'high') {
      groups[flag.type].highestPriority = 'high';
    }
    return groups;
  }, {});

  Object.keys(groupedFlags).forEach(function(type) {
    const group = groupedFlags[type];
    const groupTitle = FLAG_GROUP_TITLES[type] || type;
    const description = (group.flags.length === 1)
      ? group.flags[0].description
      : '<ul style="margin:4px 0;padding-left:20px;">' +
        group.flags.map(function(f) { return '<li style="margin:2px 0;">' + f.description + '</li>'; }).join('') +
        '</ul>';

    actions.push({ priority: group.highestPriority, title: groupTitle, description: description });
  });

  // 4. Training, coaching, and coordination items
  if (!fieldPlan.attendedTraining || fieldPlan.attendedTraining.toString().toLowerCase().indexOf('yes') === -1) {
    actions.push({ priority: 'high', title: 'Schedule Training', description: 'Organization has not attended field planning training.' });
  }

  const confScores = [fieldPlan.confidenceReasonable, fieldPlan.confidenceData, fieldPlan.confidencePlan,
    fieldPlan.confidenceCapacity, fieldPlan.confidenceSkills, fieldPlan.confidenceGoals]
    .filter(function(s) { return s && !isNaN(s); });
  if (confScores.length > 0) {
    const avg = confScores.reduce(function(a, b) { return a + Number(b); }, 0) / confScores.length;
    if (avg < 6) actions.push({ priority: 'high', title: 'Provide Coaching', description: 'Low confidence scores (avg ' + avg.toFixed(1) + '/10) indicate coaching need.' });
  }

  if (fieldPlan.runningForOffice && fieldPlan.runningForOffice.toString().toLowerCase().indexOf('yes') !== -1) {
    actions.push({ priority: 'medium', title: 'Review Coordination Rules', description: 'Someone in this organization is running for office.' });
  }
  
  const pColors = { high: colors.danger, medium: colors.warning, low: colors.success };

  let html = '<tr><td style="padding:0 30px 25px 30px;">' + buildSectionHeader('Action Items', colors);

  for (let i = 0; i < actions.length; i++) {
    const a = actions[i];
    const mt = i === 0 ? '0' : '16px';
    const pc = pColors[a.priority] || colors.textLight;

    html += '<div style="background-color:' + colors.white + ';border-left:4px solid ' + pc + ';padding:12px 15px;border-radius:4px;margin-top:' + mt + ';">' +
      '<p style="margin:0 0 4px 0;font-weight:bold;color:' + colors.text + ';font-size:15px;">' + a.title +
      ' <span style="display:inline-block;background-color:' + pc + ';color:#FFFFFF;padding:2px 8px;border-radius:10px;font-size:11px;margin-left:6px;text-transform:uppercase;font-weight:bold;">' + a.priority + '</span></p>' +
      '<p style="margin:0;font-size:13px;color:' + colors.textLight + ';">' + a.description + '</p></div>';
  }

  html += '</td></tr>';
  return html;
}

function buildEmailFooter(colors) {
  return '<tr><td style="background-color:' + colors.white + ';padding:25px 30px;text-align:center;border-radius:0 0 8px 8px;border-top:1px solid ' + colors.divider + ';">' +
    '<p style="margin:0 0 8px 0;font-size:14px;color:' + colors.textLight + ';font-weight:bold;">Alabama Forward Field Planning System</p>' +
    '<p style="margin:0 0 12px 0;font-size:12px;color:' + colors.textLight + ';">This email was automatically generated when a new field plan was submitted.</p>' +
    '<p style="margin:0;font-size:12px;"><a href="mailto:datateam@alforward.org" style="color:' + colors.primary + ';text-decoration:none;font-weight:bold;">Contact Data Team</a></p>' +
    '</td></tr>';
}

function formatArray(arr) {
  if (!arr) return 'None specified';

  // Normalize to a flat array — handles arrays, newline-separated strings, and plain strings
  const values = [];
  if (Array.isArray(arr)) {
    for (let i = 0; i < arr.length; i++) {
      const val = arr[i].toString().trim();
      if (val.indexOf('\n') !== -1) {
        const parts = val.split('\n');
        for (let j = 0; j < parts.length; j++) {
          const p = parts[j].trim();
          if (p) values.push(p);
        }
      } else if (val) {
        values.push(val);
      }
    }
  } else {
    const str = arr.toString().trim();
    if (!str) return 'None specified';
    if (str.indexOf('\n') !== -1) {
      const parts = str.split('\n');
      for (let k = 0; k < parts.length; k++) {
        const p = parts[k].trim();
        if (p) values.push(p);
      }
    } else {
      return str;
    }
  }

  if (values.length === 0) return 'None specified';
  if (values.length === 1) return values[0];

  let items = '';
  for (let m = 0; m < values.length; m++) {
    items += '<li style="margin:2px 0;">' + values[m] + '</li>';
  }
  return '<ul style="margin:4px 0;padding-left:20px;list-style-type:disc;">' + items + '</ul>';
}

function buildSectionHeader(title, colors) {
  return '<h2 style="margin:0 0 18px 0;font-size:12px;font-weight:bold;color:' + colors.secondary + ';text-transform:uppercase;letter-spacing:0.8px;padding-bottom:10px;border-bottom:1px solid ' + colors.divider + ';">' + title + '</h2>';
}

function buildInfoRow(label, value, colors) {
  return '<tr><td style="padding:12px 0;border-bottom:1px solid ' + colors.divider + ';">' +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"><tr>' +
    '<td style="vertical-align:top;width:40%;padding-right:10px;">' +
    '<strong style="font-size:13px;color:' + colors.textLight + ';">' + label + '</strong></td>' +
    '<td style="vertical-align:top;width:60%;">' +
    '<span style="font-size:14px;color:' + colors.text + ';line-height:1.5;">' + (value || 'Not specified') + '</span></td>' +
    '</tr></table></td></tr>';
}

function buildAlertEmailHTML(title, orgName, bodyLines, borderColor, colors) {
  colors = colors || EMAIL_COLORS;
  borderColor = borderColor || colors.warning;

  let alertContent = '<tr><td style="padding:25px 30px;">' +
    '<div style="background-color:' + colors.surface + ';border-left:4px solid ' + borderColor + ';padding:20px;border-radius:4px;">' +
    '<p style="margin:0 0 8px 0;font-size:16px;font-weight:bold;color:' + colors.text + ';">' + (orgName || 'Unknown Organization') + '</p>';

  for (let i = 0; i < bodyLines.length; i++) {
    alertContent += '<p style="margin:8px 0 0 0;font-size:14px;color:' + colors.textLight + ';line-height:1.5;">' + bodyLines[i] + '</p>';
  }

  alertContent += '</div></td></tr>' +
    '<tr><td style="padding:0 30px 25px 30px;">' +
    '<div style="background-color:' + colors.surface + ';border-radius:8px;padding:15px 20px;text-align:center;">' +
    '<p style="margin:0;font-size:14px;color:' + colors.text + ';">Please follow up with the organization.</p>' +
    '</div></td></tr>';

  return buildEmailShell(title, orgName, alertContent, colors);
}

function buildBudgetAnalysisEmailHTML(budget, fieldPlan, analysis, colors) {
  colors = colors || EMAIL_COLORS;
  const orgName = budget.memberOrgName || 'Unknown Organization';

  // Status badge colors
  const statusColors = { within: colors.success, below: colors.warning, above: colors.danger };

  // Summary section
  let content = '<tr><td style="padding:25px 30px;">' +
    buildSectionHeader('Request Summary', colors) +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">' +
    buildInfoRow('Total Request', analysis.summary.requestSummary, colors) +
    buildInfoRow('Non-Outreach', analysis.summary.notOutreach, colors) +
    buildInfoRow('Outreach', analysis.summary.outreach, colors) +
    buildInfoRow('Data Stipend', analysis.summary.dataStipend, colors) +
    '</table></td></tr>';

  // Tactic cost analysis
  content += '<tr><td style="padding:0 30px 25px 30px;">' +
    buildSectionHeader('Tactic Cost Analysis', colors);

  for (let i = 0; i < analysis.tactics.length; i++) {
    const tactic = analysis.tactics[i];
    const mt = (i === 0) ? '0' : '20px';
    const badgeColor = statusColors[tactic.status] || colors.textLight;
    const statusLabel = tactic.status === 'within' ? 'WITHIN TARGET' : tactic.status === 'below' ? 'BELOW TARGET' : 'ABOVE TARGET';

    content += '<div style="background-color:' + colors.surface + ';border-radius:8px;padding:20px;margin-top:' + mt + ';border-top:2px solid ' + badgeColor + ';">' +
      '<h3 style="margin:0 0 12px 0;font-size:18px;font-weight:bold;color:' + colors.text + ';">' + tactic.tacticName +
      ' <span style="display:inline-block;background-color:' + badgeColor + ';color:#FFFFFF;padding:2px 10px;border-radius:10px;font-size:11px;font-weight:bold;margin-left:8px;text-transform:uppercase;">' + statusLabel + '</span></h3>' +
      '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">' +
      '<tr><td style="padding:6px 0;width:50%;"><strong>Funding:</strong> $' + (parseFloat(tactic.fundingRequested) || 0).toFixed(2) + '</td>' +
      '<td style="padding:6px 0;"><strong>Attempts:</strong> ' + tactic.programAttempts + '</td></tr>' +
      '<tr><td style="padding:6px 0;"><strong>Cost/Attempt:</strong> $' + (parseFloat(tactic.costPerAttempt) || 0).toFixed(2) + '</td>' +
      '<td style="padding:6px 0;"><strong>Target:</strong> $' + (parseFloat(tactic.lowerBound) || 0).toFixed(2) + ' - $' + (parseFloat(tactic.upperBound) || 0).toFixed(2) + '</td></tr>' +
      '</table>' +
      '<div style="background-color:' + colors.white + ';border-radius:4px;padding:12px;margin-top:12px;border-top:1px solid ' + colors.divider + ';">' +
      '<p style="margin:0;font-size:14px;color:' + colors.text + ';"><strong>Recommendation:</strong> ' + tactic.recommendation + '</p>' +
      '</div></div>';
  }

  content += '</td></tr>';

  // Incomplete or missing tactic warnings
  if (analysis.noTacticsAtAll) {
    content += '<tr><td style="padding:0 30px 25px 30px;">' +
      '<div style="background-color:' + colors.white + ';border-left:4px solid ' + colors.danger + ';padding:15px;border-radius:4px;">' +
      '<p style="margin:0;font-weight:bold;color:' + colors.danger + ';">No tactic goals were submitted with this field plan. Cost efficiency analysis cannot be performed. Follow up with the organization to complete their goals.</p>' +
      '</div></td></tr>';
  } else if (analysis.incompleteTactics && analysis.incompleteTactics.length > 0) {
    content += '<tr><td style="padding:0 30px 25px 30px;">' +
      '<div style="background-color:' + colors.white + ';border-left:4px solid ' + colors.warning + ';padding:15px;border-radius:4px;">' +
      '<p style="margin:0 0 10px 0;font-weight:bold;color:' + colors.text + ';">Incomplete Tactic Goals</p>' +
      '<p style="margin:0 0 12px 0;font-size:14px;color:' + colors.textLight + ';">The following tactics had partial data submitted. Cost efficiency could not be calculated for these tactics because missing fields prevent projecting total attempts.</p>';

    for (let k = 0; k < analysis.incompleteTactics.length; k++) {
      const inc = analysis.incompleteTactics[k];
      content += '<div style="background-color:' + colors.white + ';border-radius:4px;padding:10px 12px;margin-top:8px;">' +
        '<p style="margin:0 0 4px 0;font-weight:bold;font-size:14px;color:' + colors.text + ';">' + inc.tacticName + '</p>' +
        '<p style="margin:0;font-size:13px;color:' + colors.danger + ';">Missing: ' + inc.missingFields.join(', ') + '</p>' +
        '</div>';
    }

    content += '</div></td></tr>';
  }

  // Gap analysis table
  if (analysis.gaps && analysis.gaps.length > 0) {
    content += '<tr><td style="padding:0 30px 25px 30px;">' +
      buildSectionHeader('Funding Gap Analysis', colors) +
      '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border:1px solid ' + colors.divider + ';border-radius:4px;overflow:hidden;">' +
      '<tr style="background-color:' + colors.surface + ';">' +
      '<td style="padding:10px 15px;color:' + colors.text + ';font-size:13px;font-weight:bold;">Tactic</td>' +
      '<td style="padding:10px 15px;color:' + colors.text + ';font-size:13px;font-weight:bold;text-align:right;">Gap Amount</td></tr>';

    for (let j = 0; j < analysis.gaps.length; j++) {
      const gap = analysis.gaps[j];
      const tacticName = gap.category.charAt(0).toUpperCase() + gap.category.slice(1);
      const rowBg = (j % 2 === 0) ? colors.white : colors.surface;

      content += '<tr style="background-color:' + rowBg + ';">' +
        '<td style="padding:10px 15px;font-size:14px;font-weight:bold;color:' + colors.text + ';border-top:1px solid ' + colors.divider + ';">' + tacticName + '</td>' +
        '<td style="padding:10px 15px;font-size:14px;color:' + colors.text + ';text-align:right;border-top:1px solid ' + colors.divider + ';">$' + gap.gap + '</td></tr>';
    }

    content += '</table></td></tr>';
  }

  // Field plan connection
  const dateStr = fieldPlan.submissionDateTime || 'Unknown date';
  content += '<tr><td style="padding:0 30px 25px 30px;">' +
    '<div style="background-color:' + colors.surface + ';border-left:4px solid ' + colors.primary + ';padding:15px;border-radius:4px;">' +
    '<p style="margin:0 0 4px 0;font-size:12px;color:' + colors.textLight + ';text-transform:uppercase;font-weight:bold;">Field Plan Connection</p>' +
    '<p style="margin:0;font-size:15px;color:' + colors.text + ';">This analysis is based on the field plan submitted on ' + dateStr + '</p>' +
    '</div></td></tr>';

  return buildEmailShell('Budget Analysis', orgName, content, colors);
}

function buildWeeklySummaryEmailHTML(data, colors) {
  colors = colors || EMAIL_COLORS;
  const dateStr = new Date().toLocaleDateString();

  function statCell(label, value, color) {
    return '<td style="background-color:' + colors.white + ';border-radius:8px;padding:15px;text-align:center;border:1px solid ' + colors.divider + ';border-bottom:2px solid ' + color + ';width:33%;">' +
      '<div style="font-size:28px;font-weight:bold;color:' + color + ';margin-bottom:4px;">' + value + '</div>' +
      '<div style="font-size:11px;color:' + colors.textLight + ';text-transform:uppercase;font-weight:bold;">' + label + '</div></td>';
  }

  // Field plan activity stats
  let content = '<tr><td style="padding:25px 30px 0 30px;">' +
    buildSectionHeader('Field Plan Activity', colors) +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"><tr>' +
    statCell('New This Week', data.fieldPlansThisWeek, colors.primary) +
    '<td style="width:8px;"></td>' +
    statCell('Total Plans', data.fieldPlansTotal, colors.secondary) +
    '<td style="width:8px;"></td>' +
    statCell('Missing Budgets', data.fieldPlansMissingBudgets, colors.danger) +
    '</tr></table></td></tr>';

  // Budget analysis stats
  content += '<tr><td style="padding:20px 30px 0 30px;">' +
    buildSectionHeader('Budget Analysis Status', colors) +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%"><tr>' +
    statCell('Analyzed', data.budgetsAnalyzed, colors.success) +
    '<td style="width:8px;"></td>' +
    statCell('Pending', data.budgetsPending, colors.warning) +
    '<td style="width:8px;"></td>' +
    statCell('Missing Plans', data.budgetsMissingPlans, colors.danger) +
    '</tr></table></td></tr>';

  // Financial summary
  content += '<tr><td style="padding:20px 30px 0 30px;">' +
    buildSectionHeader('Financial Summary', colors) +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">' +
    buildInfoRow('Requested This Week', '$' + data.weeklyRequestedTotal.toFixed(2), colors) +
    buildInfoRow('Total Requested', '$' + data.totalRequested.toFixed(2), colors) +
    buildInfoRow('Total Gap Identified', '$' + data.totalGap.toFixed(2), colors) +
    '</table></td></tr>';

  // Tactic distribution table
  const activeTactics = [];
  const tacticKeys = Object.keys(data.tacticCounts);
  for (let i = 0; i < tacticKeys.length; i++) {
    if (data.tacticCounts[tacticKeys[i]] > 0) {
      activeTactics.push({ name: tacticKeys[i], count: data.tacticCounts[tacticKeys[i]] });
    }
  }

  if (activeTactics.length > 0) {
    content += '<tr><td style="padding:20px 30px 0 30px;">' +
      buildSectionHeader('Tactic Distribution', colors) +
      '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="border:1px solid ' + colors.divider + ';border-radius:4px;overflow:hidden;">' +
      '<tr style="background-color:' + colors.surface + ';">' +
      '<td style="padding:10px 15px;color:' + colors.text + ';font-size:13px;font-weight:bold;">Tactic</td>' +
      '<td style="padding:10px 15px;color:' + colors.text + ';font-size:13px;font-weight:bold;text-align:right;">Programs</td></tr>';

    for (let t = 0; t < activeTactics.length; t++) {
      const rowBg = (t % 2 === 0) ? colors.white : colors.surface;
      content += '<tr style="background-color:' + rowBg + ';">' +
        '<td style="padding:10px 15px;font-size:14px;color:' + colors.text + ';border-top:1px solid ' + colors.divider + ';">' + activeTactics[t].name + '</td>' +
        '<td style="padding:10px 15px;font-size:14px;color:' + colors.text + ';text-align:right;border-top:1px solid ' + colors.divider + ';">' + activeTactics[t].count + '</td></tr>';
    }

    content += '</table></td></tr>';
  }

  // Geographic coverage
  if (data.sortedCounties && data.sortedCounties.length > 0) {
    content += '<tr><td style="padding:20px 30px 0 30px;">' +
      buildSectionHeader('Geographic Coverage', colors) +
      '<div style="background-color:' + colors.surface + ';border-radius:8px;padding:15px;">';

    for (let c = 0; c < data.sortedCounties.length; c++) {
      const county = data.sortedCounties[c];
      content += '<span style="display:inline-block;background-color:' + colors.white + ';border:1px solid ' + colors.divider + ';border-radius:20px;padding:4px 12px;margin:4px;font-size:13px;color:' + colors.text + ';">' +
        county[0] + ' <strong style="color:' + colors.primary + ';">(' + county[1] + ')</strong></span>';
    }

    content += '</div></td></tr>';
  }

  // Organizations needing follow-up
  const hasFollowUp = (data.fieldPlansMissingBudgetsList && data.fieldPlansMissingBudgetsList.length > 0) ||
    (data.budgetsMissingPlansList && data.budgetsMissingPlansList.length > 0);

  if (hasFollowUp) {
    content += '<tr><td style="padding:20px 30px 0 30px;">' +
      buildSectionHeader('Organizations Needing Follow-Up', colors);

    if (data.fieldPlansMissingBudgetsList && data.fieldPlansMissingBudgetsList.length > 0) {
      content += '<p style="margin:0 0 8px 0;font-size:14px;font-weight:bold;color:' + colors.text + ';">Field Plans Missing Budgets (&gt;72 hours)</p>';
      for (let m = 0; m < data.fieldPlansMissingBudgetsList.length; m++) {
        const item = data.fieldPlansMissingBudgetsList[m];
        content += '<div style="background-color:' + colors.white + ';border-left:2px solid ' + colors.warning + ';padding:10px 15px;border-radius:4px;margin-bottom:8px;">' +
          '<p style="margin:0;font-size:14px;color:' + colors.text + ';"><strong>' + item.org + '</strong> — submitted ' + item.days + ' days ago</p></div>';
      }
    }

    if (data.budgetsMissingPlansList && data.budgetsMissingPlansList.length > 0) {
      content += '<p style="margin:15px 0 8px 0;font-size:14px;font-weight:bold;color:' + colors.text + ';">Budgets Missing Field Plans (&gt;72 hours)</p>';
      for (let n = 0; n < data.budgetsMissingPlansList.length; n++) {
        const bItem = data.budgetsMissingPlansList[n];
        content += '<div style="background-color:' + colors.white + ';border-left:2px solid ' + colors.warning + ';padding:10px 15px;border-radius:4px;margin-bottom:8px;">' +
          '<p style="margin:0;font-size:14px;color:' + colors.text + ';"><strong>' + bItem.org + '</strong> — submitted ' + bItem.days + ' days ago</p></div>';
      }
    }

    content += '</td></tr>';
  }

  // Coaching needs
  content += '<tr><td style="padding:20px 30px 25px 30px;">' +
    buildSectionHeader('Coaching Needs Summary', colors) +
    '<table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">' +
    buildInfoRow('High Need (1-5)', data.coachingNeeds.high + ' organizations', colors) +
    buildInfoRow('Medium Need (6-8)', data.coachingNeeds.medium + ' organizations', colors) +
    buildInfoRow('Low Need (9-10)', data.coachingNeeds.low + ' organizations', colors) +
    '</table>' +
    '<p style="margin:15px 0 0 0;font-size:12px;color:' + colors.textLight + ';font-style:italic;">All gap calculations use absolute values. Missing documents are tracked after 72 hours.</p>' +
    '</td></tr>';

  return buildEmailShell('Weekly Summary Report', dateStr, content, colors);
}

function buildFieldTargetsTable(fieldPlans) {
  let html = `
    <h2 style="font-size:12px;font-weight:bold;color:#5F6368;text-transform:uppercase;letter-spacing:0.8px;padding-bottom:10px;border-bottom:1px solid #DADCE0;">Field Wide Targets</h2>
    <table border="0" cellpadding="5" cellspacing="0" style="border-collapse: collapse; border:1px solid #DADCE0; border-radius:4px; width:100%;">
      <thead>
        <tr style="background-color: #F8F9FA;">
          <th style="padding:10px 15px;font-size:13px;font-weight:bold;color:#202124;border-bottom:1px solid #DADCE0;">Organization</th>
          <th style="padding:10px 15px;font-size:13px;font-weight:bold;color:#202124;border-bottom:1px solid #DADCE0;">Counties</th>
          <th style="padding:10px 15px;font-size:13px;font-weight:bold;color:#202124;border-bottom:1px solid #DADCE0;">Cities</th>
          <th style="padding:10px 15px;font-size:13px;font-weight:bold;color:#202124;border-bottom:1px solid #DADCE0;">Special Areas</th>
          <th style="padding:10px 15px;font-size:13px;font-weight:bold;color:#202124;border-bottom:1px solid #DADCE0;">Demographics</th>
          <th style="padding:10px 15px;font-size:13px;font-weight:bold;color:#202124;border-bottom:1px solid #DADCE0;">Precincts</th>
          <th style="padding:10px 15px;font-size:13px;font-weight:bold;color:#202124;border-bottom:1px solid #DADCE0;">Running for Office</th>
          <th style="padding:10px 15px;font-size:13px;font-weight:bold;color:#202124;border-bottom:1px solid #DADCE0;">Can Teach</th>
        </tr>
      </thead>
      <tbody>
      `;

  //Add each field plan as a row to table
  fieldPlans.forEach(fp => {
    html += createFieldTargetsRow(fp);
  });

  html += `
      </tbody
    </table>
    `;

    return html;
};

//Create row for fieldtargets function
function createFieldTargetsRow(fieldPlan) {
  //Format county arrays as comma-separated strings
  const counties = fieldPlan.fieldCounties ?
    (Array.isArray(fieldPlan.fieldCounties)
      ? fieldPlan.fieldCounties.toString().replace(/\n/g, ', ')
      : fieldPlan.fieldCounties.toString().replace(/\n/g, ', ')
    ) : 'None specified';

  //Combine demos into one cell
  const demographics = formatDemographics(fieldPlan);

  //Format precinct array as comma-separated strings
  const precincts = fieldPlan.fieldPrecincts ?
    (Array.isArray(fieldPlan.fieldPrecincts)
      ? fieldPlan.fieldPrecincts.toString().replace(/\n/g, ', ')
      : fieldPlan.fieldPrecincts.toString().replace(/\n/g, ', ')
    ) : 'None specified';

  return `
    <tr>
      <td>${fieldPlan.memberOrgName || 'Unknown'}</td>
      <td>${counties}</td>
      <td>${demographics}</td>
      <td>${precincts}</td>
    </tr>
  `;
}

//Combines demographics for fieldplan target summary email
function formatDemographics(fieldPlan) {
  const parts = [];

  //Test if demoRace array contains data, then format
  if (fieldPlan.demoRace && fieldPlan.demoRace.length > 0) {
    const race = Array.isArray(fieldPlan.demoRace)
      ? fieldPlan.demoRace.toString().replace(/\n/g, ', ')
      : fieldPlan.demoRace.toString().replace(/\n/g, ', ');
    parts.push(`Race: ${race}`);
  }

  //Test if demoAge array contains data, then format
  if (fieldPlan.demoAge && fieldPlan.demoAge.length > 0) {
    const age = Array.isArray(fieldPlan.demoAge)
      ? fieldPlan.demoAge.toString().replace(/\n/g, ', ')
      : fieldPlan.demoAge.toString().replace(/\n/g, ', ');
    parts.push(`Age: ${age}`);
  }

  if (fieldPlan.demoGender && fieldPlan.demoGender.length > 0) {
    const gender = Array.isArray(fieldPlan.demoGender)
      ? fieldPlan.demoGender.toString().replace(/\n/g, ', ')
      : fieldPlan.demoGender.toString().replace(/\n/g, ', ');
    parts.push(`Gender: ${gender}`);
  }

  if (fieldPlan.demoAffinity && fieldPlan.demoAffinity.length > 0) {
    const affinity = Array.isArray(fieldPlan.demoAffinity)
      ? fieldPlan.demoAffinity.toString().replace(/\n/g, ', ')
      : fieldPlan.demoAffinity.toString().replace(/\n/g, ', ');
    parts.push(`Affinity: ${affinity}`);
  }

  // NEW in 2026: Add notes if provided
  if (fieldPlan.demoNotes) {
    parts.push(`<em>Notes: ${fieldPlan.demoNotes}</em>`);
  }

  return parts.length > 0 ? parts.join('<br>') : 'None specified';

}

function sendFieldPlanEmail(fieldPlan, rowNumber = null, isTestMode = false) {
  if (!fieldPlan) {
    Logger.log('Error: fieldPlan object is undefined');
    return;
  }

  const validEmails = getEmailRecipients(isTestMode);

  if (validEmails.length === 0) {
    Logger.log("No valid recipient email addresses found");
    return;
  }

  try {
    // Get the row data for creating tactic instances
    const sheetName = scriptProps.getProperty('SHEET_FIELD_PLAN')
    const sheet = getSheet(sheetName);
    let rowData;

    if (rowNumber) {
      // Use the specific row number if provided
      rowData = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
      Logger.log(`Using row data from row ${rowNumber} for ${fieldPlan.memberOrgName}`);
    } else {
      // Fallback: try to find the row by matching organization name
      const allData = sheet.getDataRange().getValues();
      let foundRow = -1;

      for (let i = 1; i < allData.length; i++) {
        if (allData[i][FIELD_PLAN_COLUMNS.MEMBERNAME] === fieldPlan.memberOrgName) {
          rowData = allData[i];
          foundRow = i + 1;
          break;
        }
      }

      if (foundRow === -1) {
        Logger.log(`Warning: Could not find row for ${fieldPlan.memberOrgName}, using last row as fallback`);
        const lastRow = sheet.getLastRow();
        rowData = sheet.getRange(lastRow, 1, 1, sheet.getLastColumn()).getValues()[0];
      } else {
        Logger.log(`Found ${fieldPlan.memberOrgName} at row ${foundRow}`);
      }
    }
    // Create tactic instances from row data
    const tactics = getTacticInstances(rowData);

    // Build professional email using component library
    // buildFieldPlanEmailHTML() returns a complete HTML string (<!DOCTYPE html>...</html>)
    // containing all sections: header, stats, contact, tactics, confidence, etc.
    const emailBody = buildFieldPlanEmailHTML(fieldPlan, tactics);

    // Send the email
    const recipientList = validEmails.join(',');
    Logger.log(`Sending field plan email to: ${recipientList}`);
    MailApp.sendEmail({
      to: recipientList,
      subject: (isTestMode ? '[TEST] ' : '') + 'New Field Plan: ' + (fieldPlan.memberOrgName || 'Unknown Organization'),
      htmlBody: emailBody,
      name: 'Alabama Forward Field Planning',
      replyTo: scriptProps.getProperty('EMAIL_REPLY_TO') || 'datateam@alforward.org'
    });

    Logger.log('Field plan email sent for: ' + fieldPlan.memberOrgName);

  } catch (error) {
    Logger.log(`Error in sendFieldPlanEmail: ${error} ${error.message}`);
    Logger.log(`Error stack: ${error.stack}`);

    try {
      MailApp.sendEmail({
        to: validEmails.join(','),
        subject: 'Critical Error in Field Plan Processing',
        body: `A critical error occurred while processing the field plan:\n\n${error.message}\n\nPlease check the Apps Script logs for more details.`,
        name: "Field Plan Error Notification"
      });
    } catch (emailError) {
      Logger.log(`Failed to send error notification: ${emailError.message}`);
    }
  }
}

// Function to process the county, precinct, and demo for each field submission at once
function sendFieldPlanTargetsSummary() {
  //Get the field plan sheet using existing helpers
  const sheet = getSheet(scriptProps.getProperty('SHEET_FIELD_PLAN'));
  const data = sheet.getDataRange().getValues();

  //Process field plans, skip header row
  const fieldPlans = [];
  for (let i = 1; i < data.length; i++) {
    const fieldPlan = new FieldPlan(data[i]);
    fieldPlans.push(fieldPlan)
  }

  //Build the html
  const emailBody = buildFieldTargetsTable(fieldPlans);

  //Send using existing email config
  sendTargetsSummaryEmail(emailBody)
};

function sendTargetsSummaryEmail(htmlBody) {
  const recipients = getEmailRecipients();

  try {
    MailApp.sendEmail({
      to: recipients.join(','),
      subject: 'Field Wide Targets Summary',
      htmlBody: htmlBody,
      name: "Field Targets Summary Email",
      replyTo: getEmailConfig().replyTo
    });
    Logger.log('Field Wide Targets summary email sent successfull');
  } catch (error) {
    Logger.log(`Error sending field targets email: ${error.message}`);
  }
}

// Send notification for missing budget
function sendMissingBudgetNotification(orgName, isTestMode = false) {
  const colors = EMAIL_COLORS;
  const emailBody = (isTestMode ? buildTestModeBanner() : '') +
    buildAlertEmailHTML('Missing Budget Alert', orgName, [
      'This organization submitted a field plan more than 72 hours ago but has not yet submitted a budget.',
      'Cost efficiency analysis cannot be performed without budget data.'
    ], colors.warning, colors);

  try {
    const recipients = getEmailRecipients(isTestMode);
    MailApp.sendEmail({
      to: recipients.join(','),
      subject: `${isTestMode ? '[TEST] ' : ''}Missing Budget: ${orgName}`,
      htmlBody: emailBody,
      name: "Field Plan Analysis System",
      replyTo: getEmailConfig().replyTo
    });
    Logger.log(`Missing budget notification sent for ${orgName} (${isTestMode ? 'TEST MODE' : 'PRODUCTION'})`);
  } catch (error) {
    Logger.log(`Error sending missing budget notification: ${error.message}`);
  }
}

// Generate combined weekly summary report for both budgets and field plans
function generateWeeklySummary(isTestMode = false) {
  try {
    if (typeof isTestMode !== 'boolean') {
      Logger.log(`Warning: isTestMode received as ${typeof isTestMode}, defaulting to false`);
      isTestMode = false;
    }

    Logger.log(`Starting generateWeeklySummary (isTestMode: ${isTestMode})`);

    const budgetSheetName = scriptProps.getProperty('SHEET_FIELD_BUDGET');
    const fieldPlanSheetName = scriptProps.getProperty('SHEET_FIELD_PLAN');

    // Get sheets via centralized helper (throws descriptive errors if missing)
    const budgetSheet = getSheet(budgetSheetName);
    const fieldPlanSheet = getSheet(fieldPlanSheetName);

    const budgetData = budgetSheet.getDataRange().getValues();
    const fieldPlanData = fieldPlanSheet.getDataRange().getValues();

    Logger.log(`Loaded ${budgetData.length} budget rows and ${fieldPlanData.length} field plan rows`);

  // Calculate date range for "this week" (past 7 days)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  // Budget analysis
  let budgetsAnalyzed = 0;
  let budgetsPending = 0;
  let budgetsMissingPlans = 0;
  let totalRequested = 0;
  let totalGap = 0;
  let weeklyRequestedTotal = 0;
  const budgetsMissingPlansList = [];

  // Field plan analysis
  let fieldPlansTotal = 0;
  let fieldPlansThisWeek = 0;
  let fieldPlansMissingBudgets = 0;
  const fieldPlansMissingBudgetsList = [];
  const countyData = {};
  const tacticCounts = {
    DOOR: 0,
    PHONE: 0,
    TEXT: 0,
    OPEN: 0,
    RELATIONAL: 0,
    REGISTRATION: 0,
    MAIL: 0
  };
  const coachingNeeds = {
    high: 0,    // 1-5
    medium: 0,  // 6-8
    low: 0      // 9-10
  };

  // Process budget data
  for (let i = 1; i < budgetData.length; i++) {
    if (budgetData[i][0]) {
      const orgName = budgetData[i][FieldBudget.COLUMNS.MEMBERNAME];
      const requestedAmount = budgetData[i][FieldBudget.COLUMNS.REQUESTEDTOTAL] || 0;

      if (budgetData[i][FieldBudget.COLUMNS.ANALYZED] === true) {
        budgetsAnalyzed++;
      } else {
        budgetsPending++;
        // Check if waiting for field plan
        const properties = PropertiesService.getScriptProperties();
        const missingPlanProp = properties.getProperty(`MISSING_PLAN_${orgName}`);
        if (missingPlanProp) {
          budgetsMissingPlans++;
          const daysSince = Math.floor((new Date() - new Date(missingPlanProp)) / (1000 * 60 * 60 * 24));
          budgetsMissingPlansList.push({ org: orgName, days: daysSince });
        }
      }

      totalRequested += requestedAmount;

      // Check if submitted this week (would need timestamp column)
      const submitDate = budgetData[i][0]; // Assuming first column is timestamp
      if (submitDate && new Date(submitDate) >= oneWeekAgo) {
        weeklyRequestedTotal += requestedAmount;
      }

      // Convert negative gaps to positive for totaling
      const gapValue = budgetData[i][FieldBudget.COLUMNS.GAPTOTAL] || 0;
      totalGap += Math.abs(gapValue);
    }
  }

  // Process field plan data
  const properties = PropertiesService.getScriptProperties();
  for (let i = 1; i < fieldPlanData.length; i++) {
    if (fieldPlanData[i][0]) {
      fieldPlansTotal++;
      const orgName = fieldPlanData[i][FIELD_PLAN_COLUMNS.MEMBERNAME];
      const submitDate = fieldPlanData[i][FIELD_PLAN_COLUMNS.SUBMISSIONDATETIME];

      // Check if submitted this week
      if (submitDate && new Date(submitDate) >= oneWeekAgo) {
        fieldPlansThisWeek++;
      }

      // Check for missing budget
      const missingBudgetProp = properties.getProperty(`MISSING_BUDGET_${orgName}`);
      if (missingBudgetProp) {
        fieldPlansMissingBudgets++;
        const daysSince = Math.floor((new Date() - new Date(missingBudgetProp)) / (1000 * 60 * 60 * 24));
        fieldPlansMissingBudgetsList.push({ org: orgName, days: daysSince });
      } else {
        // Check if budget exists at all
        let hasBudget = false;
        for (let j = 1; j < budgetData.length; j++) {
          if (budgetData[j][FieldBudget.COLUMNS.MEMBERNAME] === orgName) {
            hasBudget = true;
            break;
          }
        }
        if (!hasBudget && submitDate) {
          const daysSince = Math.floor((new Date() - new Date(submitDate)) / (1000 * 60 * 60 * 24));
          if (daysSince > 3) {
            fieldPlansMissingBudgets++;
            fieldPlansMissingBudgetsList.push({ org: orgName, days: daysSince });
          }
        }
      }

      // Count counties
      const counties = fieldPlanData[i][FIELD_PLAN_COLUMNS.FIELDCOUNTIES];
      if (counties) {
        let countyList = [];

        // Handle different input formats
        if (Array.isArray(counties)) {
          countyList = counties;
        } else {
          const countyString = counties.toString().trim();

          // Check if it contains commas (properly formatted)
          if (countyString.includes(',')) {
            countyList = countyString.split(',');
          } else {
            // No commas - need to parse space-separated counties
            // Handle known multi-word counties in Alabama
            const multiWordCounties = ['Saint Clair', 'St. Clair', 'St Clair'];
            let processedString = countyString;

            // Replace multi-word counties with temporary placeholders
            multiWordCounties.forEach((mwCounty, index) => {
              const regex = new RegExp(mwCounty, 'gi');
              processedString = processedString.replace(regex, `__MW${index}__`);
            });

            // Split by spaces
            let tempList = processedString.split(/\s+/);

            // Replace placeholders back with actual county names
            countyList = tempList.map(item => {
              multiWordCounties.forEach((mwCounty, index) => {
                if (item === `__MW${index}__`) {
                  item = 'Saint Clair'; // Normalize to standard form
                }
              });
              return item;
            }).filter(county => county.length > 0);
          }
        }

        // Process each county
        countyList.forEach(county => {
          const trimmedCounty = county.trim();
          if (trimmedCounty) {
            countyData[trimmedCounty] = (countyData[trimmedCounty] || 0) + 1;
          }
        });
      }

      // Count tactics (checking which tactic columns have data)
      const rowData = fieldPlanData[i];
      if (rowData[PROGRAM_COLUMNS.DOOR.PROGRAMLENGTH]) tacticCounts.DOOR++;
      if (rowData[PROGRAM_COLUMNS.PHONE.PROGRAMLENGTH]) tacticCounts.PHONE++;
      if (rowData[PROGRAM_COLUMNS.TEXT.PROGRAMLENGTH]) tacticCounts.TEXT++;
      if (rowData[PROGRAM_COLUMNS.OPEN.PROGRAMLENGTH]) tacticCounts.OPEN++;
      if (rowData[PROGRAM_COLUMNS.RELATIONAL.PROGRAMLENGTH]) tacticCounts.RELATIONAL++;
      if (rowData[PROGRAM_COLUMNS.REGISTRATION.PROGRAMLENGTH]) tacticCounts.REGISTRATION++;
      if (rowData[PROGRAM_COLUMNS.MAIL.PROGRAMLENGTH]) tacticCounts.MAIL++;

      // Count coaching needs
      const confScores = [
        fieldPlanData[i][FIELD_PLAN_COLUMNS.CONFIDENCEREASONABLE],
        fieldPlanData[i][FIELD_PLAN_COLUMNS.CONFIDENCEDATA],
        fieldPlanData[i][FIELD_PLAN_COLUMNS.CONFIDENCEPLAN],
        fieldPlanData[i][FIELD_PLAN_COLUMNS.CONFIDENCECAPACITY],
        fieldPlanData[i][FIELD_PLAN_COLUMNS.CONFIDENCESKILLS],
        fieldPlanData[i][FIELD_PLAN_COLUMNS.CONFIDENCEGOALS]
      ].filter(s => s && !isNaN(s));

      const confidence = confScores.length > 0
        ? confScores.reduce((a, b) => a + b, 0) / confScores.length
        : null;

      if (confidence) {
        if (confidence <= 5) coachingNeeds.high++;
        else if (confidence <= 8) coachingNeeds.medium++;
        else coachingNeeds.low++;
      }
    }
  }
    // Sort missing lists by days
  budgetsMissingPlansList.sort((a, b) => b.days - a.days);
  fieldPlansMissingBudgetsList.sort((a, b) => b.days - a.days);

  // Sort counties by count
  const sortedCounties = Object.entries(countyData).sort((a, b) => b[1] - a[1]);

  // Package data for the builder
  const summaryData = {
    fieldPlansThisWeek: fieldPlansThisWeek,
    fieldPlansTotal: fieldPlansTotal,
    fieldPlansMissingBudgets: fieldPlansMissingBudgets,
    fieldPlansMissingBudgetsList: fieldPlansMissingBudgetsList,
    budgetsAnalyzed: budgetsAnalyzed,
    budgetsPending: budgetsPending,
    budgetsMissingPlans: budgetsMissingPlans,
    budgetsMissingPlansList: budgetsMissingPlansList,
    weeklyRequestedTotal: weeklyRequestedTotal,
    totalRequested: totalRequested,
    totalGap: totalGap,
    tacticCounts: tacticCounts,
    sortedCounties: sortedCounties,
    coachingNeeds: coachingNeeds
  };

  // Build styled email
  let emailBody = (isTestMode ? buildTestModeBanner() : '') +
    buildWeeklySummaryEmailHTML(summaryData, EMAIL_COLORS);

    const recipients = getEmailRecipients(isTestMode);
    Logger.log(`Sending weekly summary to: ${recipients.join(', ')}`);

    MailApp.sendEmail({
      to: recipients.join(','),
      subject: `${isTestMode ? '[TEST] ' : ''}Weekly Summary Report - ${new Date().toLocaleDateString()}`,
      htmlBody: emailBody,
      name: "Field Plan & Budget Analysis System",
      replyTo: scriptProps.getProperty('EMAIL_REPLY_TO') || 'datateam@alforward.org'
    });
    Logger.log(`Combined weekly summary report sent successfully (${isTestMode ? 'TEST MODE' : 'PRODUCTION'})`);

  } catch (error) {
    Logger.log(`ERROR in generateWeeklySummary: ${error.message}`);
    Logger.log(`Stack trace: ${error.stack}`);

    // Try to send error notification
    try {
      const errorEmail = buildAlertEmailHTML(
        'Weekly Summary Generation Failed',
        'System Error',
        [
          '<strong>Error:</strong> ' + error.message,
          '<strong>Time:</strong> ' + new Date().toString(),
          '<strong>Mode:</strong> ' + (isTestMode ? 'TEST' : 'PRODUCTION'),
          'Please check the Apps Script logs for more details.'
        ],
        EMAIL_COLORS.danger,
        EMAIL_COLORS
      );

      MailApp.sendEmail({
        to: 'datateam@alforward.org',
        subject: 'ERROR: Weekly Summary Generation Failed',
        htmlBody: errorEmail,
        name: "Field Plan & Budget Analysis System"
      });
    } catch (emailError) {
      Logger.log(`Failed to send error notification: ${emailError.message}`);
    }

    // Re-throw to ensure the error is visible in the execution transcript
    throw error;
  }
}

// Send budget analysis email
function sendBudgetAnalysisEmail(budget, fieldPlan, analysis, isTestMode = false) {
  // Defensive check for fieldPlan
  if (!fieldPlan) {
    Logger.log('Error in sendBudgetAnalysisEmail: fieldPlan is null or undefined');
    throw new Error('Cannot send budget analysis email without field plan data');
  }

  const emailBody = (isTestMode ? buildTestModeBanner() : '') +
    buildBudgetAnalysisEmailHTML(budget, fieldPlan, analysis, EMAIL_COLORS);

  // Send email
  try {
    const recipients = getEmailRecipients(isTestMode);
    MailApp.sendEmail({
      to: recipients.join(','),
      subject: `${isTestMode ? '[TEST] ' : ''}Budget Analysis: ${budget.memberOrgName}`,
      htmlBody: emailBody,
      name: "Budget Analysis System",
      replyTo: scriptProps.getProperty('EMAIL_REPLY_TO') || 'datateam@alforward.org'
    });
    Logger.log(`Budget analysis email sent for ${budget.memberOrgName} (${isTestMode ? 'TEST MODE' : 'PRODUCTION'})`);
  } catch (error) {
    Logger.log(`Error sending email for ${budget.memberOrgName}: ${error.message}`);
    throw error;
  }
}

// Send notification for missing field plan
function sendMissingFieldPlanNotification(orgName, isTestMode = false) {
  const colors = EMAIL_COLORS;
  const emailBody = (isTestMode ? buildTestModeBanner() : '') +
    buildAlertEmailHTML('Missing Field Plan Alert', orgName, [
      'This organization submitted a budget more than 72 hours ago but has not yet submitted a field plan.',
      'The budget analysis cannot be completed without a corresponding field plan.'
    ], colors.warning, colors);

  try {
    const recipients = getEmailRecipients(isTestMode);
    MailApp.sendEmail({
      to: recipients.join(','),
      subject: `${isTestMode ? '[TEST] ' : ''}Missing Field Plan: ${orgName}`,
      htmlBody: emailBody,
      name: "Budget Analysis System",
      replyTo: scriptProps.getProperty('EMAIL_REPLY_TO') || 'datateam@alforward.org'
    });
    Logger.log(`Missing field plan notification sent for ${orgName} (${isTestMode ? 'TEST MODE' : 'PRODUCTION'})`);
  } catch (error) {
    Logger.log(`Error sending missing field plan notification: ${error.message}`);
  }
}

// Send error notification
function sendErrorNotification(budget, error, isTestMode = false) {
  const colors = EMAIL_COLORS;
  const emailBody = (isTestMode ? buildTestModeBanner() : '') +
    buildAlertEmailHTML('Budget Analysis Error', budget.memberOrgName, [
      '<strong>Error:</strong> ' + error.message,
      'The budget analysis encountered an error and could not be completed.',
      'Please check the Apps Script logs for more details.'
    ], colors.danger, colors);

  try {
    const recipients = getEmailRecipients(isTestMode);
    MailApp.sendEmail({
      to: recipients.join(','),
      subject: `${isTestMode ? '[TEST] ' : ''}Budget Analysis Error: ${budget.memberOrgName}`,
      htmlBody: emailBody,
      name: "Budget Analysis System",
      replyTo: scriptProps.getProperty('EMAIL_REPLY_TO') || 'datateam@alforward.org'
    });
    Logger.log(`Error notification sent for ${budget.memberOrgName} (${isTestMode ? 'TEST MODE' : 'PRODUCTION'})`);
  } catch (emailError) {
    Logger.log(`Failed to send error notification: ${emailError.message}`);
  }
}

// Generate recommendation for a tactic
function generateTacticRecommendation(tacticType, costPerAttempt, target, status) {
  if (status === 'within') {
    return `${tacticType} funding is appropriately aligned with planned activities.`;
  } else if (status === 'below') {
    return `${tacticType} funding is below the standard range for this tactic.`;
  } else {
    return `${tacticType} funding exceeds the standard range. Review if the funding request aligns with realistic program expectations.`;
  }
}
