function createSpreadsheetTrigger() {
  // Check if trigger already exists
  const triggers = ScriptApp.getProjectTriggers();
  const triggerExists = triggers.some(trigger => 
    trigger.getHandlerFunction() === 'checkForNewRows' && 
    trigger.getEventType() === ScriptApp.EventType.CLOCK
  );
  
  if (!triggerExists) {
    // Create trigger to run twice a day (every 12 hours)
    ScriptApp.newTrigger('checkForNewRows')
      .timeBased()
      .everyHours(12)
      .create();
    Logger.log('New time-based trigger created to run every 12 hours');
    
    // Initialize the last processed row property
    PropertiesService.getScriptProperties().setProperty('LAST_PROCESSED_ROW', getLastRow().toString());
  } else {
    Logger.log('Time-based trigger already exists');
  }
}

function checkForNewRows() {
  try {
    const sheet = SpreadsheetApp.getActiveSheet();
    const currentLastRow = sheet.getLastRow();
    
    // Get the last processed row from properties
    const lastProcessedRow = parseInt(PropertiesService.getScriptProperties().getProperty('LAST_PROCESSED_ROW') || '1');
    
    Logger.log(`Current last row: ${currentLastRow}, Last processed row: ${lastProcessedRow}`);
    
    // If there are new rows
    if (currentLastRow > lastProcessedRow) {
      // Process each new row
      for (let rowNumber = lastProcessedRow + 1; rowNumber <= currentLastRow; rowNumber++) {
        try {
          const fieldPlan = FieldPlan.fromSpecificRow(rowNumber);
          Logger.log(`Processing row ${rowNumber}: ${fieldPlan.memberOrgName}`);
          
          // Send email with field plan details
          sendFieldPlanEmail(fieldPlan);
          
        } catch (error) {
          Logger.log(`Error processing row ${rowNumber}: ${error.message}`);
        }
      }
      
      // Update the last processed row
      PropertiesService.getScriptProperties().setProperty('LAST_PROCESSED_ROW', currentLastRow.toString());
      Logger.log(`Updated last processed row to ${currentLastRow}`);
    } else {
      Logger.log('No new rows to process');
    }
  } catch (error) {
    Logger.log(`Error in checkForNewRows: ${error.message}`);
  }
}

  function findMatchingOrganizations() {
  //For the specific row in budget spreadsheet
    //Compare member name to every member name submission in field plan spreadsheet.
    //Return matches only
  if (rowData[FieldBudget.COLUMNS.SUBMITFIELDPLAN] === rowData[Fie]) {

    //Compare rowData[FieldBudget.COLUMNS.MEMBERNAME] 
  }
}


// function findMatchingOrganizations() {
//   // Get data from both spreadsheets
//   const budgetSheet = SpreadsheetApp.getActive().getSheetByName('2025_field_budget');
//   const planSheet = SpreadsheetApp.getActive().getSheetByName('2025_field_plan');

//   const budgetData = budgetSheet.getDataRange().getValues();
//   const planData = planSheet.getDataRange().getValues();

//   // Get column indices for member org names
//   const budgetOrgCol = FieldBudget.COLUMNS.MEMBERNAME;
//   const planOrgCol = FieldPlan.COLUMNS.MEMBERNAME; // Adjust this to match your actual column

//   // Results storage
//   const matches = [];
//   const budgetOrgsWithoutPlan = [];

//   // For each budget row (skip header)
//   for (let i = 1; i < budgetData.length; i++) {
//     const budgetRow = budgetData[i];
//     const budgetOrgName = budgetRow[budgetOrgCol];

//     // Skip empty rows
//     if (!budgetOrgName) continue;

//     let found = false;

//     // Compare with each plan org name
//     for (let j = 1; j < planData.length; j++) {
//       const planRow = planData[j];
//       const planOrgName = planRow[planOrgCol];

//       if (planOrgName && budgetOrgName === planOrgName) {
//         // Found a match
//         matches.push({
//           orgName: budgetOrgName,
//           budgetRow: i + 1, // 1-based row number for readability
//           planRow: j + 1    // 1-based row number for readability
//         });
//         found = true;
//         break;
//       }
//     }

//     // If no match found for this budget org
//     if (!found) {
//       budgetOrgsWithoutPlan.push({
//         orgName: budgetOrgName,
//         budgetRow: i + 1
//       });
//     }
//   }

//   // Log results
//   console.log(`Found ${matches.length} matching organizations`);
//   matches.forEach(match => {
//     console.log(`Match: ${match.orgName} (Budget row: ${match.budgetRow}, Plan row: ${match.planRow})`);
//   });

//   console.log(`Found ${budgetOrgsWithoutPlan.length} budget orgs without matching plans`);
//   budgetOrgsWithoutPlan.forEach(org => {
//     console.log(`Missing plan: ${org.orgName} (Budget row: ${org.budgetRow})`);
//   });

//   return {
//     matches: matches,
//     budgetOrgsWithoutPlan: budgetOrgsWithoutPlan
//   };
// }
  