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

### Budget Class (`budget_class.js`)

The FieldBudget class provides comprehensive budget analysis capabilities:

#### Core Methods
- `fromLastRow()`: Gets the most recent budget entry
- `fromFirstRow()`: Gets the first budget entry after the header
- `fromSpecificRow(rowNumber)`: Gets a specific budget by row
- `sumNotOutreach()`: Calculates total indirect costs (admin, data, travel, etc.) with percentage of total
- `sumOutreach()`: Calculates total outreach costs (canvass, phone, text, event, digital) with percentage
- `needDataStipend()`: Calculates data stipend needs based on hourly rate ($20/hour)
- `requestSummary()`: Enhanced summary that handles negative gaps and null values
- `markAsAnalyzed()`: Marks a specific budget row as analyzed

#### Static Methods
- `countAnalyzed()`: Returns count of analyzed vs unanalyzed budgets
- `getUnanalyzedBudgets()`: Returns array of all unanalyzed budget objects with row numbers

### Matching Process
The system intelligently matches field plans with budgets:
1. Searches for exact organization name matches with enhanced normalization
2. Handles whitespace, line breaks, and special characters in organization names
3. Falls back to case-insensitive matching when exact matching fails
4. Tracks unmatched documents for up to 72 hours
5. Sends alerts if matching documents aren't submitted within threshold
6. Automatically triggers analysis when matches are found
7. Removes tracking entries after successful matching

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

### 4. Cross-Document Tracking System
The system maintains bidirectional tracking between field plans and budgets:
- `trackMissingFieldPlan()`: Tracks budgets waiting for field plans
- `trackMissingBudget()`: Tracks field plans waiting for budgets
- `checkForMissingFieldPlans()`: Monitors budgets without field plans > 72 hours
- `checkForMissingBudgets()`: Monitors field plans without budgets > 72 hours
- `sendMissingFieldPlanNotification()`: Sends alerts for missing field plans
- `sendMissingBudgetNotification()`: Sends alerts for missing budgets

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
- **County-by-county program distribution**

### Funding Recommendations
- **Gap funding analysis** with efficiency impact
- **Reallocation suggestions** between tactics
- **Priority funding** recommendations
- **Data stipend** calculations ($20/hour labor equivalent)
- **Funding proportion analysis** (indirect vs outreach costs)

### Weekly Summary Reports
The system generates comprehensive weekly summaries including:
- **Tactic distribution**: Shows which tactics are most commonly used
- **Geographic coverage**: County-by-county program breakdown
- **Coaching needs**: High/Medium/Low categorization based on confidence scores
- **Budget submission tracking**: Organizations with/without matching documents
- **Processing statistics**: Number of plans and budgets analyzed

## Key Features

### Multi-dimensional Validation
- Validates all numeric inputs for data integrity
- Email address validation using regex patterns
- County name parsing for multi-word counties (e.g., "Saint Clair")
- Array field normalization for various input formats
- Null value handling throughout the system
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
- Email retry logic (3 attempts with 1-second delays)
- Fallback error notifications if main email fails
- Sheet access validation before operations
- Row number validation for valid ranges

## Configuration

### Required Script Properties
```
SPREADSHEET_ID - Google Sheet containing data
SHEET_FIELD_PLAN - Field plan sheet name (default: '2025_field_plan')
SHEET_FIELD_BUDGET - Budget sheet name (default: '2025_field_budget')
EMAIL_RECIPIENTS - Comma-separated email list
EMAIL_TEST_RECIPIENTS - Test mode recipients (default: datateam@alforward.org)
LAST_PROCESSED_ROW - Tracks field plan processing
TRIGGER_MISSING_PLAN_THRESHOLD_HOURS - Hours before alerting (default: 72)
TRIGGER_BUDGET_ANALYSIS_HOURS - Budget analysis interval (default: 12)
TRIGGER_WEEKLY_SUMMARY_DAY - Day for weekly summary (default: MONDAY)
TRIGGER_WEEKLY_SUMMARY_HOUR - Hour for weekly summary (default: 9)
TRIGGER_FIELD_PLAN_CHECK_HOURS - Field plan check interval (default: 12)
```

### Cost Target Configuration
Each tactic has configurable targets with standard deviations:
```
COST_TARGET_DOOR - Door knocking cost per attempt (default: 1.00)
COST_TARGET_DOOR_STDDEV - Standard deviation (default: 0.20)
COST_TARGET_PHONE - Phone banking cost per attempt (default: 0.66)
COST_TARGET_PHONE_STDDEV - Standard deviation (default: 0.15)
COST_TARGET_TEXT - Text messaging cost per attempt (default: 0.02)
COST_TARGET_TEXT_STDDEV - Standard deviation (default: 0.01)
COST_TARGET_OPEN - Open events cost per attempt (default: 0.40)
COST_TARGET_OPEN_STDDEV - Standard deviation (default: 0.10)
```

## Usage

### Automatic Processing
The system runs automatically every 12 hours, processing new submissions and generating reports without manual intervention.

### Manual Functions
- `analyzeSpecificOrganization(orgName, isTestMode)`: Manually analyze a specific organization
- `generateWeeklySummary()`: Generate summary report on demand
- `checkForNewRows()`: Manually trigger field plan processing
- `processBudget(budgetRow, isTest)`: Process a specific budget row
- `findMatchingFieldPlan(orgName)`: Find matching field plan for an organization
- `findMatchingBudget(orgName)`: Find matching budget for an organization

### Testing Framework
The application includes a comprehensive testing suite with 20+ test functions:

#### Field Plan Tests
- `testMostRecentFieldPlan()`: Tests email for most recent entry
- `testMissingBudgetNotification()`: Tests missing budget alerts
- `testTrackMissingBudget()`: Tests tracking functionality
- `testFindMatchingBudget()`: Tests budget matching logic
- `runAllFieldPlanTests()`: Runs complete field plan test suite

#### Budget Tests
- `testBudgetClass()`: Tests all budget class methods
- `testAnalyzeOrg()`: Tests full analysis flow
- `testEmailFormatting()`: Tests email generation
- `testWeeklySummary()`: Tests weekly summary generation
- `testEnhancedMatching()`: Tests normalized name matching
- `runAllBudgetTests()`: Runs complete budget test suite

#### Debug Utilities
- `debugMatchingIssue()`: Advanced debugging for name matching
- `debugBudgetNullValues()`: Debugs null value issues
- `viewAllMissingTrackings()`: Displays all tracking entries
- `viewBudgetAnalysisStatus()`: Shows analysis status summary

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

## Additional Features

### UI Integration
- Custom menu system for running tests directly from the spreadsheet
- Dialog prompts for test email input
- Interactive test result displays

### Email System
- HTML formatted emails with tables and styling
- Rich formatting for tactic analysis sections
- Color-coded status indicators
- Comprehensive error notifications with stack traces

### State Management
- Atomic Script Property updates for persistent state
- Cross-execution tracking using Script Properties
- Automatic cleanup of completed tracking entries

## OAuth Scopes Required

The application requires the following Google OAuth scopes:
- `https://mail.google.com/` - Gmail access
- `https://www.googleapis.com/auth/script.send_mail` - Send email
- `https://www.googleapis.com/auth/spreadsheets` - Spreadsheet access
- `https://www.googleapis.com/auth/gmail.send` - Gmail send
- `https://www.googleapis.com/auth/gmail.compose` - Gmail compose
- `https://www.googleapis.com/auth/gmail.modify` - Gmail modify
- `https://www.googleapis.com/auth/script.scriptapp` - Script app access
- `https://www.googleapis.com/auth/userinfo.email` - User email access

## Future Enhancements

Potential improvements for consideration:
- Real-time processing capabilities
- Fuzzy name matching algorithm
- Web dashboard for interactive analysis
- Historical trend analysis
- API integration for external systems
- Mobile app for field updates