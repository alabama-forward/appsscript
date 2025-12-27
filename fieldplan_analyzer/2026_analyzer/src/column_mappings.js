/**
 * 2026 Field Plan Column Mappings
 * 
 * This file contains all column index mappings for the 2026 field plan
 * Google sheets uses 0-indexing (first column = 0)
 * 
 * IMPORTANT: When the spreadsheet structure changes, only update this file
 * 
 * Last Updated: 2025-12-26
 * Form Version: 2026-Jan
 * Total columns: 73 (Columns 0-72)
 */

//===============================
//FIELD PLAN PARENT CLASS COLUMNS
//===============================

const FIELD_PLAN_COLUMNS = {
    //Meta
    SUBMISSIONDATE: 0,
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
    PRECINCTS: 25,
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
    CONFIDENCEREASONABLE: 65,
    CONFIDENCEDATA: 66,
    CONFIDENCEPLAN: 67,
    CONFIDENCECAPACITY: 68,
    CONFIDENCESKILLS: 69,
    CONFIDENCEGOALS: 70,
    //Submission metadata
    SUBMISSIONURL: 71,
    SUBMISSIONID: 72
    
}

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
    RELATIONAL: {
        PROGRAMLENGTH: 49,
        WEEKLYVOLUNTEERS: 50,
        WEEKLYHOURS: 51,
        HOURLYATTEMPTS: 52
    },
    REGISTRATION: {
        PROGRAMLENGTH: 53,
        WEEKLYVOLUNTEERS: 54,
        WEEKLYHOURS: 55,
        HOURLYATTEMPTS: 56
    },
    MAIL: {
        PROGRAMLENGTH: 61,
        WEEKLYVOLUNTEERS: 62,
        WEEKLYHOURS: 63,
        HOURLYATTEMPTS: 64
    }
}