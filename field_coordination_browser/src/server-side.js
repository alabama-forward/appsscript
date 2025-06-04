// Main server-side code for the Precinct Claim application

// Your spreadsheet ID - replace this with your actual spreadsheet ID
const SPREADSHEET_ID = '1E3yYNnPbrUNpdIU8TCjcKGtMe5T8qSuvh_1p_zkhZI0';

// Main server-side code for the Precinct Claim application - handles user interface and claim processing

/**
 * Creates menu items when the spreadsheet is opened
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Search Tools')
    .addItem('Reset Search & Dropdowns', 'resetSearchAndDropdowns')
    .addItem('Choose your precincts!', 'showStyledSearchInterface')
    .addToUi();
}

/**
 * Standard Apps Script function that runs when a cell is edited in the spreadsheet
 * @param {Object} e - The event object
 */
function onEdit(e) {
  // Get the edited range information
  let range = e.range;
  let sheet = range.getSheet();
  let sheetName = sheet.getName();
  let column = range.getColumn();
  
  // Check if the edit was in either dropdown column of the search results
  if (sheetName === "search" && (column === 6 || column === 7)) { // Column F is 6, G is 7
    
    // Get the organization name selected from the dropdown
    let selectedOrg = range.getValue();
    if (!selectedOrg) return; // Exit if dropdown was cleared
    
    // Get the row index of the edited cell
    let rowIndex = range.getRow();
    
    // Determine which claim this is (first or second) based on which column was edited
    let claimType = (column === 6) ? "first" : "second";
    
    // Get the row data from the search results
    // Adjusted to get columns A to D which contain the identifying information
    let resultRowData = sheet.getRange(rowIndex, 1, 1, 4).getValues()[0]; 
    
    // Find the original data in priorities sheet
    let sourceSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("priorities");
    let sourceData = sourceSheet.getRange("A1:G" + sourceSheet.getLastRow()).getValues();
    
    let originalRowIndex = findOriginalRow(sourceData, resultRowData);
    
    if (originalRowIndex !== -1) {
      // Found the original row - make the claim
      let actualRowIndex = originalRowIndex + 1; // +1 because indices are 0-based but rows are 1-based
      
      // Use the regular claim function
      let claimResult = claimItemForOrganization(actualRowIndex, selectedOrg, resultRowData, claimType);
      
      // Email confirmation is handled directly in claimItemForOrganization
      // No additional integration needed here
      
      // Clear the dropdown after action
      range.clearContent();
      
      // Refresh search results to hide items that have reached max claims
      refreshSearchResults();
      
      // Log the result of the claim
      Logger.log("Claim result: " + claimResult);
      
      // If this was the second claim, show a notification
      if (claimType === "second" && claimResult === "success") {
        SpreadsheetApp.getUi().alert("This Precinct has now been claimed by two organizations and will be removed from the search results.");
      }
    } else {
      // Could not find original row
      SpreadsheetApp.getUi().alert("Could not find the original data row. Please try again.");
      range.clearContent();
    }
  }
}

/**
 * Find the original row in the priorities sheet that matches the search result
 * @param {Array} sourceData - Data from the priorities sheet
 * @param {Array} resultRowData - Data from the search result row
 * @return {number} Index of the matching row or -1 if not found
 */
function findOriginalRow(sourceData, resultRowData) {
  for (let i = 0; i < sourceData.length; i++) {
    // Compare key identifying fields to find a match
    // Assuming columns A and B are unique identifiers
    if (sourceData[i][0] == resultRowData[0] && // Compare first column (A)
        sourceData[i][1] == resultRowData[1]) { // Compare second column (B)
      return i; // Return the index of the matching row
    }
  }
  return -1; // No match found
}

/**
 * Claim the item for the selected organization
 * @param {number} originalRowIndex - Row index in the original sheet
 * @param {string} orgName - Name of the organization making the claim
 * @param {Array} resultRowData - Data from the search result row
 * @param {string} claimType - Whether this is the "first" or "second" claim
 * @param {boolean} [skipEmail=false] - Whether to skip sending confirmation email (for fallback scenarios)
 * @return {string} Status of the claim operation
 */
function claimItemForOrganization(originalRowIndex, orgName, resultRowData, claimType, skipEmail) {
  let sourceSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("priorities");
  
  // First claim org goes in column H, second claim org goes in column J
  let firstClaimCell = sourceSheet.getRange(originalRowIndex, 8); // Column H (8) for first claim
  let secondClaimCell = sourceSheet.getRange(originalRowIndex, 10); // Column J (10) for second claim
  
  let firstClaim = firstClaimCell.getValue();
  let secondClaim = secondClaimCell.getValue();
  
  // Get the timestamp for when the claim was made
  let timestamp = new Date();
  
  // Timestamp columns: I for first claim, K for second claim
  let firstTimestampColumn = 9; // Column I (9) for first claim timestamp
  let secondTimestampColumn = 11; // Column K (11) for second claim timestamp
  
  // Check if the appropriate claim slot is already filled
  if (claimType === "first" && firstClaim !== "") {
    SpreadsheetApp.getUi().alert("This Precinct has already been claimed by " + firstClaim + " as the first organization.");
    return "already_claimed";
  } else if (claimType === "second" && secondClaim !== "") {
    SpreadsheetApp.getUi().alert("This Precinct has already been claimed by " + secondClaim + " as the second organization.");
    return "already_claimed";
  }
  
  // Check if this organization has already claimed this Precinct
  if ((claimType === "first" && secondClaim === orgName) || 
      (claimType === "second" && firstClaim === orgName)) {
    SpreadsheetApp.getUi().alert("Your organization has already claimed this Precinct in the other slot.");
    return "duplicate";
  }
  
  // Make the claim with appropriate timestamp
  if (claimType === "first") {
    firstClaimCell.setValue(orgName);
    sourceSheet.getRange(originalRowIndex, firstTimestampColumn).setValue(timestamp);
  } else { // second claim
    secondClaimCell.setValue(orgName);
    sourceSheet.getRange(originalRowIndex, secondTimestampColumn).setValue(timestamp);
  }
  
  // Log the claim action
  Logger.log("Precinct '" + resultRowData[0] + "' claimed by " + orgName + " (" + claimType + " claim)");
  
  // Send confirmation email (unless explicitly skipped)
  if (skipEmail !== true) {
    sendConfirmationEmail(orgName, resultRowData, "Claimed Precinct '" + resultRowData[0] + "' (" + claimType + " claim)", claimType);
  } else {
    Logger.log("Skipping email send as requested by skipEmail parameter");
  }
  
  return "success";
}
/**
 * Function to send confirmation emails to owner, current user, and other claiming organization
 * @param {string} orgName - Name of the organization making the claim
 * @param {Array} resultRowData - Data from the search result row
 * @param {string} actionDetails - Details about the action being taken
 * @param {string} claimType - Whether this is the "first" or "second" claim
 */
function sendConfirmationEmail(orgName, resultRowData, actionDetails, claimType) {
  try {
    // Get the spreadsheet information
    let ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let spreadsheetName = ss.getName();
    let spreadsheetUrl = ss.getUrl();
    
    // Get the owner's email (the owner of the spreadsheet)
    let ownerEmail = ss.getOwner().getEmail();
    
    // Get current user's email
    let currentUserEmail = Session.getActiveUser().getEmail();
    
    // Format the item details for email
    let itemDetails = "";
    for (let i = 0; i < resultRowData.length; i++) {
      if (resultRowData[i]) {
        // Use correct column labels (A to D)
        itemDetails += "Column " + String.fromCharCode(65 + i) + ": " + resultRowData[i] + "<br>";
      }
    }
    
    // Get information about both claiming organizations from the priorities sheet
    let sourceSheet = ss.getSheetByName("priorities");
    let sourceData = sourceSheet.getRange("A1:G" + sourceSheet.getLastRow()).getValues();
    let originalRow = findOriginalRow(sourceData, resultRowData);
    
    let firstOrgName = "";
    let secondOrgName = "";
    let firstOrgEmail = "";
    let secondOrgEmail = "";
    
    if (originalRow !== -1) {
      // Get the actual row index in the sheet
      let actualRowIndex = originalRow + 1; // +1 because indices are 0-based but rows are 1-based
      
      // Get organization names from both claim columns
      firstOrgName = sourceSheet.getRange(actualRowIndex, 8).getValue(); // Column H
      secondOrgName = sourceSheet.getRange(actualRowIndex, 10).getValue(); // Column J
      
      // Get emails for both organizations if they exist
      if (firstOrgName) {
        firstOrgEmail = getEmailForOrganization(firstOrgName);
      }
      
      if (secondOrgName) {
        secondOrgEmail = getEmailForOrganization(secondOrgName);
      }
    }
    
    // Create email subject
    let subject = "Field Coordination: Precinct Claimed by " + orgName + " in " + spreadsheetName;
    
    // Customize message based on claim type and organizations
    let claimMessage = "";
    let claimedBySection = "";
    
    if (claimType === "first") {
      claimMessage = "This Precinct can still be claimed by one more organization.";
      claimedBySection = "<h3>Claiming Organizations:</h3>" +
                         "<p>First Claim: <strong>" + orgName + "</strong></p>" +
                         "<p>Second Claim: <em>" + (secondOrgName || "Not yet claimed") + "</em></p>";
    } else if (claimType === "second") {
      claimMessage = "This Precinct has now reached the maximum number of claims (2) and will no longer appear in search results.";
      claimedBySection = "<h3>Claiming Organizations:</h3>" +
                         "<p>First Claim: <strong>" + firstOrgName + "</strong></p>" +
                         "<p>Second Claim: <strong>" + orgName + "</strong></p>";
    }
    
    // Data sharing document URL removed
    
    // Create email body with proper HTML formatting
    let body = 
        "<html>" +
        "<head>" +
        "<style>" +
        "body { font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }" +
        "h2 { color: #2c3e50; border-bottom: 1px solid #eee; padding-bottom: 10px; }" +
        "h3 { color: #2980b9; margin-top: 20px; }" +
        "p { margin-bottom: 10px; }" +
        "strong { font-weight: bold; }" +
        "a { color: #3498db; text-decoration: none; }" +
        "a:hover { text-decoration: underline; }" +
        ".info-section { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; }" +
        ".status { font-weight: bold; color: #e74c3c; }" +
        ".footer { font-style: italic; color: #7f8c8d; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px; }" +
        "</style>" +
        "</head>" +
        "<body>" +
        "<h2>Precinct Claim Confirmation</h2>" +
        "<p><strong>Spreadsheet:</strong> " + spreadsheetName + "</p>" +
        "<p><strong>Organization Taking Action:</strong> " + orgName + "</p>" +
        "<p><strong>Action:</strong> " + actionDetails + "</p>" +
        "<p><strong>Claimed On:</strong> " + new Date().toLocaleString() + "</p>" +
        "<div class='info-section'>" +
        "<h3>Field Information:</h3>" +
        "<p>" + itemDetails + "</p>" +
        "</div>" +
        "<div class='info-section'>" +
        claimedBySection +
        "</div>" +
        "<div class='info-section' style='background-color: #E8F4FC; border-left: 4px solid #3498db;'>" +
        "<h3>Important Action Required:</h3>" +
        "<p><strong>1. Run the 'field_coordination_2025' query in PAD</strong></p>" +
        "<p><strong>2. Use the following activist code format: 'orgname_precinct_date'</strong></p>" +
        "</div>" +
        "<p class='status'><strong>Status:</strong> " + claimMessage + "</p>" +
        "<p><a href='" + spreadsheetUrl + "'>View Spreadsheet</a></p>" +
        "<p class='footer'>This is an automated message. Please do not reply.</p>" +
        "</body>" +
        "</html>";
    
    // Create recipient list
    let recipients = ["datateam@alforward.org", "sherri@alforward.org"];
    
    // Add current user's email if available
    if (currentUserEmail && currentUserEmail.includes('@') && !recipients.includes(currentUserEmail)) {
      recipients.push(currentUserEmail);
      Logger.log("Added current user email to recipients: " + currentUserEmail);
    }
    
    // Add other organization's email if it exists and is not already in the list
    if (claimType === "first" && secondOrgEmail && !recipients.includes(secondOrgEmail)) {
      recipients.push(secondOrgEmail);
    } else if (claimType === "second" && firstOrgEmail && !recipients.includes(firstOrgEmail)) {
      recipients.push(firstOrgEmail);
    }
    
    // Send to all recipients with proper HTML formatting
    for (let i = 0; i < recipients.length; i++) {
      MailApp.sendEmail({
        to: recipients[i],
        subject: subject,
        htmlBody: body,
        // Add a plain text version as fallback for email clients that don't support HTML
        body: "Precinct Claim Confirmation\n\n" +
              "Spreadsheet: " + spreadsheetName + "\n" +
              "Organization Taking Action: " + orgName + "\n" +
              "Action: " + actionDetails + "\n" +
              "Claimed On: " + new Date().toLocaleString() + "\n\n" +
              "Field Information:\n" +
              resultRowData.map((val, idx) => val ? "Column " + String.fromCharCode(65 + idx) + ": " + val : "").filter(Boolean).join("\n") + "\n\n" +
              "Claiming Organizations:\n" +
              "First Claim: " + (claimType === "first" ? orgName : firstOrgName) + "\n" +
              "Second Claim: " + (claimType === "second" ? orgName : (secondOrgName || "Not yet claimed")) + "\n\n" +
              "IMPORTANT ACTION REQUIRED:\n" +
              "1. Run the 'field_coordination_2025' query in PAD\n" +
              "2. Use the following activist code format: 'orgname_precinct_date'\n\n" +
              "Status: " + claimMessage + "\n\n" +
              "View Spreadsheet: " + spreadsheetUrl + "\n\n" +
              "This is an automated message. Please do not reply."
      });
    }
    
    // Log successful email sending
    Logger.log("Confirmation emails sent successfully to: " + recipients.join(", "));
    
  } catch (error) {
    // Log any errors that occur during email sending
    Logger.log("Error sending confirmation email: " + error.toString());
  }
}

/**
 * Function to get the email address for an organization from a spreadsheet
 * @param {string} orgName - Name of the organization
 * @return {string} Email address or empty string if not found
 */
function getEmailForOrganization(orgName) {
  try {
    // Reference the sheet containing organization email mappings
    let ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let mappingSheet = ss.getSheetByName("orgContacts");
    
    // Get all organization data
    let orgData = mappingSheet.getDataRange().getValues();
    
    // Skip header row and search for the matching organization
    for (let i = 1; i < orgData.length; i++) {
      // Assuming first column contains organization names and second column contains emails
      if (orgData[i][0] === orgName) {
        return orgData[i][1]; // Return the email address
      }
    }
    
    // If no matching organization is found
    Logger.log("No email found for organization: " + orgName);
    return "";
    
  } catch (error) {
    Logger.log("Error retrieving organization email: " + error.toString());
    return "";
  }
}


/**
 * Refresh the search results by clearing and restoring all search criteria
 */
function refreshSearchResults() {
  // Get the search sheet
  let ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName("search");
  let filterCell = sheet.getRange("A6");
  let filterFormula = filterCell.getFormula();

  // Store current search criteria
  let countySearch = sheet.getRange("B1").getValue();
  let precinctNameSearch = sheet.getRange("B2").getValue();
  let precinctNumberSearch = sheet.getRange("B4").getValue();
  
  // Clear all search criteria
  sheet.getRange("B1").clearContent();
  sheet.getRange("B2").clearContent();
  sheet.getRange("B4").clearContent();
  filterCell.clearContent();
  SpreadsheetApp.flush(); // Force update
  
  // Restore search criteria
  sheet.getRange("B1").setValue(countySearch);
  sheet.getRange("B2").setValue(precinctNameSearch);
  sheet.getRange("B4").setValue(precinctNumberSearch);
  filterCell.setFormula(filterFormula);
}

/**
 * Function to reset all search fields and dropdown selections
 * @return {Object} Result of the reset operation
 */
function resetSearchAndDropdowns() {
  try {
    let ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName("search");
    
    // Clear search criteria
    sheet.getRange("B1").clearContent();
    sheet.getRange("B2").clearContent();
    sheet.getRange("B4").clearContent();
    
    // Clear dropdowns
    let firstClaimDropdowns = sheet.getRange("F6:F282"); // Adjust range as needed
    let secondClaimDropdowns = sheet.getRange("G6:G282"); // Adjust range to match first claim range
    
    firstClaimDropdowns.clearContent();
    secondClaimDropdowns.clearContent();
    
    // Don't use UI alerts in web app context
    // SpreadsheetApp.getUi().alert("Search criteria and dropdowns have been reset.");
    
    // Return success object for the client
    return {
      success: true,
      message: "Search criteria and dropdowns have been reset."
    };
  } catch (error) {
    Logger.log("Error in resetSearchAndDropdowns: " + error.toString());
    return {
      success: false,
      message: "Error resetting search: " + error.toString()
    };
  }
}

/**
 * Function to show the custom search interface
 */
function showStyledSearchInterface() {
  var html = HtmlService.createTemplateFromFile('index')
      .evaluate()
      .setWidth(800)
      .setHeight(600)
      .setTitle('Precinct Search Tool');
  SpreadsheetApp.getUi().showModalDialog(html, 'Precinct Search Tool');
}

/**
 * Includes HTML files with the given filename
 * @param {string} filename - Name of the file to include
 * @return {string} Content of the included file
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * Save a user's selection to the shared selections sheet
 * @param {Object} selectionData - Object containing precinct info and selection details
 * @return {Object} Success/failure response
 */
function saveUserSelection(selectionData) {
  try {
    let ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let selectionsSheet = ss.getSheetByName("userSelections");
    
    // Create the sheet if it doesn't exist
    if (!selectionsSheet) {
      selectionsSheet = ss.insertSheet("userSelections");
      // Add headers
      selectionsSheet.getRange(1, 1, 1, 11).setValues([[
        "County",
        "Precinct Name", 
        "Precinct Number",
        "Municipality",
        "Selection Type",
        "Organization",
        "User Email",
        "Timestamp",
        "Session ID",
        "Row Index",
        "Status"
      ]]);
    }
    
    // Get current user email
    let userEmail = Session.getActiveUser().getEmail();
    let timestamp = new Date();
    
    // Add the selection to the sheet
    let lastRow = selectionsSheet.getLastRow();
    selectionsSheet.getRange(lastRow + 1, 1, 1, 11).setValues([[
      selectionData.county,
      selectionData.precinctName,
      selectionData.precinctNumber,
      selectionData.municipality || "",
      selectionData.claimType,
      selectionData.organization,
      userEmail,
      timestamp,
      selectionData.sessionId || "",
      selectionData.rowIndex || "",
      "active"
    ]]);
    
    return {
      success: true,
      message: "Selection saved successfully"
    };
  } catch (error) {
    Logger.log("Error saving user selection: " + error.toString());
    return {
      success: false,
      message: "Error saving selection: " + error.toString()
    };
  }
}

/**
 * Get all active user selections from the shared sheet
 * @return {Array} Array of selection objects
 */
function getUserSelections() {
  try {
    let ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let selectionsSheet = ss.getSheetByName("userSelections");
    
    if (!selectionsSheet) {
      return [];
    }
    
    let lastRow = selectionsSheet.getLastRow();
    if (lastRow <= 1) {
      return []; // Only headers or empty
    }
    
    // Get all data except headers
    let data = selectionsSheet.getRange(2, 1, lastRow - 1, 11).getValues();
    
    // Convert to objects and filter for active selections
    let selections = [];
    data.forEach(row => {
      if (row[10] === "active") { // Status column
        selections.push({
          county: row[0],
          precinctName: row[1],
          precinctNumber: row[2],
          municipality: row[3],
          claimType: row[4],
          organization: row[5],
          userEmail: row[6],
          timestamp: row[7],
          sessionId: row[8],
          rowIndex: row[9]
        });
      }
    });
    
    return selections;
  } catch (error) {
    Logger.log("Error getting user selections: " + error.toString());
    return [];
  }
}

/**
 * Clear a user's selection when they complete a claim
 * @param {Object} claimData - Data about the completed claim
 * @return {Object} Success/failure response
 */
function clearUserSelection(claimData) {
  try {
    let ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let selectionsSheet = ss.getSheetByName("userSelections");
    
    if (!selectionsSheet) {
      return {
        success: true,
        message: "No selections sheet found"
      };
    }
    
    let lastRow = selectionsSheet.getLastRow();
    if (lastRow <= 1) {
      return {
        success: true,
        message: "No selections to clear"
      };
    }
    
    // Get all data
    let data = selectionsSheet.getRange(2, 1, lastRow - 1, 11).getValues();
    
    // Find matching selections and mark as inactive
    for (let i = 0; i < data.length; i++) {
      if (data[i][0] === claimData.county &&
          data[i][1] === claimData.precinctName &&
          data[i][2] === claimData.precinctNumber &&
          data[i][4] === claimData.claimType &&
          data[i][10] === "active") {
        // Mark as inactive
        selectionsSheet.getRange(i + 2, 11).setValue("claimed");
      }
    }
    
    return {
      success: true,
      message: "Selection cleared successfully"
    };
  } catch (error) {
    Logger.log("Error clearing user selection: " + error.toString());
    return {
      success: false,
      message: "Error clearing selection: " + error.toString()
    };
  }
}

/**
 * Function to get the current search criteria for the HTML interface
 * @return {Object} Current search criteria
 */
function getSearchCriteria() {
  try {
    // Use the spreadsheet ID constant
    let ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    // Now you can access the sheet
    let sheet = ss.getSheetByName("search");
    
    if (!sheet) {
      // Handle case where sheet doesn't exist
      Logger.log("Search sheet not found");
      return {
        county: "",
        precinctName: "",
        precinctNumber: ""
      };
    }
    
    return {
      county: sheet.getRange("B1").getValue(),
      precinctName: sheet.getRange("B2").getValue(),
      precinctNumber: sheet.getRange("B4").getValue()
    };
  } catch (error) {
    Logger.log("Error in getSearchCriteria: " + error.toString());
    return {
      county: "",
      precinctName: "",
      precinctNumber: ""
    };
  }
}
/**
 * Function to perform search for the HTML interface
 * @param {Object} criteria - Search criteria
 * @return {Object} Search results with active selections
 */
function performSearch(criteria) {
  try {
    let ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let sheet = ss.getSheetByName("search");
    
    // Set search criteria in the sheet
    sheet.getRange("B1").setValue(criteria.county || "");
    sheet.getRange("B2").setValue(criteria.precinctName || "");
    sheet.getRange("B4").setValue(criteria.precinctNumber || "");
    
    // Force the spreadsheet to update
    SpreadsheetApp.flush();
    
    // Get the filtered data
    let dataSheet = ss.getSheetByName("search");
    let lastRow = Math.max(6, dataSheet.getLastRow());
    let results = [];
    
    // Get the priorities sheet to get timestamp information
    let prioritiesSheet = ss.getSheetByName("priorities");
    
    if (lastRow > 5) {  // If there are filtered results
      let dataRange = dataSheet.getRange(6, 1, lastRow - 5, 7);  // A6:G(lastRow)
      let data = dataRange.getValues();
      
      // Process each row of results
      for (let i = 0; i < data.length; i++) {
        // Skip empty rows
        if (!data[i][0] && !data[i][1]) continue;
        
        // Find the matching row in the priorities sheet
        let resultRowData = [data[i][0], data[i][1], data[i][2], data[i][3]];
        let sourceData = prioritiesSheet.getDataRange().getValues();
        let originalRowIndex = findOriginalRow(sourceData, resultRowData);
        
        // Default timestamps
        let firstClaimTimestamp = null;
        let secondClaimTimestamp = null;
        
        // If we found the original row, get the timestamps
        if (originalRowIndex !== -1) {
          let actualRowIndex = originalRowIndex + 1;
          
          // Get timestamp values - Column I (9) for first claim, Column K (11) for second claim
          let firstTimestamp = prioritiesSheet.getRange(actualRowIndex, 9).getValue();
          let secondTimestamp = prioritiesSheet.getRange(actualRowIndex, 11).getValue();
          
          // Format timestamps if they exist
          if (firstTimestamp && firstTimestamp instanceof Date) {
            firstClaimTimestamp = Utilities.formatDate(firstTimestamp, Session.getScriptTimeZone(), "MMM d, yyyy 'at' h:mm a");
          }
          
          if (secondTimestamp && secondTimestamp instanceof Date) {
            secondClaimTimestamp = Utilities.formatDate(secondTimestamp, Session.getScriptTimeZone(), "MMM d, yyyy 'at' h:mm a");
          }
        }
        
        // Add to results array with timestamps
        results.push({
          county: data[i][0] || "",
          precinctName: data[i][1] || "",
          precinctNumber: data[i][2] || "",
          municipality: data[i][3] || "",
          firstClaim: data[i][5] || "",
          secondClaim: data[i][6] || "",
          firstClaimTimestamp: firstClaimTimestamp,
          secondClaimTimestamp: secondClaimTimestamp,
          claimCount: (data[i][5] ? 1 : 0) + (data[i][6] ? 1 : 0),
          rowIndex: i + 6
        });
      }
    }
    
    // Get all active user selections
    let activeSelections = getUserSelections();
    
    // Return both results and active selections
    return {
      results: results || [],
      activeSelections: activeSelections || []
    };
  } catch (error) {
    Logger.log("Error in performSearch: " + error.toString());
    // Return an error object that client can handle
    return { error: error.toString() };
  }
}

/**
 * Function to claim an item from the HTML interface
 * @param {number} displayRowIndex - Row index in the display
 * @param {string} orgName - Name of the organization making the claim
 * @param {string} claimType - Whether this is the "first" or "second" claim
 * @return {Object} Result of the claim operation
 */
function claimItemForOrg(displayRowIndex, orgName, claimType) {
  try {
    // Get the spreadsheet and the search sheet
    let ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let searchSheet = ss.getSheetByName("search");
    
    // Validate row index
    if (!displayRowIndex || typeof displayRowIndex !== 'number' || displayRowIndex < 6) {
      return {
        success: false,
        message: "Invalid row index. Please try again."
      };
    }
    
    // Get the row data (columns A-D for identification)
    let resultRowData = searchSheet.getRange(displayRowIndex, 1, 1, 4).getValues()[0];
    
    // Check if we got valid data
    if (!resultRowData || !resultRowData[0]) {
      return {
        success: false,
        message: "Could not retrieve row data. Please try again."
      };
    }
    
    // Find the original data in priorities sheet
    let sourceSheet = ss.getSheetByName("priorities");
    let lastRow = sourceSheet.getLastRow();
    
    // Check if we have data to search through
    if (lastRow < 1) {
      return {
        success: false,
        message: "Source data sheet is empty. Please check your setup."
      };
    }
    
    let sourceData = sourceSheet.getRange("A1:G" + lastRow).getValues();
    
    let originalRowIndex = findOriginalRow(sourceData, resultRowData);
    
    if (originalRowIndex !== -1) {
      // Found the original row - make the claim
      let actualRowIndex = originalRowIndex + 1; // +1 because indices are 0-based but rows are 1-based
      
      // Use regular claim function
      try {
        // Call claimItemForOrganization with skipEmail=true to prevent double emails in fallback
        let claimResult = claimItemForOrganization(actualRowIndex, orgName, resultRowData, claimType, true);
        
        // If the claim was successful
        if (claimResult === "success") {
          // Get the timestamp for formatting
          let timestamp = new Date();
          let formattedTimestamp = Utilities.formatDate(timestamp, Session.getScriptTimeZone(), "MMM d, yyyy 'at' h:mm a");
          
          // Calculate claim count
          let firstClaimCell = sourceSheet.getRange(actualRowIndex, 8); // Column H for first claim
          let secondClaimCell = sourceSheet.getRange(actualRowIndex, 10); // Column J for second claim
          let claimCount = 0;
          if (firstClaimCell.getValue()) claimCount++;
          if (secondClaimCell.getValue()) claimCount++;
          
          // The confirmation email is already sent from within the claimItemForOrganization function
          // No additional email notifications needed here
          
          // Clear any user selections for this precinct/claim type
          clearUserSelection({
            county: resultRowData[0],
            precinctName: resultRowData[1],
            precinctNumber: String(resultRowData[2]),
            claimType: claimType
          });
          
          Logger.log("Precinct claim completed successfully");
          
          // Return success with timestamp
          return {
            success: true,
            message: "Precinct claimed successfully by " + orgName + ".",
            claimCount: claimCount,
            refreshNeeded: claimCount >= 2, // Refresh if Precinct is now fully claimed
            timestamp: formattedTimestamp
          };
        } else if (claimResult === "already_claimed") {
          return {
            success: false,
            message: "This Precinct has already been claimed by another organization."
          };
        } else if (claimResult === "duplicate") {
          return {
            success: false,
            message: "Your organization has already claimed this Precinct in the other slot."
          };
        } else {
          // For all other errors
          return {
            success: false,
            message: "Error processing claim: " + claimResult
          };
        }
      } catch (error) {
        Logger.log("Error in claim function: " + error.toString());
        Logger.log("Falling back to manual claim function");
        
        // Check if this organization already claimed this item
        let firstClaimCell = sourceSheet.getRange(actualRowIndex, 8); // Column H for first claim
        let secondClaimCell = sourceSheet.getRange(actualRowIndex, 10); // Column J for second claim
        let firstClaim = firstClaimCell.getValue();
        let secondClaim = secondClaimCell.getValue();
        
        // Check if the appropriate claim slot is already filled
        if (claimType === "first" && firstClaim !== "") {
          return {
            success: false,
            message: "This Precinct has already been claimed by " + firstClaim + " as the first organization."
          };
        } else if (claimType === "second" && secondClaim !== "") {
          return {
            success: false,
            message: "This Precinct has already been claimed by " + secondClaim + " as the second organization."
          };
        }
        
        // Check if this organization has already claimed this item
        if ((claimType === "first" && secondClaim === orgName) || 
            (claimType === "second" && firstClaim === orgName)) {
          return {
            success: false,
            message: "Your organization has already claimed this Precinct in the other slot."
          };
        }
        
        // Get the timestamp for when the claim was made
        let timestamp = new Date();
        let formattedTimestamp = Utilities.formatDate(timestamp, Session.getScriptTimeZone(), "MMM d, yyyy 'at' h:mm a");
        
        // Make the claim
        if (claimType === "first") {
          firstClaimCell.setValue(orgName);
          sourceSheet.getRange(actualRowIndex, 9).setValue(timestamp); // Column I for first timestamp
        } else { // second claim
          secondClaimCell.setValue(orgName);
          sourceSheet.getRange(actualRowIndex, 11).setValue(timestamp); // Column K for second timestamp
        }
        
        // Send confirmation email - this is the only place it is sent in this fallback flow
        try {
          sendConfirmationEmail(orgName, resultRowData, "Claimed precinct '" + resultRowData[0] + "' (" + claimType + " claim)", claimType);
        } catch (emailError) {
          Logger.log("Error sending email: " + emailError);
          // Continue anyway since the claim was successful
        }
        
        // Calculate claim count
        let claimCount = 0;
        if (firstClaimCell.getValue()) claimCount++;
        if (secondClaimCell.getValue()) claimCount++;
        
        // Return success with timestamp
        return {
          success: true,
          message: "Precinct claimed successfully by " + orgName + ".",
          claimCount: claimCount,
          refreshNeeded: claimCount >= 2, // Refresh if Precinct is now fully claimed
          timestamp: formattedTimestamp
        };
      }
    } else {
      // Could not find original row
      return {
        success: false,
        message: "Could not find the original data row. Please try again."
      };
    }
  } catch (error) {
    Logger.log("Claim error: " + error + " (Stack: " + error.stack + ")");
    return {
      success: false,
      message: "Error: " + error.toString()
    };
  }
}

/**
 * Function to get available organizations for dropdowns
 * @return {Array} List of organization names
 */
function getOrganizations() {
  try {
    // Get organizations from the orgContacts sheet
    let ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    let orgSheet = ss.getSheetByName("orgContacts");
    let lastRow = orgSheet.getLastRow();
    
    // Check if we have enough rows to process
    if (lastRow <= 1) {
      // Sheet is empty or only has a header row
      Logger.log("Organization sheet is empty or only has a header row");
      return [];
    }
    
    // Get all organizations starting from row 2
    let orgs = orgSheet.getRange(2, 1, lastRow - 1, 1).getValues();
    
    // Filter out empty values and return
    return orgs.map(org => org[0]).filter(org => org !== "");
  } catch (error) {
    Logger.log("Error getting organizations: " + error);
    return [];
  }
}

/**
 * Function to handle web app GET requests - this is required for web app deployment
 * @param {Object} e - Event object from web app request
 * @return {HtmlOutput} HTML content for the web app
 */
function doGet(e) {
  // Log access attempt for debugging
  try {
    const user = Session.getEffectiveUser().getEmail();
    Logger.log("Web app access attempt by: " + user);
  } catch (error) {
    Logger.log("Could not identify user: " + error.toString());
  }
  
  return HtmlService.createTemplateFromFile('index')
      .evaluate()
      .setTitle('Precinct Search Tool')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}