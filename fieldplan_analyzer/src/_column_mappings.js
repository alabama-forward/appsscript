/**
 * 2026 Field Plan Column Mappings
 * 
 * This file contains all column index mappings for the 2026 field plan
 * Google sheets uses 0-indexing (first column = 0)
 * 
 * IMPORTANT: When the spreadsheet structure changes, only update this file
 * 
 * Last Updated: 2026-04-01
 * Form Version: 2026-Apr
 * Total columns: 68 (Columns 0-67)
 */

//===============================
// FIELD PLAN PARENT CLASS COLUMNS
//===============================

const FIELD_PLAN_COLUMNS = {
    //Meta
    SUBMISSIONDATETIME: 0,
    //
    ATTENDEDTRAINING: 1,
    //Contact
    MEMBERNAME: 2,
    FIRSTNAME: 3,
    LASTNAME: 4,
    CONTACTEMAIL: 5, 
    CONTACTPHONE: 6,
    //Data & Tools
    DATASTORAGE: 7,
    DATASTIPEND: 8,
    DATAPLAN: 9,
    VANCOMMITTEE: 10,
    DATASHARE: 11,
    SHAREORG: 12,
    PROGRAMTOOLS: 13,
    PROGRAMDATES: 14,
    PROGRAMTYPES: 15,
    //Geo & Tactics
    FIELDTACTICS: 16,
    TEACHCOMFORTABLE: 17,
    FIELDSTAFF: 18,
    FIELDNARRATIVE: 19,
    REVIEWEDPLAN: 20,
    RUNNINGFOROFFICE: 21,
    FIELDCOUNTIES: 22,
    CITIES: 23,
    KNOWSPRECINCTS: 24,
    FIELDPRECINCTS: 25,
    DIFFPRECINCTS: 26,
    SPECIALGEO: 27,
    //Demos
    DEMORACE: 28,
    DEMOAGE: 29,
    DEMOGENDER: 30,
    DEMOAFFINITY: 31,
    DEMONOTES: 32,
    DEMOCONFIDENCE: 33,
    //Acknowledgements
    UNDERSTANDSREASONABLE: 34,
    UNDERSTANDSDISBURSEMENT: 35,
    UNDERSTANDSTRAINING: 36,
    //Confidence & self-assessment NEW to 2026
    CONFIDENCEREASONABLE: 57,
    CONFIDENCEDATA: 58,
    CONFIDENCEPLAN: 59,
    CONFIDENCECAPACITY: 60,
    CONFIDENCESKILLS: 61,
    CONFIDENCEGOALS: 62,
    //Submission metadata
    SUBMISSIONURL: 63,
    SUBMISSIONID: 64,
    //Query builder summary column (written by writeToFieldPlanSheet)
    QUERY_BUILDER_STATUS: 65,
    REPROCESS: 66,
    REPROCESS_QUERIES: 67
}

//===============================
// BUDGET CLASS COLUMNS
//===============================

// Budget columns are 0-indexed to match FIELD_PLAN_COLUMNS and Google
// Sheets getValues(). Verified against the 2026 budget CSV export.
const BUDGET_COLUMNS = {
FIRSTNAME: 0,
LASTNAME: 1,
CONTACTEMAIL: 2,
CONTACTPHONE: 3,
MEMBERNAME: 4,
ADMINREQUESTED: 5,
ADMINTOTAL: 6,
ADMINGAP: 7,
DATAREQUESTED: 8,
DATATOTAL: 9,
DATAGAP: 10,
TRAVELREQUESTED: 11,
TRAVELTOTAL: 12,
TRAVELGAP: 13,
COMMSREQUESTED: 14,
COMMSTOTAL: 15,
COMMSGAP: 16,
DESIGNREQUESTED: 17,
DESIGNTOTAL: 18,
DESIGNGAP: 19,
VIDEOREQUESTED: 20,
VIDEOTOTAL: 21,
VIDEOGAP: 22,
PRINTREQUESTED: 23,
PRINTTOTAL: 24,
PRINTGAP: 25,
POSTAGEREQUESTED: 26,
POSTAGETOTAL: 27,
POSTAGEGAP: 28,
TRAININGREQUESTED: 29,
TRAININGTOTAL: 30,
TRAININGGAP: 31,
SUPPLIESREQUESTED: 32,
SUPPLIESTOTAL: 33,
SUPPLIESGAP: 34,
CANVASSREQUESTED: 35,
CANVASSTOTAL: 36,
CANVASSGAP: 37,
PHONEREQUESTED: 38,
PHONETOTAL: 39,
PHONEGAP: 40,
TEXTREQUESTED: 41,
TEXTTOTAL: 42,
TEXTGAP: 43,
EVENTREQUESTED: 44,
EVENTTOTAL: 45,
EVENTGAP: 46,
DIGITALREQUESTED: 47,
DIGITALTOTAL: 48,
DIGITALGAP: 49,
REQUESTEDTOTAL: 50,
PROJECTTOTAL: 51,
GAPTOTAL: 52,
SUBMITFIELDPLAN: 53,
SUBMISSIONID: 54,
// ANALYZED is a metadata column added by the code (markAsAnalyzed)
ANALYZED: 55,
REPROCESS: 56
};

//===============================
// PROGRAM CLASS COLUMNS
//===============================

const PROGRAM_COLUMNS = {
    PHONE: {
        PROGRAMLENGTH: 37,
        WEEKLYVOLUNTEERS: 38,
        WEEKLYHOURS: 39,
        HOURLYATTEMPTS: 40
    },
    DOOR: {
        PROGRAMLENGTH: 41,
        WEEKLYVOLUNTEERS: 42,
        WEEKLYHOURS: 43,
        HOURLYATTEMPTS: 44
    },
    OPEN: {
        PROGRAMLENGTH: 45,
        WEEKLYVOLUNTEERS: 46,
        WEEKLYHOURS: 47,
        HOURLYATTEMPTS: 48
    },
    TEXT: {
        PROGRAMLENGTH: 49,
        WEEKLYVOLUNTEERS: 50,
        WEEKLYHOURS: 51,
        HOURLYATTEMPTS: 52
    },
    MAIL: {
        PROGRAMLENGTH: 53,
        WEEKLYVOLUNTEERS: 54,
        WEEKLYHOURS: 55,
        HOURLYATTEMPTS: 56
    }
}

//===============================
// COLUMN QUESTIONS
//===============================
/**
 * Maps column constant names to their actual form question
 */

const COLUMN_QUESTIONS = {
    //Meta
    SUBMISSIONDATETIME: "Submission Date",

    //Training & Preparation
    ATTENDEDTRAINING: "Did you attend the Field Planning Training offered by the Data Team or receive any coaching from the Field Team before completing this form?",

    //Contact Information
    MEMBERNAME: "Table Member Organization Name",
    FIRSTNAME: "Data & Tech Contact on Your Team - First Name",
    LASTNAME: "Data & Tech Contact on Your Team - Last Name",
    CONTACTEMAIL: "Data & Tech Contact's Email",
    CONTACTPHONE: "Data & Tech Contact's Phone",

    //Data & Tools
    DATASTORAGE: "Where will you store data related to your voter engagement?",
    DATASTIPEND: "You marked \"Paper\" or \"Spreadsheet\"... have you applied for a \"Data Entry\" stipend?",
    DATAPLAN: "You marked \"Paper\" or \"Spreadsheet\"... What is your plan for digitizing your data?",
    VANCOMMITTEE: "Do you have an active VAN committee at Alabama Forward?",
    DATASHARE: "Are there table members or partners with whom you would like to share your data?",
    SHAREORG: "Please mark the partner organizations with whom you would like to share your data",
    PROGRAMTOOLS: "What tools would you like access to for your program?",
    PROGRAMDATES: "What is the start date and end date of your program?",
    PROGRAMTYPES: "Select any of the activities below that will be part of your program",

    //Tactics & Locations
    FIELDTACTICS: "What tactics will you use to reach your targets?",
    TEACHCOMFORTABLE: "Mark the tactics below that you would feel comfortable teaching to other table members",
    FIELDSTAFF: "Who will make contact attempts for your program?",

    //Has multiple sub-questions 
    FIELDNARRATIVE: {
        main: "Use this space to answer the questions above",
        subQuestions: [
            "What is your field program? What do you plan to do?",
            "What issues are you working on this year?",
            "What impact do you want to have and why?",
            "Describe how you are well-positioned to execute the program?",
            "How does this program build longterm power beyond elections?"
        ],
        fullQuestion: "Field Program Narrative: \n" +
            "• What is your field program? What do you plan to do?\n" +
            "• What issues are you working on this year?\n" +
            "• What impact do you want to have and why?\n" +
            "• Describe how you are well-positioned to execute the program?\n" +
            "• How does this program build longterm power beyond elections?"
    },
    REVIEWEDPLAN: "I have fully reviewed the Table Field Plan to understand our table-wide field coordination efforts for 2026",
    RUNNINGFOROFFICE: "Is anyone from your staff, board, or active volunteer network running for elected office in any of the districts you added to your field plan?",
    FIELDCOUNTIES: "In what counties will you conduct your program?",
    CITIES: "If you plan to work in specific cities, add each of them below. Add one city at a time.",
    KNOWSPRECINCTS: "Do you know the specific precincts you will target with your program?",
    FIELDPRECINCTS: "Add your precincts below. Add your precincts one at a time.",
    DIFFPRECINCTS: "To avoid over-saturation, we may limit our table coordination to 2 members per precinct. Are you willing to work in a precinct other than the ones you listed?",
    SPECIALGEO: "Mark if any of these special geographic areas apply to your program",

    //Demographics
    DEMORACE: "These are the racial and ethnic demographics I intend to reach through my program:",
    DEMOAGE: "These are the age demographics I intend to reach through my programs:",
    DEMOGENDER: "These are the gender and sexuality demographics I intend to reach through my programs:",
    DEMOAFFINITY: "These are additional communities I intend to reach through my programs:",
    DEMONOTES: "[If needed] Use the space below to describe your demographic targets more clearly.",
    DEMOCONFIDENCE: "I believe that my organization will effectively reach and be able to maintain relationships with all of the communities I marked above",

    //Acknowledgements
    UNDERSTANDSREASONABLE: "I understand that our field plan and associated grant applications will be primarily reviewed for how reasonable and realistic our goals are.",
    UNDERSTANDSDISBURSEMENT: "I understand that if we apply for a field-related grant, our grant disbursement will be delayed if the goals listed below aren't both reasonable and realistic.",
    UNDERSTANDSTRAINING: "I understand that attending or reviewing the Field Planning training will set us up for success when setting our goals.",

    //Confidence & Self-assessment
    CONFIDENCEREASONABLE: "I feel confident that the field plan I am submitting meets the \"reasonable and realistic\" expectations set by the Alabama Forward data team.",
    CONFIDENCEDATA: "I feel confident in my organization's ability to use data and technology to execute our field programming",
    CONFIDENCEPLAN: "I feel confident in the field plan I am submitting for review by the data and field team",
    CONFIDENCECAPACITY: "I feel confident in my staff or volunteer capacity to implement my field plan",
    CONFIDENCESKILLS: "I feel like my organization is highly skilled in the field tactics we listed in our field plan",
    CONFIDENCEGOALS: "I feel confident that my organization can meet the attempt and contact goals we detailed in our field plan",

    //Submission Metadata
    SUBMISSIONURL: "Submission URL",
    SUBMISSIONID: "Submission ID"
};

/**
 * Maps program metric column names to their questions
 */
const PROGRAM_METRIC_QUESTIONS = {
    PROGRAMLENGTH: "Program Length (in weeks)",
    WEEKLYVOLUNTEERS: "Volunteers per Week",
    WEEKLYHOURS: "Hours per Week",
    HOURLYATTEMPTS: "Attempts each Hour"
};

//===============================
// VALIDATION FUNCTIONS
//===============================

/**
 * Validates that all column indices are unique and within expected range
 * Run this after making changes to ensure no conflicts
 * @returns {Object} Validation results with errors, warnings, and stats
 */
function validateColumnMappings() {
    const results = {
        valid: true,
        errors: [],
        warnings: [],
        stats: {}
    };

    // Gather all the column indices from FIELD_PLAN_COLUMNS
    const fieldPlanIndices = new Set();
    const duplicates = [];

    for (const [key, value] of Object.entries(FIELD_PLAN_COLUMNS)) {
        //Check if value is a number
        if (typeof value !== 'number') {
            results.errors.push(`FIELD_PLAN_COLUMNS.${key} is not a number: ${value}`);
            results.valid = false;
            continue;
        }

        //Warn about unusual indices
        if (value < 0 || value > 100) {
            results.warnings.push(`FIELD_PLAN_COLUMNS.${key} has unusual index: ${value}`);
        }

        //Check for duplicates by comparing index to set contents
        if (fieldPlanIndices.has(value)) {
            duplicates.push(`Column ${value} is mapped multiple times in FIELD_PLAN_COLUMNS`);
            results.valid = false;
        }
        fieldPlanIndices.add(value);
    }
    
    if (duplicates.length > 0) {
        results.errors.push(...duplicates); //The ... means unpack 
    }

    //Collect all column indices from PROGRAM_COLUMNS
    const programIndices = new Set();
    for (const [tacticName, metrics] of Object.entries(PROGRAM_COLUMNS)) {
        for (const [metricName, value] of Object.entries(metrics)) {
            if (typeof value !== 'number') {
                results.errors.push(`PROGRAM_COLUMNS.${tacticName}.${metricName} is not a number: ${value}`);
                results.valid = false;
                continue;
            }

            if (programIndices.has(value)) {
                results.errors.push(`Column ${value} is mapped multiple times in PROGRAM_COLUMNS`)
                results.valid = false;
            }
            programIndices.add(value);
        }
    }

    //Check for overlap between FIELD_PLAN and PROGRAM columns
    const overlap = [...fieldPlanIndices].filter(idx => programIndices.has(idx));
    if (overlap.length > 0) {
        results.errors.push(`Column overlap detected between FIELDPLAN and PROGRAM: ${overlap.join(', ')}`);
        results.valid = false;
    }

    // Calculate statistics
    results.stats = {
        totalFieldPlanColumns: fieldPlanIndices.size,
        totalProgramColumns: programIndices.size,
        totalMappedColumns: fieldPlanIndices.size + programIndices.size,
        fieldPlanRange: `${Math.min(...fieldPlanIndices)}-${Math.max(...fieldPlanIndices)}`,
        programRange: `${Math.min(...programIndices)}-${Math.max(...programIndices)}`
    };
    return results;
}

/**
 * Logs a comprehensive summary of all column mappings
 * Useful for documentation, debugging, and team communication
 */
function logColumnMappingSummary() {
  Logger.log('=== 2026 FIELD PLAN COLUMN MAPPINGS ===\n');

  // Field Plan Columns Summary
  Logger.log('FIELD_PLAN_COLUMNS:');
  Logger.log(`  Total: ${Object.keys(FIELD_PLAN_COLUMNS).length} columns mapped`);
  const fpValues = Object.values(FIELD_PLAN_COLUMNS);
  Logger.log(`  Range: ${Math.min(...fpValues)}-${Math.max(...fpValues)}`);
  Logger.log('');

  // Program Columns Summary
  Logger.log('PROGRAM_COLUMNS:');
  Logger.log(`  Tactics: ${Object.keys(PROGRAM_COLUMNS).length}`);
  const allProgramIndices = Object.values(PROGRAM_COLUMNS).flatMap(t => Object.values(t));
  Logger.log(`  Total Columns: ${allProgramIndices.length}`);
  Logger.log(`  Range: ${Math.min(...allProgramIndices)}-${Math.max(...allProgramIndices)}`);
  Logger.log('');

  // Run validation
  const validation = validateColumnMappings();
  Logger.log('VALIDATION:');
  Logger.log(`  Status: ${validation.valid ? '✅ Valid' : '❌ Invalid'}`);

  if (validation.errors.length > 0) {
    Logger.log('  Errors:');
    validation.errors.forEach(err => Logger.log(`    - ${err}`));
  }

  if (validation.warnings.length > 0) {
    Logger.log('  Warnings:');
    validation.warnings.forEach(warn => Logger.log(`    - ${warn}`));
  }

  Logger.log('');
  Logger.log('DETAILED STATS:');
  for (const [key, value] of Object.entries(validation.stats)) {
    Logger.log(`  ${key}: ${value}`);
  }
}

/**
 * Helper function to get a column name from an index
 * Useful for debugging when you know the index but forgot what it maps to
 * @param {number} index - Column index to look up
 * @returns {string} Column name(s) that use this index, or 'Not mapped'
 */
function getColumnNameByIndex(index) {
  const names = [];

  // Search FIELD_PLAN_COLUMNS
  for (const [key, value] of Object.entries(FIELD_PLAN_COLUMNS)) {
    if (value === index) {
      names.push(`FIELD_PLAN_COLUMNS.${key}`);
    }
  }

  // Search PROGRAM_COLUMNS
  for (const [tacticName, metrics] of Object.entries(PROGRAM_COLUMNS)) {
    for (const [metricName, value] of Object.entries(metrics)) {
      if (value === index) {
        names.push(`PROGRAM_COLUMNS.${tacticName}.${metricName}`);
      }
    }
  }

  return names.length > 0 ? names.join(', ') : 'Not mapped';
}

/**
 * Generates a complete column map as a formatted string
 * Useful for creating documentation or sharing with team
 * @returns {string} Formatted column mapping documentation
 */
function generateColumnMapDocumentation() {
  let doc = '=== 2026 FIELD PLAN COLUMN MAP ===\n\n';

  // Field Plan Columns
  doc += 'FIELD_PLAN_COLUMNS:\n';
  const sortedFieldPlan = Object.entries(FIELD_PLAN_COLUMNS)
    .sort((a, b) => a[1] - b[1]);

  sortedFieldPlan.forEach(([key, value]) => {
    doc += `  ${value.toString().padStart(3, ' ')} => ${key}\n`;
  });

  doc += '\nPROGRAM_COLUMNS:\n';

  // Program Columns by tactic
  for (const [tacticName, metrics] of Object.entries(PROGRAM_COLUMNS)) {
    doc += `  ${tacticName}:\n`;
    const sortedMetrics = Object.entries(metrics)
      .sort((a, b) => a[1] - b[1]);

    sortedMetrics.forEach(([key, value]) => {
      doc += `    ${value.toString().padStart(3, ' ')} => ${key}\n`;
    });
  }

  return doc;
}