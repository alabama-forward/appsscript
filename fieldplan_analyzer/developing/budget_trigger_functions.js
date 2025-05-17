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

changeFieldPlanStatus() {
  if (rowData[FieldBudget.COLUMNS.SUBMITFIELDPLAN] === rowData[Fie]) {
    //Compare rowData[FieldBudget.COLUMNS.MEMBERNAME] 
  }
}

  