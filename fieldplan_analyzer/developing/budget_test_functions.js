// Test functions for the budget analyzer system

// Test budget class functionality
function testBudgetClass() {
  Logger.log("=== Testing Budget Class ===");
  
  try {
    // Test getting first budget
    const firstBudget = FieldBudget.fromFirstRow();
    Logger.log(`First budget org: ${firstBudget.memberOrgName}`);
    Logger.log(`Admin requested: ${firstBudget.adminRequested}`);
    
    // Test getting last budget
    const lastBudget = FieldBudget.fromLastRow();
    Logger.log(`Last budget org: ${lastBudget.memberOrgName}`);
    
    // Test helper functions
    Logger.log(firstBudget.sumNotOutreach());
    Logger.log(firstBudget.sumOutreach());
    Logger.log(firstBudget.needDataStipend());
    Logger.log(firstBudget.requestSummary());
    
    // Test static count function
    Logger.log(FieldBudget.countAnalyzed());
    
    // Test getting unanalyzed budgets
    const unanalyzed = FieldBudget.getUnanalyzedBudgets();
    Logger.log(`Found ${unanalyzed.length} unanalyzed budgets`);
    
  } catch (error) {
    Logger.log(`Error in testBudgetClass: ${error.message}`);
  }
}

// Test finding matching organizations
function testFindMatching() {
  Logger.log("=== Testing Organization Matching ===");
  
  try {
    const matches = findMatchingOrganizations();
    Logger.log(`Total matches found: ${matches.matches.length}`);
    Logger.log(`Budgets without plans: ${matches.budgetOrgsWithoutPlan.length}`);
    
    // Log first few matches
    matches.matches.slice(0, 3).forEach(match => {
      Logger.log(`Match: ${match.orgName} (Budget row: ${match.budgetRow}, Plan row: ${match.planRow})`);
    });
    
    // Log first few missing
    matches.budgetOrgsWithoutPlan.slice(0, 3).forEach(org => {
      Logger.log(`Missing plan: ${org.orgName} (Budget row: ${org.budgetRow})`);
    });
    
  } catch (error) {
    Logger.log(`Error in testFindMatching: ${error.message}`);
  }
}

// Test analyzing a specific organization
function testAnalyzeOrg() {
  Logger.log("=== Testing Organization Analysis ===");
  
  // Get first matching organization
  const matches = findMatchingOrganizations();
  if (matches.matches.length > 0) {
    const firstMatch = matches.matches[0];
    Logger.log(`Testing analysis for: ${firstMatch.orgName}`);
    
    try {
      // This will trigger the full analysis flow
      analyzeSpecificOrganization(firstMatch.orgName);
      Logger.log("Analysis completed - check email for results");
    } catch (error) {
      Logger.log(`Error analyzing org: ${error.message}`);
    }
  } else {
    Logger.log("No matching organizations found to test");
  }
}

// Test the email formatting without sending
function testEmailFormatting() {
  Logger.log("=== Testing Email Formatting ===");
  
  try {
    const matches = findMatchingOrganizations();
    if (matches.matches.length > 0) {
      const firstMatch = matches.matches[0];
      const budget = FieldBudget.fromSpecificRow(firstMatch.budgetRow);
      const fieldPlanMatch = findMatchingFieldPlan(budget.memberOrgName);
      
      if (fieldPlanMatch) {
        const analysis = analyzeBudgetWithFieldPlan(budget, fieldPlanMatch);
        
        // Log the analysis results
        Logger.log("Analysis Summary:");
        Logger.log(analysis.summary);
        
        Logger.log(`\nFound ${analysis.tactics.length} tactics:`);
        analysis.tactics.forEach(tactic => {
          Logger.log(`- ${tactic.tacticName}: $${tactic.costPerAttempt.toFixed(2)}/attempt (${tactic.status})`);
        });
        
        Logger.log(`\nFound ${analysis.gaps.length} gaps:`);
        analysis.gaps.forEach(gap => {
          Logger.log(`- ${gap.category}: $${gap.gap} gap`);
        });
      }
    }
  } catch (error) {
    Logger.log(`Error in testEmailFormatting: ${error.message}`);
  }
}

// Test triggers setup
function testTriggers() {
  Logger.log("=== Testing Trigger Setup ===");
  
  // Create budget analysis trigger
  createBudgetAnalysisTrigger();
  
  // Create weekly summary trigger
  createWeeklySummaryTrigger();
  
  // List all triggers
  const triggers = ScriptApp.getProjectTriggers();
  Logger.log(`Total triggers: ${triggers.length}`);
  triggers.forEach(trigger => {
    Logger.log(`- ${trigger.getHandlerFunction()} (${trigger.getEventType()})`);
  });
}

// Test weekly summary generation
function testWeeklySummary() {
  Logger.log("=== Testing Weekly Summary ===");
  
  try {
    generateWeeklySummary();
    Logger.log("Weekly summary sent - check email");
  } catch (error) {
    Logger.log(`Error generating summary: ${error.message}`);
  }
}

// Function to find matching organizations (helper for tests)
function findMatchingOrganizations() {
  // Get data from both spreadsheets
  const budgetSheet = SpreadsheetApp.getActive().getSheetByName('2025_field_budget');
  const planSheet = SpreadsheetApp.getActive().getSheetByName('2025_field_plan');

  const budgetData = budgetSheet.getDataRange().getValues();
  const planData = planSheet.getDataRange().getValues();

  // Get column indices for member org names
  const budgetOrgCol = FieldBudget.COLUMNS.MEMBERNAME;
  const planOrgCol = FieldPlan.COLUMNS.MEMBERNAME;

  // Results storage
  const matches = [];
  const budgetOrgsWithoutPlan = [];

  // For each budget row (skip header)
  for (let i = 1; i < budgetData.length; i++) {
    const budgetRow = budgetData[i];
    const budgetOrgName = budgetRow[budgetOrgCol];

    // Skip empty rows
    if (!budgetOrgName) continue;

    let found = false;

    // Compare with each plan org name
    for (let j = 1; j < planData.length; j++) {
      const planRow = planData[j];
      const planOrgName = planRow[planOrgCol];

      if (planOrgName && budgetOrgName === planOrgName) {
        // Found a match
        matches.push({
          orgName: budgetOrgName,
          budgetRow: i + 1, // 1-based row number for readability
          planRow: j + 1    // 1-based row number for readability
        });
        found = true;
        break;
      }
    }

    // If no match found for this budget org
    if (!found) {
      budgetOrgsWithoutPlan.push({
        orgName: budgetOrgName,
        budgetRow: i + 1
      });
    }
  }

  return {
    matches: matches,
    budgetOrgsWithoutPlan: budgetOrgsWithoutPlan
  };
}

// Test marking a budget as analyzed
function testMarkAnalyzed() {
  Logger.log("=== Testing Mark As Analyzed ===");
  
  try {
    const unanalyzed = FieldBudget.getUnanalyzedBudgets();
    if (unanalyzed.length > 0) {
      const first = unanalyzed[0];
      Logger.log(`Marking ${first.budget.memberOrgName} as analyzed (row ${first.rowNumber})`);
      
      // Mark as analyzed
      first.budget.markAsAnalyzed(first.rowNumber);
      
      // Verify it worked
      const newUnanalyzed = FieldBudget.getUnanalyzedBudgets();
      Logger.log(`Unanalyzed count before: ${unanalyzed.length}, after: ${newUnanalyzed.length}`);
    } else {
      Logger.log("No unanalyzed budgets to test");
    }
  } catch (error) {
    Logger.log(`Error in testMarkAnalyzed: ${error.message}`);
  }
}

// Run all tests
function runAllBudgetTests() {
  Logger.log("===== RUNNING ALL BUDGET ANALYZER TESTS =====\n");
  
  testBudgetClass();
  Logger.log("\n");
  
  testFindMatching();
  Logger.log("\n");
  
  testEmailFormatting();
  Logger.log("\n");
  
  testTriggers();
  Logger.log("\n");
  
  Logger.log("===== ALL TESTS COMPLETE =====");
}