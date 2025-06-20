# FieldPlan Analyzer - Detailed Field Plan Analysis Process

## Overview

The fieldplan_analyzer is a Google Apps Script application that performs sophisticated analysis of field organizing plans and budgets. It automatically processes submissions, calculates cost efficiency metrics, validates program feasibility, and provides intelligent recommendations for fund allocation.

## Core Architecture

The fieldplan_analyzer monitors two Google Sheets:
- **2025_field_plan**: Contains 58 columns of field plan data
- **2025_field_budget**: Contains 55 columns of budget data

When new field plans are submitted, they trigger a comprehensive analysis process that matches plans with budgets, analyzes cost efficiency, and generates detailed reports.

## Field Plan Analysis Components

### 1. Base FieldPlan Class (`field_plan_parent_class.js`)

The foundation of the analysis system, this class:
- Parses raw row data from the spreadsheet
- Extracts and normalizes 58 data fields including:
  - Organization contact information
  - Data storage preferences
  - Field tactics selection
  - Geographic coverage (counties)
  - Demographics targeting (race, age, gender, affinity groups)
  - Coaching needs assessment (1-10 confidence scale)

Key methods:
- `fromLastRow()`: Gets the most recent field plan entry
- `fromSpecificRow(rowNumber)`: Gets a specific field plan by row
- `needsCoaching()`: Assesses coaching requirements based on confidence score

### 2. FieldProgram Extension (`field_program_extension_class.js`)

Extends FieldPlan with program-specific calculations:
- Validates numeric data for each tactic
- Calculates key metrics:
  - **Total volunteer hours**: `weeklyVolunteers × weeklyHours × programLength`
  - **Program attempts**: `programLength × weeklyVolunteers × weeklyHours × hourlyAttempts`
  - **Weekly attempts** per tactic
  - **Reasonable ranges** for volunteer workload

The class ensures data integrity by validating all numeric inputs and throwing errors for invalid data.

### 3. Tactic-Specific Analysis (`field_tactics_extension_class.js`)

Each field tactic has a specialized class with unique analysis parameters:

#### Phone Banking (PhoneTactic)
- **Contact rate**: 5-10%
- **Reasonable attempts**: 30/hour per volunteer
- **Cost target**: $0.66/attempt (±$0.15)
- Analyzes whether phone banking expectations are realistic

#### Door Knocking (DoorTactic)
- **Contact rate**: 5-10%
- **Reasonable attempts**: 30/hour per volunteer
- **Cost target**: $1.00/attempt (±$0.20)
- Evaluates door-to-door canvassing efficiency

#### Text Messaging (TextTactic)
- **Response rate**: 1-5%
- **Reasonable attempts**: 2000/hour per volunteer
- **Cost target**: $0.02/attempt (±$0.01)
- Validates high-volume text banking programs

#### Open Events/Tabling (OpenTactic)
- **Contact rate**: 10-20%
- **Reasonable attempts**: 60/hour per volunteer
- **Cost target**: $0.40/attempt (±$0.10)
- Assesses public event engagement strategies

#### Relational Organizing (RelationalTactic)
- **Success rate**: 50-70%
- **Reasonable attempts**: 30/hour per volunteer
- Focuses on peer-to-peer organizing effectiveness

#### Voter Registration (RegistrationTactic)
- **Success rate**: 10-30%
- **Reasonable attempts**: 5/hour per volunteer
- Evaluates registration drive efficiency

#### Mail (MailTactic)
- **Response rate**: 70-90%
- **Reasonable attempts**: 1000/hour per volunteer
- Analyzes direct mail campaign logistics

## Budget-Field Plan Integration

### Matching Process
The system intelligently matches field plans with budgets:
1. Searches for exact organization name matches
2. Tracks unmatched budgets for up to 72 hours
3. Sends alerts if field plans aren't submitted within threshold
4. Automatically triggers analysis when matches are found

### Cost Analysis Algorithm
For each tactic, the system:
1. Calculates **cost per attempt**: `fundingRequested / programAttempts`
2. Compares against target costs with standard deviations
3. Categorizes funding as:
   - **Within range**: Appropriately funded
   - **Below target**: Potentially underfunded
   - **Above target**: Potentially overfunded
4. Generates specific recommendations for optimization

### Gap Analysis
The system performs sophisticated gap funding analysis:
1. Identifies funding gaps by category
2. Calculates impact of gap funding on cost per attempt
3. Determines if increased funding maintains efficiency
4. Provides specific recommendations for gap allocation

## Automated Processing Flow

### 1. Field Plan Detection
- `checkForNewRows()` runs every 12 hours via time-based trigger
- Compares current row count with last processed row
- Creates FieldPlan objects for each new submission
- Updates tracking to prevent duplicate processing

### 2. Email Notification System
Generates comprehensive HTML emails containing:
- Organization details and contact information
- Program overview with timeline and scope
- Tactic-specific metrics:
  - Funding requested vs. program attempts
  - Cost per attempt analysis
  - Expected contact/success rates
  - Volunteer workload assessment
- Coaching recommendations based on confidence scores
- Gap funding opportunities

### 3. Budget Analysis Trigger
When a field plan is submitted:
1. System checks for matching unanalyzed budgets
2. Automatically triggers budget analysis if match found
3. Removes organization from missing plan tracking
4. Sends comprehensive analysis email

## Analysis Outputs

### Cost Efficiency Report
- **Cost per attempt** for each tactic
- **Comparison to targets** with visual indicators
- **Status classification** (within/above/below range)
- **Specific recommendations** for fund reallocation

### Program Feasibility Assessment
- **Volunteer workload** analysis per tactic
- **Reasonable range** indicators
- **Risk assessments** for unrealistic expectations
- **Suggestions** for program adjustments

### Expected Outcomes Projection
- **Total program attempts** by tactic
- **Expected successful contacts** based on standard rates
- **Program duration** and volunteer requirements
- **Geographic and demographic reach**

### Funding Recommendations
- **Gap funding analysis** with efficiency impact
- **Reallocation suggestions** between tactics
- **Priority funding** recommendations
- **Data stipend** calculations

## Key Features

### Multi-dimensional Validation
- Validates all numeric inputs for data integrity
- Checks volunteer workload against reasonable thresholds
- Ensures cost efficiency across all tactics
- Flags potential data entry errors

### Intelligent Recommendation Engine
- Analyzes funding distribution across tactics
- Identifies optimization opportunities
- Suggests specific reallocation amounts
- Maintains efficiency while addressing gaps

### Comprehensive Tracking System
- Monitors processing status for all submissions
- Tracks missing field plans with timeout alerts
- Generates weekly summary reports
- Maintains audit trail of all analyses

### Configurable Parameters
All analysis parameters can be configured via Script Properties:
- Cost targets and standard deviations per tactic
- Email recipient lists
- Processing intervals
- Alert thresholds

## Technical Implementation

### Class Hierarchy
```
FieldPlan (Base Class)
    └── FieldProgram (Extension)
            ├── PhoneTactic
            ├── DoorTactic
            ├── OpenTactic
            ├── RelationalTactic
            ├── RegistrationTactic
            ├── TextTactic
            └── MailTactic
```

### Data Flow
1. **Input**: Raw spreadsheet data (58 columns)
2. **Processing**: Class instantiation and validation
3. **Analysis**: Metric calculation and comparison
4. **Output**: Email reports and spreadsheet updates

### Error Handling
- Try-catch blocks prevent complete failures
- Individual row errors don't stop batch processing
- Error notifications sent to administrators
- Detailed logging for debugging

## Configuration

### Required Script Properties
```
SPREADSHEET_ID - Google Sheet containing data
SHEET_FIELD_PLAN - Field plan sheet name (default: '2025_field_plan')
SHEET_FIELD_BUDGET - Budget sheet name (default: '2025_field_budget')
EMAIL_RECIPIENTS - Comma-separated email list
LAST_PROCESSED_ROW - Tracks field plan processing
TRIGGER_MISSING_PLAN_THRESHOLD_HOURS - Hours before alerting (default: 72)
```

### Cost Target Configuration
Each tactic has configurable targets:
```
COST_TARGET_[TACTIC] - Target cost per attempt
COST_TARGET_[TACTIC]_STDDEV - Standard deviation for range
```

Example: `COST_TARGET_DOOR: 1.00, COST_TARGET_DOOR_STDDEV: 0.20`

## Usage

### Automatic Processing
The system runs automatically every 12 hours, processing new submissions and generating reports without manual intervention.

### Manual Functions
- `analyzeSpecificOrganization(orgName, isTestMode)`: Manually analyze a specific organization
- `generateWeeklySummary()`: Generate summary report on demand
- `checkForNewRows()`: Manually trigger field plan processing

### Testing
All email functions support test mode, which sends emails only to the data team for validation before production use.

## Best Practices

1. **Data Entry**: Ensure organization names match exactly between field plans and budgets
2. **Timely Submission**: Submit field plans within 72 hours of budget submission
3. **Realistic Planning**: Set achievable volunteer hour and attempt targets
4. **Regular Monitoring**: Review weekly summary reports for trends
5. **Configuration Updates**: Adjust cost targets based on program evolution

## Limitations

- **Name Matching**: Requires exact organization name matches
- **Processing Schedule**: 12-hour intervals (not real-time)
- **Data Validation**: Assumes correctly formatted spreadsheet data
- **Email Reporting**: No web dashboard (email-only reporting)
- **Historical Data**: Focuses on current state (limited historical analysis)

## Future Enhancements

Potential improvements for consideration:
- Real-time processing capabilities
- Fuzzy name matching algorithm
- Web dashboard for interactive analysis
- Historical trend analysis
- API integration for external systems
- Mobile app for field updates