function onOpen() {
    SpreadsheetApp.getUi()
      .createMenu('Search Tools')
      .addItem('Reset Search & Dropdowns', 'resetSearchAndDropdowns')
      .addToUi();
  }
  
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
      let resultRowData = sheet.getRange(rowIndex, 1, 1, 4).getValues()[0]; // A to D columns
      
      // Find the original data in priorities sheet
      let sourceSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("priorities");
      let sourceData = sourceSheet.getRange("A1:G" + sourceSheet.getLastRow()).getValues();
      
      let originalRowIndex = findOriginalRow(sourceData, resultRowData);
      
      if (originalRowIndex !== -1) {
        // Found the original row - make the claim
        let actualRowIndex = originalRowIndex + 1; // +1 because indices are 0-based but rows are 1-based
        let claimResult = claimItemForOrganization(actualRowIndex, selectedOrg, resultRowData, claimType);
        
        // Clear the dropdown after action
        range.clearContent();
        
        // Refresh search results to hide items that have reached max claims
        refreshSearchResults();
        
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
  
  // Find the original row in the priorities sheet that matches the search result
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
  
  // Claim the item for the selected organization
  function claimItemForOrganization(originalRowIndex, orgName, resultRowData, claimType) {
    let sourceSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("priorities");
    
    // Update column references to match your sheet structure
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
    
    // Send confirmation email
    sendConfirmationEmail(orgName, resultRowData, "Claimed Precinct '" + resultRowData[0] + "' (" + claimType + " claim)", claimType);
    
    return "success";
  }
  
  // Function to send confirmation emails to owner, current user, and other claiming organization
  function sendConfirmationEmail(orgName, resultRowData, actionDetails, claimType) {
    try {
      // Get the spreadsheet information
      let ss = SpreadsheetApp.getActiveSpreadsheet();
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
      let sourceSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("priorities");
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
      
      // Get URL for the data sharing document
      let dataSharingDocUrl = getDataSharingDocumentUrl();
      
      // Create email body
      let body = "<html><body>" +
                 "<h2>Precinct Claim Confirmation</h2>" +
                 "<p><strong>Spreadsheet:</strong> " + spreadsheetName + "</p>" +
                 "<p><strong>Organization Taking Action:</strong> " + orgName + "</p>" +
                 "<p><strong>Action:</strong> " + actionDetails + "</p>" +
                 "<p><strong>Claimed On:</strong> " + new Date().toLocaleString() + "</p>" +
                 "<h3>Field Information:</h3>" +
                 "<p>" + itemDetails + "</p>" +
                 claimedBySection +
                 "<p><strong>Status:</strong> " + claimMessage + "</p>" +
                 "<p><a href='" + spreadsheetUrl + "'>View Spreadsheet</a></p>" +
                 "<h3>Important - Data Sharing Agreement</h3>" +
                 "<p>Please review and sign our data sharing agreement by clicking the link below:</p>" +
                 "<p><a href='" + dataSharingDocUrl + "'>Data Sharing Agreement</a></p>" +
                 "<p>All parties must sign this agreement before proceeding with the claimed Precinct.</p>" +
                 "<p><em>This is an automated message. Please do not reply.</em></p>" +
                 "</body></html>";
      
      // Create recipient list
      let recipients = [ownerEmail, "gabri@alforward.org"];
      
      // // Add current user if different from owner
      // if (currentUserEmail !== ownerEmail && currentUserEmail !== "") {
      //   recipients.push(currentUserEmail);
      // }
      
      // Add other organization's email if it exists and is not already in the list
      if (claimType === "first" && secondOrgEmail && !recipients.includes(secondOrgEmail)) {
        recipients.push(secondOrgEmail);
      } else if (claimType === "second" && firstOrgEmail && !recipients.includes(firstOrgEmail)) {
        recipients.push(firstOrgEmail);
      }
      
      // Send to all recipients
      for (let i = 0; i < recipients.length; i++) {
        MailApp.sendEmail({
          to: recipients[i],
          subject: subject,
          htmlBody: body
        });
      }
      
      // Log successful email sending
      Logger.log("Confirmation emails sent successfully to: " + recipients.join(", "));
      
    } catch (error) {
      // Log any errors that occur during email sending
      Logger.log("Error sending confirmation email: " + error.toString());
    }
  }
  
  // Function to get the email address for an organization from a spreadsheet
  function getEmailForOrganization(orgName) {
    try {
      // Reference the sheet containing organization email mappings
      let mappingSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("orgContacts");
      
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
  
  // Function to get the URL for the data sharing document
  function getDataSharingDocumentUrl() {
    // Using the URL you provided
    return "https://docs.google.com/spreadsheets/d/1E3yYNnPbrUNpdIU8TCjcKGtMe5T8qSuvh_1p_zkhZI0/edit?gid=364896837#gid=364896837";
  }
  
  // Refresh the search results by clearing and restoring all search criteria
  function refreshSearchResults() {
    // Get the search sheet
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("search");
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
  
  // Function to reset all search fields and dropdown selections
  function resetSearchAndDropdowns() {
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("search");
    
    // Clear search criteria
    sheet.getRange("B1").clearContent();
    sheet.getRange("B2").clearContent();
    sheet.getRange("B4").clearContent();
    
    // Clear dropdowns
    let firstClaimDropdowns = sheet.getRange("F6:F282"); // Adjust range as needed
    let secondClaimDropdowns = sheet.getRange("G6:G282"); // Adjust range to match first claim range
    
    firstClaimDropdowns.clearContent();
    secondClaimDropdowns.clearContent();
    
    SpreadsheetApp.getUi().alert("Search criteria and dropdowns have been reset.");
  }
  
  // Add this to your existing Apps Script file
  
  // Function to show the custom search interface
  function showStyledSearchInterface() {
    var html = HtmlService.createHtmlOutputFromFile('SearchStyler')
        .setWidth(800)
        .setHeight(600)
        .setTitle('Precinct Search Tool');
    SpreadsheetApp.getUi().showModalDialog(html, 'Precinct Search Tool');
  }
  
  // Update your onOpen function to include the styled search option
  function onOpen() {
    SpreadsheetApp.getUi()
      .createMenu('Search Tools')
      // .addItem('Reset Search & Dropdowns', 'resetSearchAndDropdowns')
      .addItem('Choose your precincts!', 'showStyledSearchInterface')
      .addToUi();
  }
  
  // Function to get the current search criteria for the HTML interface
  function getSearchCriteria() {
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("search");
    
    return {
      county: sheet.getRange("B1").getValue(),
      precinctName: sheet.getRange("B2").getValue(),
      precinctNumber: sheet.getRange("B4").getValue()
    };
  }
  
  // Function to perform search for the HTML interface
  function performSearch(criteria) {
    let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("search");
    
    // Set search criteria in the sheet
    sheet.getRange("B1").setValue(criteria.county || "");
    sheet.getRange("B2").setValue(criteria.precinctName || "");
    sheet.getRange("B4").setValue(criteria.precinctNumber || "");
    
    // Force the spreadsheet to update
    SpreadsheetApp.flush();
    
    // Get the filtered data (adjust the range as needed for your data)
    // This assumes your filtered data appears in rows starting from row 6
    let dataSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("search");
    let lastRow = Math.max(6, dataSheet.getLastRow());
    let results = [];
    
    if (lastRow > 5) {  // If there are filtered results
      let dataRange = dataSheet.getRange(6, 1, lastRow - 5, 7);  // A6:G(lastRow)
      let data = dataRange.getValues();
      
      // Process each row of results
      for (let i = 0; i < data.length; i++) {
        // Skip empty rows
        if (!data[i][0] && !data[i][1]) continue;
        
        // Get claim status for each row
        let firstClaim = data[i][5] || ""; // Column F (index 5)
        let secondClaim = data[i][6] || ""; // Column G (index 6)
        let claimCount = 0;
        if (firstClaim) claimCount++;
        if (secondClaim) claimCount++;
        
        // Add to results array
        results.push({
          county: data[i][0],              // Column A
          precinctName: data[i][1],        // Column B
          precinctNumber: data[i][2],      // Column C
          municipality: data[i][3],      // Column D
          firstClaim: firstClaim,          // Column F
          secondClaim: secondClaim,        // Column G
          claimCount: claimCount,
          rowIndex: i + 6                  // Actual row in the sheet
        });
      }
    }
    
    return results;
  }
  
  // Function to claim an item from the HTML interface
  function claimItemForOrg(displayRowIndex, orgName, claimType) {
    try {
      // Get the actual row data from the search results
      let searchSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("search");
      
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
      let sourceSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("priorities");
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
        
        // Make the claim
        if (claimType === "first") {
          firstClaimCell.setValue(orgName);
          sourceSheet.getRange(actualRowIndex, 9).setValue(timestamp); // Column I for first timestamp
        } else { // second claim
          secondClaimCell.setValue(orgName);
          sourceSheet.getRange(actualRowIndex, 11).setValue(timestamp); // Column K for second timestamp
        }
        
        // Send confirmation email (safely)
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
        
        // Return success
        return {
          success: true,
          message: "Precinct claimed successfully by " + orgName,
          claimCount: claimCount,
          refreshNeeded: claimCount >= 2 // Refresh if Precinct is now fully claimed
        };
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
  
  // Function to get available organizations for dropdowns
  function getOrganizations() {
    try {
      // Get organizations from the orgContacts sheet
      let orgSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("orgContacts");
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