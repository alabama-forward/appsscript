# Field Plan Analysis Email Design Guide

A comprehensive guide to creating beautiful, professional, and mobile-responsive emails for field plan analysis notifications sent via Google Apps Script.

---

## Table of Contents
1. [Email Design Principles](#email-design-principles)
2. [Gmail/Apps Script Limitations](#gmail-apps-script-limitations)
3. [Complete Email Template](#complete-email-template)
4. [Customization Guide](#customization-guide)
5. [Component Library](#component-library)
6. [Testing & Validation](#testing--validation)

---

## Email Design Principles

### Key Goals
- ✅ **Scannable:** Important info stands out at a glance
- ✅ **Professional:** Matches Alabama Forward branding
- ✅ **Mobile-Friendly:** 50%+ of emails are opened on mobile
- ✅ **Actionable:** Clear next steps for the recipient
- ✅ **Accessible:** Works with screen readers and high contrast modes

### Design Philosophy
- Use a **single column layout** (works best across all email clients)
- **Inline CSS only** (many email clients strip `<style>` tags)
- **Tables for layout** (email HTML is like HTML from 1999)
- **Web-safe fonts** (Arial, Georgia, Courier)
- **Adequate spacing** (white space improves readability)

---

## Gmail/Apps Script Limitations

### What Works ✅
- Inline CSS styles
- Tables for layout
- Basic HTML elements (div, p, h1-h6, ul, li, strong, em)
- Background colors
- Web-safe fonts
- Border and padding
- Images (hosted externally with full URLs)

### What Doesn't Work ❌
- External CSS files
- JavaScript
- Forms and input elements
- CSS animations
- Video embeds
- Advanced CSS (flexbox, grid)
- Relative image URLs
- `<style>` tags (unreliable)

### Best Practices
- Keep email size under 100KB
- Inline all CSS
- Test across email clients (Gmail, Outlook, Apple Mail)
- Use `role="presentation"` on layout tables
- Provide alt text for images

---

## Complete Email Template

### Base Template Structure

```javascript
function buildFieldPlanEmailHTML(fieldPlan, tactics = []) {
  // Color scheme - customize these!
  const colors = {
    primary: '#0066CC',        // Alabama Forward blue
    secondary: '#00A651',      // Alabama Forward green
    accent: '#FF6B35',         // Alert/warning color
    text: '#333333',           // Main text
    textLight: '#666666',      // Secondary text
    background: '#F5F5F5',     // Page background
    white: '#FFFFFF',          // Card background
    border: '#DDDDDD',         // Border color
    success: '#28A745',        // Success/positive
    warning: '#FFC107',        // Warning
    danger: '#DC3545'          // Danger/urgent
  };

  // Start building the email
  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Field Plan Submission: ${fieldPlan.memberOrgName}</title>
</head>
<body style="
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
  font-size: 16px;
  line-height: 1.6;
  color: ${colors.text};
  background-color: ${colors.background};
">

  <!-- Main Container -->
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: ${colors.background};">
    <tr>
      <td style="padding: 20px 0;">

        <!-- Email Content Wrapper (600px max width for desktop) -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="
          margin: 0 auto;
          background-color: ${colors.white};
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          max-width: 600px;
        ">

          <!-- Header Section -->
          ${buildEmailHeader(fieldPlan, colors)}

          <!-- Organization Summary Card -->
          ${buildOrgSummaryCard(fieldPlan, colors)}

          <!-- Quick Stats Grid -->
          ${buildQuickStatsGrid(fieldPlan, tactics, colors)}

          <!-- Contact Information -->
          ${buildContactSection(fieldPlan, colors)}

          <!-- Program Details -->
          ${buildProgramDetailsSection(fieldPlan, colors)}

          <!-- Geographic Targeting -->
          ${buildGeographicSection(fieldPlan, colors)}

          <!-- Demographics -->
          ${buildDemographicsSection(fieldPlan, colors)}

          <!-- Field Tactics Analysis -->
          ${buildTacticsSection(tactics, colors)}

          <!-- Confidence Assessment -->
          ${buildConfidenceSection(fieldPlan, colors)}

          <!-- Action Items / Next Steps -->
          ${buildActionItemsSection(fieldPlan, colors)}

          <!-- Footer -->
          ${buildEmailFooter(colors)}

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
  `;

  return html;
}
```

---

## Component Library

### 1. Email Header

```javascript
function buildEmailHeader(fieldPlan, colors) {
  // Determine status badge
  const attendedTraining = fieldPlan.attendedTraining;
  const trainingBadge = attendedTraining === 'Yes'
    ? `<span style="background-color: ${colors.success}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">TRAINED</span>`
    : `<span style="background-color: ${colors.warning}; color: white; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600;">NEEDS TRAINING</span>`;

  return `
    <tr>
      <td style="
        background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%);
        padding: 30px;
        text-align: center;
        border-radius: 8px 8px 0 0;
      ">
        <h1 style="
          margin: 0 0 10px 0;
          font-size: 28px;
          font-weight: 700;
          color: white;
          text-shadow: 0 1px 3px rgba(0,0,0,0.2);
        ">
          New Field Plan Submission
        </h1>
        <p style="
          margin: 0 0 15px 0;
          font-size: 18px;
          color: rgba(255,255,255,0.95);
          font-weight: 500;
        ">
          ${fieldPlan.memberOrgName || 'Unknown Organization'}
        </p>
        ${trainingBadge}
      </td>
    </tr>
  `;
}
```

### 2. Organization Summary Card

```javascript
function buildOrgSummaryCard(fieldPlan, colors) {
  const submissionDate = fieldPlan.submissionDateTime
    ? new Date(fieldPlan.submissionDateTime).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Not available';

  return `
    <tr>
      <td style="padding: 0 30px 20px 30px;">
        <div style="
          background-color: ${colors.background};
          border-left: 4px solid ${colors.primary};
          padding: 20px;
          border-radius: 4px;
          margin-top: -10px;
        ">
          <p style="
            margin: 0 0 8px 0;
            font-size: 14px;
            color: ${colors.textLight};
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
          ">
            Submitted
          </p>
          <p style="
            margin: 0;
            font-size: 16px;
            color: ${colors.text};
          ">
            📅 ${submissionDate}
          </p>
        </div>
      </td>
    </tr>
  `;
}
```

### 3. Quick Stats Grid

```javascript
function buildQuickStatsGrid(fieldPlan, tactics, colors) {
  // Calculate stats
  const totalCounties = fieldPlan.fieldCounties ? fieldPlan.fieldCounties.length : 0;
  const totalTactics = tactics.length;
  const totalDemographics = [
    ...(fieldPlan.demoRace || []),
    ...(fieldPlan.demoAge || []),
    ...(fieldPlan.demoGender || [])
  ].length;

  // Calculate average confidence
  const confidenceScores = [
    fieldPlan.confidenceReasonable,
    fieldPlan.confidenceData,
    fieldPlan.confidencePlan,
    fieldPlan.confidenceCapacity,
    fieldPlan.confidenceSkills,
    fieldPlan.confidenceGoals
  ].filter(score => score && !isNaN(score));

  const avgConfidence = confidenceScores.length > 0
    ? (confidenceScores.reduce((a, b) => a + b, 0) / confidenceScores.length).toFixed(1)
    : 'N/A';

  // Confidence color
  const confidenceColor = avgConfidence >= 8 ? colors.success
    : avgConfidence >= 6 ? colors.warning
    : colors.danger;

  return `
    <tr>
      <td style="padding: 0 30px 30px 30px;">
        <h2 style="
          margin: 0 0 20px 0;
          font-size: 20px;
          font-weight: 600;
          color: ${colors.text};
        ">
          📊 Quick Overview
        </h2>

        <!-- Stats Grid -->
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            ${buildStatCard('Counties', totalCounties, '🗺️', colors.primary, colors)}
            <td style="width: 10px;"></td>
            ${buildStatCard('Tactics', totalTactics, '🎯', colors.secondary, colors)}
          </tr>
          <tr><td colspan="3" style="height: 10px;"></td></tr>
          <tr>
            ${buildStatCard('Demographics', totalDemographics, '👥', colors.accent, colors)}
            <td style="width: 10px;"></td>
            ${buildStatCard('Confidence', avgConfidence, '⭐', confidenceColor, colors)}
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function buildStatCard(label, value, emoji, color, colors) {
  return `
    <td style="
      background-color: ${colors.background};
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      border: 2px solid ${color};
    ">
      <div style="font-size: 32px; margin-bottom: 8px;">${emoji}</div>
      <div style="
        font-size: 28px;
        font-weight: 700;
        color: ${color};
        margin-bottom: 4px;
      ">${value}</div>
      <div style="
        font-size: 12px;
        color: ${colors.textLight};
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 600;
      ">${label}</div>
    </td>
  `;
}
```

### 4. Contact Section

```javascript
function buildContactSection(fieldPlan, colors) {
  return `
    <tr>
      <td style="padding: 0 30px 30px 30px;">
        ${buildSectionHeader('Contact Information', '👤', colors)}

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          ${buildInfoRow('Name', `${fieldPlan.firstName || ''} ${fieldPlan.lastName || ''}`, '👤', colors)}
          ${buildInfoRow('Email', fieldPlan.contactEmail || 'Not provided', '📧', colors)}
          ${buildInfoRow('Phone', fieldPlan.contactPhone || 'Not provided', '📱', colors)}
        </table>
      </td>
    </tr>
  `;
}
```

### 5. Program Details Section

```javascript
function buildProgramDetailsSection(fieldPlan, colors) {
  return `
    <tr>
      <td style="padding: 0 30px 30px 30px;">
        ${buildSectionHeader('Program Details', '📋', colors)}

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          ${buildInfoRow('Data Storage', formatArray(fieldPlan.dataStorage), '💾', colors)}
          ${buildInfoRow('Program Tools', formatArray(fieldPlan.programTools), '🛠️', colors)}
          ${buildInfoRow('Program Dates', fieldPlan.programDates || 'Not specified', '📅', colors)}
          ${buildInfoRow('VAN Committee', formatArray(fieldPlan.vanCommittee), '🗳️', colors)}
        </table>
      </td>
    </tr>
  `;
}
```

### 6. Geographic Targeting Section

```javascript
function buildGeographicSection(fieldPlan, colors) {
  return `
    <tr>
      <td style="padding: 0 30px 30px 30px;">
        ${buildSectionHeader('Geographic Targeting', '🗺️', colors)}

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          ${buildInfoRow('Counties', formatArray(fieldPlan.fieldCounties), '📍', colors)}
          ${buildInfoRow('Cities', formatArray(fieldPlan.cities), '🏙️', colors)}
          ${buildInfoRow('Precincts', formatArray(fieldPlan.fieldPrecincts), '🎯', colors)}
          ${buildInfoRow('Special Areas', formatArray(fieldPlan.specialGeo), '⭐', colors)}
        </table>
      </td>
    </tr>
  `;
}
```

### 7. Demographics Section

```javascript
function buildDemographicsSection(fieldPlan, colors) {
  return `
    <tr>
      <td style="padding: 0 30px 30px 30px;">
        ${buildSectionHeader('Target Demographics', '👥', colors)}

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          ${buildInfoRow('Race/Ethnicity', formatArray(fieldPlan.demoRace), '🌈', colors)}
          ${buildInfoRow('Age Groups', formatArray(fieldPlan.demoAge), '📊', colors)}
          ${buildInfoRow('Gender/Sexuality', formatArray(fieldPlan.demoGender), '⚧️', colors)}
          ${buildInfoRow('Affinity Groups', formatArray(fieldPlan.demoAffinity), '🤝', colors)}
          ${fieldPlan.demoNotes ? buildInfoRow('Additional Notes', fieldPlan.demoNotes, '📝', colors) : ''}
        </table>
      </td>
    </tr>
  `;
}
```

### 8. Field Tactics Section

```javascript
function buildTacticsSection(tactics, colors) {
  if (!tactics || tactics.length === 0) {
    return `
      <tr>
        <td style="padding: 0 30px 30px 30px;">
          ${buildSectionHeader('Field Tactics Analysis', '🎯', colors)}
          <p style="color: ${colors.textLight}; font-style: italic;">
            No field tactics were specified in this plan.
          </p>
        </td>
      </tr>
    `;
  }

  let tacticsHTML = `
    <tr>
      <td style="padding: 0 30px 30px 30px;">
        ${buildSectionHeader('Field Tactics Analysis', '🎯', colors)}
  `;

  tactics.forEach((tactic, index) => {
    tacticsHTML += buildTacticCard(tactic, colors, index === 0);
  });

  tacticsHTML += `
      </td>
    </tr>
  `;

  return tacticsHTML;
}

function buildTacticCard(tactic, colors, isFirst) {
  const marginTop = isFirst ? '0' : '20px';

  return `
    <div style="
      background-color: ${colors.background};
      border-radius: 8px;
      padding: 20px;
      margin-top: ${marginTop};
      border-left: 4px solid ${colors.secondary};
    ">
      <h3 style="
        margin: 0 0 15px 0;
        font-size: 18px;
        font-weight: 600;
        color: ${colors.text};
      ">
        ${tactic._name}
      </h3>

      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
        <tr>
          <td style="padding: 8px 0;">
            <strong>Program Length:</strong> ${tactic.programLength} weeks
          </td>
          <td style="padding: 8px 0;">
            <strong>Weekly Volunteers:</strong> ${tactic.weeklyVolunteers}
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0;">
            <strong>Hours/Week:</strong> ${tactic.weeklyVolunteerHours}
          </td>
          <td style="padding: 8px 0;">
            <strong>Attempts/Hour:</strong> ${tactic.hourlyAttempts}
          </td>
        </tr>
      </table>

      <div style="
        background-color: white;
        border-radius: 4px;
        padding: 15px;
        margin-top: 15px;
      ">
        <p style="margin: 0 0 10px 0; font-weight: 600; color: ${colors.primary};">
          📊 Projections
        </p>
        <p style="margin: 0 0 5px 0; font-size: 14px;">
          <strong>Total Program Hours:</strong> ${tactic.programVolunteerHours()}
        </p>
        <p style="margin: 0 0 5px 0; font-size: 14px;">
          <strong>Total Attempts:</strong> ${tactic.programAttempts().toLocaleString()}
        </p>
        <p style="margin: 0; font-size: 14px;">
          ${getTacticContactsMessage(tactic)}
        </p>
      </div>
    </div>
  `;
}

function getTacticContactsMessage(tactic) {
  // Get the appropriate contact message based on tactic type
  const constructorName = tactic.constructor.name;

  switch(constructorName) {
    case 'PhoneTactic':
      return tactic.phoneExpectedContacts();
    case 'DoorTactic':
      return tactic.doorExpectedContacts();
    case 'OpenTactic':
      return tactic.openExpectedContacts();
    case 'RelationalTactic':
      return tactic.relationalExpectedContacts();
    case 'RegistrationTactic':
      return tactic.registrationExpectedContacts();
    case 'TextTactic':
      return tactic.textExpectedContacts();
    case 'MailTactic':
      return tactic.mailExpectedContacts();
    default:
      return '';
  }
}
```

### 9. Confidence Assessment Section

```javascript
function buildConfidenceSection(fieldPlan, colors) {
  const scores = [
    { label: 'Meets Expectations', value: fieldPlan.confidenceReasonable, emoji: '🎯' },
    { label: 'Data & Technology', value: fieldPlan.confidenceData, emoji: '💻' },
    { label: 'Plan Quality', value: fieldPlan.confidencePlan, emoji: '📋' },
    { label: 'Staff Capacity', value: fieldPlan.confidenceCapacity, emoji: '👥' },
    { label: 'Tactic Skills', value: fieldPlan.confidenceSkills, emoji: '🎓' },
    { label: 'Meeting Goals', value: fieldPlan.confidenceGoals, emoji: '🎯' }
  ];

  // Calculate average
  const validScores = scores.filter(s => s.value && !isNaN(s.value));
  const avgScore = validScores.length > 0
    ? (validScores.reduce((sum, s) => sum + s.value, 0) / validScores.length).toFixed(1)
    : 0;

  // Determine coaching need
  const coachingMessage = fieldPlan.needsCoaching();
  const needsCoaching = avgScore < 6;
  const coachingColor = needsCoaching ? colors.danger : colors.success;

  return `
    <tr>
      <td style="padding: 0 30px 30px 30px;">
        ${buildSectionHeader('Confidence Assessment', '⭐', colors)}

        <!-- Coaching Alert -->
        <div style="
          background-color: ${needsCoaching ? '#FFF3CD' : '#D4EDDA'};
          border-left: 4px solid ${coachingColor};
          padding: 15px;
          border-radius: 4px;
          margin-bottom: 20px;
        ">
          <p style="
            margin: 0;
            color: ${colors.text};
            font-weight: 600;
          ">
            ${needsCoaching ? '⚠️ Coaching Recommended' : '✅ Confident in Plan'}
          </p>
          <p style="margin: 10px 0 0 0; font-size: 14px; color: ${colors.text};">
            ${coachingMessage}
          </p>
        </div>

        <!-- Confidence Bars -->
        <div style="margin-top: 20px;">
          ${scores.map(score => buildConfidenceBar(score.label, score.value, score.emoji, colors)).join('')}
        </div>

        <!-- Average Score -->
        <div style="
          text-align: center;
          margin-top: 20px;
          padding: 20px;
          background-color: ${colors.background};
          border-radius: 8px;
        ">
          <p style="
            margin: 0 0 5px 0;
            font-size: 14px;
            color: ${colors.textLight};
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 600;
          ">
            Average Confidence Score
          </p>
          <p style="
            margin: 0;
            font-size: 36px;
            font-weight: 700;
            color: ${coachingColor};
          ">
            ${avgScore}/10
          </p>
        </div>
      </td>
    </tr>
  `;
}

function buildConfidenceBar(label, value, emoji, colors) {
  const score = value || 0;
  const percentage = (score / 10) * 100;
  const barColor = score >= 8 ? colors.success
    : score >= 6 ? colors.warning
    : colors.danger;

  return `
    <div style="margin-bottom: 15px;">
      <div style="
        display: flex;
        justify-content: space-between;
        margin-bottom: 5px;
      ">
        <span style="font-size: 14px; font-weight: 600; color: ${colors.text};">
          ${emoji} ${label}
        </span>
        <span style="font-size: 14px; font-weight: 700; color: ${barColor};">
          ${score}/10
        </span>
      </div>
      <div style="
        width: 100%;
        height: 8px;
        background-color: ${colors.border};
        border-radius: 4px;
        overflow: hidden;
      ">
        <div style="
          width: ${percentage}%;
          height: 100%;
          background-color: ${barColor};
          border-radius: 4px;
          transition: width 0.3s ease;
        "></div>
      </div>
    </div>
  `;
}
```

### 10. Action Items Section

```javascript
function buildActionItemsSection(fieldPlan, colors) {
  const actions = [];

  // Determine what actions are needed
  if (!fieldPlan.attendedTraining || fieldPlan.attendedTraining !== 'Yes') {
    actions.push({
      priority: 'high',
      icon: '🎓',
      title: 'Schedule Training',
      description: 'This organization has not attended field planning training. Reach out to schedule a session.'
    });
  }

  const avgConfidence = calculateAverageConfidence(fieldPlan);
  if (avgConfidence < 6) {
    actions.push({
      priority: 'high',
      icon: '🤝',
      title: 'Provide Coaching',
      description: 'Low confidence scores indicate this organization needs coaching support.'
    });
  }

  if (fieldPlan.runningForOffice && fieldPlan.runningForOffice.toLowerCase().includes('yes')) {
    actions.push({
      priority: 'medium',
      icon: '⚖️',
      title: 'Review Coordination Rules',
      description: 'Someone in this organization is running for office. Ensure compliance with coordination rules.'
    });
  }

  // Always include these
  actions.push({
    priority: 'low',
    icon: '✅',
    title: 'Review & Approve',
    description: 'Review the field plan details and approve or request revisions.'
  });

  actions.push({
    priority: 'low',
    icon: '📞',
    title: 'Follow Up',
    description: 'Schedule a check-in call to discuss the field plan and answer questions.'
  });

  const priorityColors = {
    high: colors.danger,
    medium: colors.warning,
    low: colors.success
  };

  return `
    <tr>
      <td style="padding: 0 30px 30px 30px;">
        ${buildSectionHeader('Action Items', '✅', colors)}

        ${actions.map((action, index) => `
          <div style="
            background-color: ${colors.background};
            border-left: 4px solid ${priorityColors[action.priority]};
            padding: 15px;
            border-radius: 4px;
            margin-top: ${index === 0 ? '0' : '15px'};
          ">
            <p style="
              margin: 0 0 5px 0;
              font-weight: 600;
              color: ${colors.text};
              font-size: 16px;
            ">
              ${action.icon} ${action.title}
              <span style="
                background-color: ${priorityColors[action.priority]};
                color: white;
                padding: 2px 8px;
                border-radius: 10px;
                font-size: 11px;
                margin-left: 8px;
                text-transform: uppercase;
                font-weight: 700;
              ">
                ${action.priority}
              </span>
            </p>
            <p style="
              margin: 0;
              font-size: 14px;
              color: ${colors.textLight};
            ">
              ${action.description}
            </p>
          </div>
        `).join('')}
      </td>
    </tr>
  `;
}

function calculateAverageConfidence(fieldPlan) {
  const scores = [
    fieldPlan.confidenceReasonable,
    fieldPlan.confidenceData,
    fieldPlan.confidencePlan,
    fieldPlan.confidenceCapacity,
    fieldPlan.confidenceSkills,
    fieldPlan.confidenceGoals
  ].filter(score => score && !isNaN(score));

  return scores.length > 0
    ? scores.reduce((a, b) => a + b, 0) / scores.length
    : 0;
}
```

### 11. Email Footer

```javascript
function buildEmailFooter(colors) {
  return `
    <tr>
      <td style="
        background-color: ${colors.background};
        padding: 30px;
        text-align: center;
        border-radius: 0 0 8px 8px;
        border-top: 1px solid ${colors.border};
      ">
        <p style="
          margin: 0 0 10px 0;
          font-size: 14px;
          color: ${colors.textLight};
        ">
          Alabama Forward Field Planning System
        </p>
        <p style="
          margin: 0 0 15px 0;
          font-size: 12px;
          color: ${colors.textLight};
        ">
          This email was automatically generated when a new field plan was submitted.
        </p>
        <p style="margin: 0; font-size: 12px;">
          <a href="mailto:datateam@alforward.org" style="
            color: ${colors.primary};
            text-decoration: none;
            font-weight: 600;
          ">
            Contact Data Team
          </a>
        </p>
      </td>
    </tr>
  `;
}
```

---

## Helper Functions

### Formatting Utilities

```javascript
// Format arrays into readable comma-separated strings
function formatArray(arr) {
  if (!arr) return 'None specified';
  if (!Array.isArray(arr)) return arr.toString() || 'None specified';
  if (arr.length === 0) return 'None specified';
  return arr.join(', ');
}

// Build a reusable section header
function buildSectionHeader(title, emoji, colors) {
  return `
    <h2 style="
      margin: 0 0 20px 0;
      font-size: 20px;
      font-weight: 600;
      color: ${colors.text};
      padding-bottom: 10px;
      border-bottom: 2px solid ${colors.border};
    ">
      ${emoji} ${title}
    </h2>
  `;
}

// Build a reusable info row
function buildInfoRow(label, value, emoji, colors) {
  return `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid ${colors.border};">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
          <tr>
            <td style="width: 40px; vertical-align: top;">
              <span style="font-size: 20px;">${emoji}</span>
            </td>
            <td style="vertical-align: top;">
              <strong style="
                display: block;
                font-size: 14px;
                color: ${colors.textLight};
                margin-bottom: 4px;
              ">
                ${label}
              </strong>
              <span style="
                font-size: 15px;
                color: ${colors.text};
                line-height: 1.4;
              ">
                ${value || 'Not specified'}
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}
```

---

## Integration with Apps Script

### Update sendFieldPlanEmail() Function

Replace the existing email body generation with:

```javascript
function sendFieldPlanEmail(fieldPlan, rowNumber = null) {
  if (!fieldPlan) {
    Logger.log('Error: fieldPlan object is undefined');
    return;
  }

  // Configuration
  const config = {
    recipientEmails: (scriptProps.getProperty('EMAIL_RECIPIENTS') || 'datateam@alforward.org').split(','),
    maxRetries: 3,
    retryDelay: 1000
  };

  // Validate emails
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validEmails = config.recipientEmails.filter(email => validateEmail(email));

  if (validEmails.length === 0) {
    Logger.log("No valid recipient email addresses found");
    return;
  }

  try {
    // Get row data for tactics
    const sheet = SpreadsheetApp.getActive().getSheetByName('2026_field_plan');
    let rowData;

    if (rowNumber) {
      rowData = sheet.getRange(rowNumber, 1, 1, sheet.getLastColumn()).getValues()[0];
    } else {
      // Find row by org name
      const allData = sheet.getDataRange().getValues();
      for (let i = 1; i < allData.length; i++) {
        if (allData[i][FieldPlan.COLUMNS.MEMBERNAME] === fieldPlan.memberOrgName) {
          rowData = allData[i];
          break;
        }
      }
    }

    // Get tactics
    const tactics = getTacticInstances(rowData);

    // BUILD THE NEW BEAUTIFUL EMAIL
    const emailBody = buildFieldPlanEmailHTML(fieldPlan, tactics);

    // Send with retry logic
    let attempt = 1;
    let success = false;

    while (attempt <= config.maxRetries && !success) {
      try {
        MailApp.sendEmail({
          to: validEmails.join(','),
          subject: `🎯 New Field Plan: ${fieldPlan.memberOrgName || 'Unknown Organization'}`,
          htmlBody: emailBody,
          name: "Alabama Forward Field Planning",
          replyTo: scriptProps.getProperty('EMAIL_REPLY_TO') || "datateam@alforward.org"
        });
        success = true;
        Logger.log('Email sent successfully');
      } catch (error) {
        Logger.log(`Attempt ${attempt} failed: ${error.message}`);
        if (attempt < config.maxRetries) {
          Utilities.sleep(config.retryDelay);
          attempt++;
        } else {
          throw error;
        }
      }
    }
  } catch (error) {
    Logger.log(`Error in sendFieldPlanEmail: ${error.message}`);
    // Send error notification
    MailApp.sendEmail({
      to: validEmails.join(','),
      subject: '⚠️ Error in Field Plan Email Processing',
      body: `Error processing field plan for ${fieldPlan.memberOrgName}: ${error.message}`,
      name: "Field Plan Error Notification"
    });
  }
}
```

---

## Customization Guide

### Changing Colors

Update the `colors` object in `buildFieldPlanEmailHTML()`:

```javascript
const colors = {
  primary: '#YOUR_PRIMARY_COLOR',      // Main brand color
  secondary: '#YOUR_SECONDARY_COLOR',  // Secondary brand color
  accent: '#YOUR_ACCENT_COLOR',        // Highlight color
  // ... other colors
};
```

### Adding Your Logo

Add to the header section:

```javascript
<img src="https://your-domain.com/logo.png"
     alt="Alabama Forward Logo"
     style="
       max-width: 200px;
       height: auto;
       margin-bottom: 20px;
     ">
```

### Changing Fonts

Replace the font-family in the body style:

```javascript
font-family: 'Your Font', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
```

### Adding/Removing Sections

Comment out or remove unwanted section builders:

```javascript
// ${buildContactSection(fieldPlan, colors)}  <!-- Commented out -->
```

---

## Testing & Validation

### Test Checklist

- [ ] Send test email to yourself
- [ ] Open in Gmail (web)
- [ ] Open in Gmail (mobile app)
- [ ] Open in Outlook (web)
- [ ] Open in Outlook (desktop)
- [ ] Open in Apple Mail (Mac/iPhone)
- [ ] Test with screen reader
- [ ] Check all links work
- [ ] Verify images load (if using)
- [ ] Test with missing data fields
- [ ] Test with maximum data fields
- [ ] Check emoji display across clients

### Testing Function

```javascript
function testNewEmailDesign() {
  Logger.log('Testing new email design...');

  try {
    // Get a test field plan
    const fieldPlan = FieldPlan.fromLastRow();

    // Override recipient to send only to yourself
    const originalRecipients = scriptProps.getProperty('EMAIL_RECIPIENTS');
    scriptProps.setProperty('EMAIL_RECIPIENTS', 'your-email@example.com');

    // Send test email
    const sheet = SpreadsheetApp.getActive().getSheetByName('2026_field_plan');
    const lastRow = sheet.getLastRow();

    sendFieldPlanEmail(fieldPlan, lastRow);

    // Restore original recipients
    scriptProps.setProperty('EMAIL_RECIPIENTS', originalRecipients);

    Logger.log('✅ Test email sent successfully!');
    Logger.log('Check your inbox: your-email@example.com');
  } catch (error) {
    Logger.log(`❌ Test failed: ${error.message}`);
  }
}
```

---

## Best Practices

### DO ✅
- Use inline CSS for all styling
- Test across multiple email clients
- Keep file size under 100KB
- Use web-safe fonts
- Provide text alternatives for emojis
- Include clear call-to-action buttons
- Use descriptive alt text for images
- Make content scannable with headings
- Use adequate padding and spacing
- Include a plain text version (optional)

### DON'T ❌
- Use JavaScript
- Use external CSS files
- Use background images (unreliable)
- Use CSS animations
- Use forms or input elements
- Use relative URLs
- Assume advanced CSS will work
- Make the email too wide (600px max)
- Forget mobile users
- Use tiny font sizes (14px minimum)

---

## Troubleshooting

### Email Looks Broken in Outlook
- Outlook uses Word rendering engine
- Avoid: flexbox, grid, advanced CSS
- Solution: Use tables for layout

### Emojis Don't Display
- Some email clients block emojis
- Solution: Use emoji-safe alternatives or Unicode

### Colors Look Different
- Email clients may override colors
- Solution: Test in multiple clients, use high contrast

### Email is Too Wide on Mobile
- Max width should be 600px
- Solution: Set max-width on main table

### Images Don't Load
- Gmail blocks images by default
- Solution: Use fully qualified URLs, include alt text

---

## Next Steps

1. **Implement the Template**
   - Copy all functions to your Apps Script project
   - Update the colors object with your branding
   - Test with sample data

2. **Customize Sections**
   - Add/remove sections based on your needs
   - Adjust spacing and sizing
   - Add your logo

3. **Test Thoroughly**
   - Send test emails to multiple addresses
   - Open in different email clients
   - Check mobile display

4. **Deploy to Production**
   - Update sendFieldPlanEmail() function
   - Monitor first few emails
   - Gather feedback from recipients

5. **Iterate and Improve**
   - Track open rates
   - Survey recipients
   - Refine based on feedback

---

**Created:** 2025-12-26
**Version:** 1.0
**Compatible with:** Google Apps Script, Gmail, Outlook, Apple Mail
