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
      // This will trigger the full analysis flow in TEST MODE
      analyzeSpecificOrganization(firstMatch.orgName, true);
      Logger.log("TEST analysis completed - check datateam@alforward.org for test email");
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
    generateWeeklySummary(true);  // Added test mode parameter to send to datateam@alforward.org only
    Logger.log("Weekly summary sent - check datateam@alforward.org");
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

// Debug function to investigate organization name matching issues
function debugMatchingIssue() {
  Logger.log("===== DEBUGGING ORGANIZATION NAME MATCHING ISSUE =====\n");
  
  try {
    // Get data from both spreadsheets
    const budgetSheet = SpreadsheetApp.getActive().getSheetByName('2025_field_budget');
    const planSheet = SpreadsheetApp.getActive().getSheetByName('2025_field_plan');
    
    const budgetData = budgetSheet.getDataRange().getValues();
    const planData = planSheet.getDataRange().getValues();
    
    // Get column indices
    const budgetOrgCol = FieldBudget.COLUMNS.MEMBERNAME; // Column 6
    const planOrgCol = FieldPlan.COLUMNS.MEMBERNAME;     // Column 1
    
    Logger.log(`Budget sheet uses column ${budgetOrgCol} for MEMBERNAME`);
    Logger.log(`Field plan sheet uses column ${planOrgCol} for MEMBERNAME`);
    Logger.log("\n");
    
    // Sample first 5 organizations from each sheet
    Logger.log("=== BUDGET SHEET ORGANIZATIONS (first 5 after header) ===");
    for (let i = 1; i <= Math.min(5, budgetData.length - 1); i++) {
      const orgName = budgetData[i][budgetOrgCol];
      Logger.log(`Row ${i + 1}: "${orgName}"`);
      
      // Debug info for this organization
      if (orgName) {
        Logger.log(`  - Length: ${orgName.length} characters`);
        Logger.log(`  - Type: ${typeof orgName}`);
        Logger.log(`  - Trimmed length: ${orgName.trim().length}`);
        Logger.log(`  - Has leading spaces: ${orgName !== orgName.trimStart()}`);
        Logger.log(`  - Has trailing spaces: ${orgName !== orgName.trimEnd()}`);
        Logger.log(`  - Character codes: ${Array.from(orgName).map(c => c.charCodeAt(0)).join(', ')}`);
        
        // Check for common hidden characters
        const hasLineBreaks = orgName.includes('\n') || orgName.includes('\r');
        const hasTabs = orgName.includes('\t');
        const hasNonBreakingSpace = orgName.includes('\u00A0');
        
        if (hasLineBreaks) Logger.log(`  - WARNING: Contains line breaks!`);
        if (hasTabs) Logger.log(`  - WARNING: Contains tabs!`);
        if (hasNonBreakingSpace) Logger.log(`  - WARNING: Contains non-breaking spaces!`);
      } else {
        Logger.log(`  - WARNING: Empty or null value`);
      }
      Logger.log("");
    }
    
    Logger.log("\n=== FIELD PLAN SHEET ORGANIZATIONS (first 5 after header) ===");
    for (let i = 1; i <= Math.min(5, planData.length - 1); i++) {
      const orgName = planData[i][planOrgCol];
      Logger.log(`Row ${i + 1}: "${orgName}"`);
      
      // Debug info for this organization
      if (orgName) {
        Logger.log(`  - Length: ${orgName.length} characters`);
        Logger.log(`  - Type: ${typeof orgName}`);
        Logger.log(`  - Trimmed length: ${orgName.trim().length}`);
        Logger.log(`  - Has leading spaces: ${orgName !== orgName.trimStart()}`);
        Logger.log(`  - Has trailing spaces: ${orgName !== orgName.trimEnd()}`);
        Logger.log(`  - Character codes: ${Array.from(orgName).map(c => c.charCodeAt(0)).join(', ')}`);
        
        // Check for common hidden characters
        const hasLineBreaks = orgName.includes('\n') || orgName.includes('\r');
        const hasTabs = orgName.includes('\t');
        const hasNonBreakingSpace = orgName.includes('\u00A0');
        
        if (hasLineBreaks) Logger.log(`  - WARNING: Contains line breaks!`);
        if (hasTabs) Logger.log(`  - WARNING: Contains tabs!`);
        if (hasNonBreakingSpace) Logger.log(`  - WARNING: Contains non-breaking spaces!`);
      } else {
        Logger.log(`  - WARNING: Empty or null value`);
      }
      Logger.log("");
    }
    
    // Try to find exact matches between first few organizations
    Logger.log("\n=== ATTEMPTING TO MATCH FIRST FEW ORGANIZATIONS ===");
    for (let i = 1; i <= Math.min(3, budgetData.length - 1); i++) {
      const budgetOrg = budgetData[i][budgetOrgCol];
      if (!budgetOrg) continue;
      
      Logger.log(`\nSearching for budget org "${budgetOrg}" in field plans...`);
      
      let foundMatch = false;
      for (let j = 1; j < planData.length; j++) {
        const planOrg = planData[j][planOrgCol];
        if (!planOrg) continue;
        
        // Test different matching strategies
        const exactMatch = budgetOrg === planOrg;
        const trimMatch = budgetOrg.trim() === planOrg.trim();
        const lowerMatch = budgetOrg.toLowerCase() === planOrg.toLowerCase();
        const trimLowerMatch = budgetOrg.trim().toLowerCase() === planOrg.trim().toLowerCase();
        
        if (exactMatch || trimMatch || lowerMatch || trimLowerMatch) {
          Logger.log(`  FOUND MATCH at row ${j + 1}!`);
          Logger.log(`  - Exact match: ${exactMatch}`);
          Logger.log(`  - Trim match: ${trimMatch}`);
          Logger.log(`  - Lowercase match: ${lowerMatch}`);
          Logger.log(`  - Trim + lowercase match: ${trimLowerMatch}`);
          foundMatch = true;
          break;
        }
      }
      
      if (!foundMatch) {
        Logger.log(`  NO MATCH FOUND`);
        
        // Show closest matches (by checking if one contains the other)
        Logger.log(`  Checking for partial matches...`);
        for (let j = 1; j < Math.min(6, planData.length); j++) {
          const planOrg = planData[j][planOrgCol];
          if (!planOrg) continue;
          
          if (budgetOrg.includes(planOrg) || planOrg.includes(budgetOrg)) {
            Logger.log(`    - Partial match with "${planOrg}" (row ${j + 1})`);
          }
        }
      }
    }
    
    // Summary of findings
    Logger.log("\n=== SUMMARY ===");
    Logger.log(`Total budget rows: ${budgetData.length - 1}`);
    Logger.log(`Total field plan rows: ${planData.length - 1}`);
    
    // Count non-empty organizations
    let budgetOrgCount = 0;
    let planOrgCount = 0;
    
    for (let i = 1; i < budgetData.length; i++) {
      if (budgetData[i][budgetOrgCol]) budgetOrgCount++;
    }
    
    for (let i = 1; i < planData.length; i++) {
      if (planData[i][planOrgCol]) planOrgCount++;
    }
    
    Logger.log(`Non-empty budget organizations: ${budgetOrgCount}`);
    Logger.log(`Non-empty field plan organizations: ${planOrgCount}`);
    
  } catch (error) {
    Logger.log(`Error in debugMatchingIssue: ${error.message}`);
    Logger.log(`Stack trace: ${error.stack}`);
  }
  
  Logger.log("\n===== DEBUG COMPLETE =====");
}

// Enhanced matching function that handles common data issues
function testEnhancedMatching() {
  Logger.log("===== TESTING ENHANCED MATCHING =====\n");
  
  try {
    // Get data from both spreadsheets
    const budgetSheet = SpreadsheetApp.getActive().getSheetByName('2025_field_budget');
    const planSheet = SpreadsheetApp.getActive().getSheetByName('2025_field_plan');
    
    const budgetData = budgetSheet.getDataRange().getValues();
    const planData = planSheet.getDataRange().getValues();
    
    // Get column indices
    const budgetOrgCol = FieldBudget.COLUMNS.MEMBERNAME;
    const planOrgCol = FieldPlan.COLUMNS.MEMBERNAME;
    
    // Function to normalize organization names
    function normalizeOrgName(name) {
      if (!name) return '';
      
      // Convert to string if not already
      name = String(name);
      
      // Remove common whitespace issues
      name = name.trim();
      
      // Replace multiple spaces with single space
      name = name.replace(/\s+/g, ' ');
      
      // Remove line breaks and tabs
      name = name.replace(/[\n\r\t]/g, ' ');
      
      // Replace non-breaking spaces with regular spaces
      name = name.replace(/\u00A0/g, ' ');
      
      // Optional: convert to lowercase for case-insensitive matching
      // name = name.toLowerCase();
      
      return name;
    }
    
    // Results storage
    const matches = [];
    const budgetOrgsWithoutPlan = [];
    
    // Create normalized lookup map for field plans
    const planOrgMap = new Map();
    for (let j = 1; j < planData.length; j++) {
      const originalName = planData[j][planOrgCol];
      if (originalName) {
        const normalized = normalizeOrgName(originalName);
        planOrgMap.set(normalized, {
          originalName: originalName,
          rowNumber: j + 1,
          normalized: normalized
        });
      }
    }
    
    Logger.log(`Created lookup map with ${planOrgMap.size} field plan organizations`);
    
    // For each budget row (skip header)
    for (let i = 1; i < budgetData.length; i++) {
      const budgetOrgName = budgetData[i][budgetOrgCol];
      
      // Skip empty rows
      if (!budgetOrgName) continue;
      
      const normalizedBudgetOrg = normalizeOrgName(budgetOrgName);
      
      // Look for exact match
      if (planOrgMap.has(normalizedBudgetOrg)) {
        const planMatch = planOrgMap.get(normalizedBudgetOrg);
        matches.push({
          orgName: budgetOrgName,
          budgetRow: i + 1,
          planRow: planMatch.rowNumber,
          matchType: 'normalized exact'
        });
        Logger.log(`Match found: "${budgetOrgName}" -> "${planMatch.originalName}"`);
      } else {
        // No match found
        budgetOrgsWithoutPlan.push({
          orgName: budgetOrgName,
          budgetRow: i + 1,
          normalized: normalizedBudgetOrg
        });
        
        // Try case-insensitive match as fallback
        const lowerNormalized = normalizedBudgetOrg.toLowerCase();
        let caseInsensitiveMatch = null;
        
        for (const [planNormalized, planInfo] of planOrgMap.entries()) {
          if (planNormalized.toLowerCase() === lowerNormalized) {
            caseInsensitiveMatch = planInfo;
            break;
          }
        }
        
        if (caseInsensitiveMatch) {
          Logger.log(`Potential case-insensitive match: "${budgetOrgName}" ~= "${caseInsensitiveMatch.originalName}"`);
        }
      }
    }
    
    // Summary
    Logger.log(`\n=== ENHANCED MATCHING RESULTS ===`);
    Logger.log(`Total matches found: ${matches.length}`);
    Logger.log(`Budgets without plans: ${budgetOrgsWithoutPlan.length}`);
    
    // Show first few unmatched organizations
    if (budgetOrgsWithoutPlan.length > 0) {
      Logger.log(`\nFirst few unmatched budget organizations:`);
      budgetOrgsWithoutPlan.slice(0, 5).forEach(org => {
        Logger.log(`- "${org.orgName}" (normalized: "${org.normalized}")`);
      });
    }
    
    return {
      matches: matches,
      budgetOrgsWithoutPlan: budgetOrgsWithoutPlan,
      planOrgMap: planOrgMap
    };
    
  } catch (error) {
    Logger.log(`Error in testEnhancedMatching: ${error.message}`);
    Logger.log(`Stack trace: ${error.stack}`);
  }
}

// Debug function to investigate matching issues
function debugMatchingIssue() {
  Logger.log("=== DEBUGGING ORGANIZATION NAME MATCHING ===");
  
  try {
    const budgetSheet = SpreadsheetApp.getActive().getSheetByName('2025_field_budget');
    const planSheet = SpreadsheetApp.getActive().getSheetByName('2025_field_plan');
    
    const budgetData = budgetSheet.getDataRange().getValues();
    const planData = planSheet.getDataRange().getValues();
    
    Logger.log(`Budget sheet rows: ${budgetData.length}`);
    Logger.log(`Field plan sheet rows: ${planData.length}`);
    Logger.log(`Budget MEMBERNAME column: ${FieldBudget.COLUMNS.MEMBERNAME}`);
    Logger.log(`Field plan MEMBERNAME column: ${FieldPlan.COLUMNS.MEMBERNAME}`);
    
    // Check first 5 budget organizations
    Logger.log("\n--- BUDGET ORGANIZATIONS (first 5) ---");
    for (let i = 1; i < Math.min(6, budgetData.length); i++) {
      const orgName = budgetData[i][FieldBudget.COLUMNS.MEMBERNAME];
      Logger.log(`Row ${i + 1}: "${orgName}" (length: ${orgName ? orgName.length : 'null'}, type: ${typeof orgName})`);
      
      if (orgName) {
        // Check for hidden characters
        const charCodes = Array.from(orgName).map(char => `${char}(${char.charCodeAt(0)})`).join(', ');
        Logger.log(`  Character codes: ${charCodes}`);
        
        // Check for whitespace issues
        if (orgName !== orgName.trim()) {
          Logger.log(`  ⚠️ Has leading/trailing whitespace`);
        }
        if (orgName.includes('\n')) {
          Logger.log(`  ⚠️ Contains line breaks`);
        }
        if (orgName.includes('\t')) {
          Logger.log(`  ⚠️ Contains tabs`);
        }
        if (orgName.includes('\u00A0')) {
          Logger.log(`  ⚠️ Contains non-breaking spaces`);
        }
      }
    }
    
    // Check first 5 field plan organizations
    Logger.log("\n--- FIELD PLAN ORGANIZATIONS (first 5) ---");
    for (let i = 1; i < Math.min(6, planData.length); i++) {
      const orgName = planData[i][FieldPlan.COLUMNS.MEMBERNAME];
      Logger.log(`Row ${i + 1}: "${orgName}" (length: ${orgName ? orgName.length : 'null'}, type: ${typeof orgName})`);
      
      if (orgName) {
        // Check for hidden characters
        const charCodes = Array.from(orgName).map(char => `${char}(${char.charCodeAt(0)})`).join(', ');
        Logger.log(`  Character codes: ${charCodes}`);
        
        // Check for whitespace issues
        if (orgName !== orgName.trim()) {
          Logger.log(`  ⚠️ Has leading/trailing whitespace`);
        }
        if (orgName.includes('\n')) {
          Logger.log(`  ⚠️ Contains line breaks`);
        }
        if (orgName.includes('\t')) {
          Logger.log(`  ⚠️ Contains tabs`);
        }
        if (orgName.includes('\u00A0')) {
          Logger.log(`  ⚠️ Contains non-breaking spaces`);
        }
      }
    }
    
    // Test different matching strategies
    Logger.log("\n--- TESTING MATCHING STRATEGIES ---");
    const firstBudgetOrg = budgetData[1] ? budgetData[1][FieldBudget.COLUMNS.MEMBERNAME] : null;
    if (firstBudgetOrg) {
      Logger.log(`Testing matches for: "${firstBudgetOrg}"`);
      
      let exactMatch = false;
      let trimMatch = false;
      let caseMatch = false;
      let normalizedMatch = false;
      
      for (let i = 1; i < planData.length; i++) {
        const planOrg = planData[i][FieldPlan.COLUMNS.MEMBERNAME];
        if (!planOrg) continue;
        
        // Test exact match
        if (planOrg === firstBudgetOrg) {
          Logger.log(`  ✅ Exact match found at row ${i + 1}: "${planOrg}"`);
          exactMatch = true;
        }
        
        // Test trimmed match
        if (planOrg.trim() === firstBudgetOrg.trim()) {
          Logger.log(`  ✅ Trimmed match found at row ${i + 1}: "${planOrg}"`);
          trimMatch = true;
        }
        
        // Test case-insensitive match
        if (planOrg.toLowerCase() === firstBudgetOrg.toLowerCase()) {
          Logger.log(`  ✅ Case-insensitive match found at row ${i + 1}: "${planOrg}"`);
          caseMatch = true;
        }
        
        // Test normalized match (trim + replace multiple spaces + remove line breaks)
        const normalizeString = (str) => str.trim().replace(/\s+/g, ' ').replace(/[\n\r\t]/g, '').replace(/\u00A0/g, ' ');
        if (normalizeString(planOrg) === normalizeString(firstBudgetOrg)) {
          Logger.log(`  ✅ Normalized match found at row ${i + 1}: "${planOrg}"`);
          normalizedMatch = true;
        }
      }
      
      if (!exactMatch && !trimMatch && !caseMatch && !normalizedMatch) {
        Logger.log(`  ❌ No matches found for "${firstBudgetOrg}"`);
        
        // Look for partial matches
        Logger.log(`  Checking for partial matches...`);
        for (let i = 1; i < planData.length; i++) {
          const planOrg = planData[i][FieldPlan.COLUMNS.MEMBERNAME];
          if (!planOrg) continue;
          
          if (planOrg.toLowerCase().includes(firstBudgetOrg.toLowerCase()) || 
              firstBudgetOrg.toLowerCase().includes(planOrg.toLowerCase())) {
            Logger.log(`  🔍 Partial match: "${planOrg}" contains or is contained in "${firstBudgetOrg}"`);
          }
        }
      }
    }
    
  } catch (error) {
    Logger.log(`Error in debugMatchingIssue: ${error.message}`);
    Logger.log(`Error stack: ${error.stack}`);
  }
}

// Enhanced matching function that handles common data issues
function testEnhancedMatching() {
  Logger.log("=== TESTING ENHANCED MATCHING ===");
  
  try {
    const budgetSheet = SpreadsheetApp.getActive().getSheetByName('2025_field_budget');
    const planSheet = SpreadsheetApp.getActive().getSheetByName('2025_field_plan');
    
    const budgetData = budgetSheet.getDataRange().getValues();
    const planData = planSheet.getDataRange().getValues();
    
    // Normalize organization name
    const normalizeOrgName = (name) => {
      if (!name) return '';
      return name.toString()
        .trim()
        .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
        .replace(/[\n\r\t]/g, '')  // Remove line breaks and tabs
        .replace(/\u00A0/g, ' ');  // Replace non-breaking spaces with regular spaces
    };
    
    // Create lookup map from field plans
    const fieldPlanLookup = new Map();
    for (let i = 1; i < planData.length; i++) {
      const orgName = planData[i][FieldPlan.COLUMNS.MEMBERNAME];
      if (orgName) {
        const normalizedName = normalizeOrgName(orgName);
        if (!fieldPlanLookup.has(normalizedName) || i > fieldPlanLookup.get(normalizedName).row) {
          fieldPlanLookup.set(normalizedName, { row: i, original: orgName });
        }
      }
    }
    
    Logger.log(`Field plan lookup created with ${fieldPlanLookup.size} entries`);
    
    // Test matching for budget organizations
    let matches = 0;
    let mismatches = 0;
    
    for (let i = 1; i < budgetData.length; i++) {
      const budgetOrgName = budgetData[i][FieldBudget.COLUMNS.MEMBERNAME];
      if (!budgetOrgName) continue;
      
      const normalizedBudgetName = normalizeOrgName(budgetOrgName);
      
      if (fieldPlanLookup.has(normalizedBudgetName)) {
        const match = fieldPlanLookup.get(normalizedBudgetName);
        Logger.log(`✅ Match: "${budgetOrgName}" -> "${match.original}" (row ${match.row + 1})`);
        matches++;
      } else {
        // Try case-insensitive matching
        let caseInsensitiveMatch = null;
        for (const [key, value] of fieldPlanLookup.entries()) {
          if (key.toLowerCase() === normalizedBudgetName.toLowerCase()) {
            caseInsensitiveMatch = value;
            break;
          }
        }
        
        if (caseInsensitiveMatch) {
          Logger.log(`✅ Case-insensitive match: "${budgetOrgName}" -> "${caseInsensitiveMatch.original}"`);
          matches++;
        } else {
          Logger.log(`❌ No match: "${budgetOrgName}" (normalized: "${normalizedBudgetName}")`);
          mismatches++;
        }
      }
    }
    
    Logger.log(`\nSummary: ${matches} matches, ${mismatches} mismatches`);
    
  } catch (error) {
    Logger.log(`Error in testEnhancedMatching: ${error.message}`);
  }
}

// Test functions specifically for sending test emails to datateam only
function testAnalyzeSpecificOrg(orgName) {
  Logger.log(`=== TESTING SPECIFIC ORGANIZATION (TEST MODE) ===`);
  Logger.log(`Organization: ${orgName}`);
  Logger.log(`Emails will be sent ONLY to datateam@alforward.org`);
  
  // First, let's debug the values for this specific org
  try {
    const budgetSheet = SpreadsheetApp.getActive().getSheetByName('2025_field_budget');
    const data = budgetSheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][FieldBudget.COLUMNS.MEMBERNAME] === orgName) {
        const budget = new FieldBudget(data[i]);
        Logger.log(`\nFound ${orgName}:`);
        Logger.log(`- requestedTotal: ${budget.requestedTotal} (type: ${typeof budget.requestedTotal})`);
        Logger.log(`- gapTotal: ${budget.gapTotal} (type: ${typeof budget.gapTotal})`);
        Logger.log(`- projectTotal: ${budget.projectTotal} (type: ${typeof budget.projectTotal})`);
        Logger.log(`- requestSummary: ${budget.requestSummary()}`);
        break;
      }
    }
  } catch (debugError) {
    Logger.log(`Debug error: ${debugError.message}`);
  }
  
  try {
    analyzeSpecificOrganization(orgName, true);
    Logger.log("✅ Test analysis completed - check datateam@alforward.org for test email");
  } catch (error) {
    Logger.log(`❌ Error in test analysis: ${error.message}`);
  }
}

// Test the weekly summary in test mode
function testWeeklySummaryTestMode() {
  Logger.log("=== TESTING WEEKLY SUMMARY (TEST MODE) ===");
  Logger.log("Summary will be sent ONLY to datateam@alforward.org");
  
  try {
    generateWeeklySummary(true);
    Logger.log("✅ Test summary sent - check datateam@alforward.org");
  } catch (error) {
    Logger.log(`❌ Error generating test summary: ${error.message}`);
  }
}

// Test gap handling with negative values
function testGapHandling() {
  Logger.log("=== TESTING GAP HANDLING ===");
  
  try {
    const firstBudget = FieldBudget.fromFirstRow();
    Logger.log(`Organization: ${firstBudget.memberOrgName}`);
    
    // Test individual gap values
    const categories = ['admin', 'data', 'travel', 'comms', 'design', 'video', 
                       'print', 'postage', 'training', 'supplies', 'canvass', 
                       'phone', 'text', 'event', 'digital'];
    
    Logger.log("\nGap Values (negative values will be converted to positive):");
    for (const category of categories) {
      const gap = firstBudget[category + 'Gap'];
      if (gap !== null && gap !== undefined && gap !== 0) {
        Logger.log(`- ${category}: ${gap} → ${Math.abs(gap)} (absolute value)`);
      }
    }
    
    // Test total gap
    Logger.log(`\nTotal Gap: ${firstBudget.gapTotal} → ${Math.abs(firstBudget.gapTotal || 0)} (absolute value)`);
    
    // Test request summary
    Logger.log(`\nRequest Summary:`);
    Logger.log(firstBudget.requestSummary());
    
  } catch (error) {
    Logger.log(`❌ Error testing gap handling: ${error.message}`);
  }
}

// Debug function to check for null values in budget data
function debugBudgetNullValues() {
  Logger.log("=== DEBUGGING NULL VALUES IN BUDGET ===");
  
  try {
    const firstBudget = FieldBudget.fromFirstRow();
    Logger.log(`Organization: ${firstBudget.memberOrgName}`);
    
    // Check key summary fields
    Logger.log("\nSummary Fields:");
    Logger.log(`- requestedTotal: ${firstBudget.requestedTotal} (type: ${typeof firstBudget.requestedTotal})`);
    Logger.log(`- projectTotal: ${firstBudget.projectTotal} (type: ${typeof firstBudget.projectTotal})`);
    Logger.log(`- gapTotal: ${firstBudget.gapTotal} (type: ${typeof firstBudget.gapTotal})`);
    Logger.log(`- analyzed: ${firstBudget.analyzed} (type: ${typeof firstBudget.analyzed})`);
    
    // Get raw data to see what's in the columns
    const budgetSheet = SpreadsheetApp.getActive().getSheetByName('2025_field_budget');
    const data = budgetSheet.getDataRange().getValues();
    const firstRow = data[1]; // First data row (index 1)
    
    Logger.log("\nRaw Column Data:");
    Logger.log(`- Column ${FieldBudget.COLUMNS.REQUESTEDTOTAL} (REQUESTEDTOTAL): "${firstRow[FieldBudget.COLUMNS.REQUESTEDTOTAL]}" (type: ${typeof firstRow[FieldBudget.COLUMNS.REQUESTEDTOTAL]})`);
    Logger.log(`- Column ${FieldBudget.COLUMNS.PROJECTTOTAL} (PROJECTTOTAL): "${firstRow[FieldBudget.COLUMNS.PROJECTTOTAL]}" (type: ${typeof firstRow[FieldBudget.COLUMNS.PROJECTTOTAL]})`);
    Logger.log(`- Column ${FieldBudget.COLUMNS.GAPTOTAL} (GAPTOTAL): "${firstRow[FieldBudget.COLUMNS.GAPTOTAL]}" (type: ${typeof firstRow[FieldBudget.COLUMNS.GAPTOTAL]})`);
    
    // Test the fixed request summary
    Logger.log("\nFixed Request Summary:");
    Logger.log(firstBudget.requestSummary());
    
  } catch (error) {
    Logger.log(`❌ Error debugging null values: ${error.message}`);
    Logger.log(`Stack trace: ${error.stack}`);
  }
}

// Run all tests
function runAllBudgetTests() {
  Logger.log("===== RUNNING ALL BUDGET ANALYZER TESTS =====\n");
  Logger.log("NOTE: Email tests will send to datateam@alforward.org only\n");
  
  testBudgetClass();
  Logger.log("\n");
  
  testFindMatching();
  Logger.log("\n");
  
  testEmailFormatting();
  Logger.log("\n");
  
  testTriggers();
  Logger.log("\n");
  
  testNumericFieldHandling();
  Logger.log("\n");
  
  Logger.log("===== ALL TESTS COMPLETE =====");
}

// Test production weekly summary manually
function testProductionWeeklySummary() {
  Logger.log("=== TESTING PRODUCTION WEEKLY SUMMARY ===");
  Logger.log("This will send to PRODUCTION recipients");
  
  try {
    generateWeeklySummary(false); // false = production mode
    Logger.log("✅ Production weekly summary sent successfully");
  } catch (error) {
    Logger.log(`❌ Error generating production summary: ${error.message}`);
    Logger.log(`Stack trace: ${error.stack}`);
  }
}

// Manually run the trigger function
function testWeeklySummaryTrigger() {
  Logger.log("=== TESTING WEEKLY SUMMARY TRIGGER ===");
  Logger.log("This simulates the trigger firing");
  
  try {
    runWeeklySummaryTrigger();
    Logger.log("✅ Trigger function completed");
  } catch (error) {
    Logger.log(`❌ Trigger function failed: ${error.message}`);
    Logger.log(`Stack trace: ${error.stack}`);
  }
}

// Remove old trigger and create new one
function recreateWeeklySummaryTrigger() {
  Logger.log("=== RECREATING WEEKLY SUMMARY TRIGGER ===");
  
  // Remove all existing weekly summary triggers
  const triggers = ScriptApp.getProjectTriggers();
  triggers.forEach(trigger => {
    const handler = trigger.getHandlerFunction();
    if (handler === 'generateWeeklySummary' || handler === 'runWeeklySummaryTrigger') {
      ScriptApp.deleteTrigger(trigger);
      Logger.log(`Removed trigger for ${handler}`);
    }
  });
  
  // Create new trigger
  createWeeklySummaryTrigger();
  Logger.log("✅ New trigger created");
}

// Test field plan object creation and properties
function testFieldPlanObject() {
  Logger.log("=== TESTING FIELD PLAN OBJECT CREATION ===");
  
  try {
    // Test with last row
    const fieldPlan = FieldPlan.fromLastRow();
    Logger.log(`Field Plan created for: ${fieldPlan.memberOrgName}`);
    Logger.log(`Submission Date: ${fieldPlan.submissionDateTime}`);
    Logger.log(`Confidence: ${fieldPlan.fieldPlanConfidence}`);
    Logger.log(`Has needsCoaching method: ${typeof fieldPlan.needsCoaching === 'function'}`);
    
    // Test needsCoaching method
    if (fieldPlan.needsCoaching) {
      const coachingMessage = fieldPlan.needsCoaching();
      Logger.log(`Coaching message: ${coachingMessage}`);
    }
    
    Logger.log("✅ Field plan object test successful");
  } catch (error) {
    Logger.log(`❌ Error testing field plan object: ${error.message}`);
    Logger.log(`Stack trace: ${error.stack}`);
  }
}

// ============================================
// NEW TEST FUNCTIONS FOR MISSING NOTIFICATIONS
// ============================================

// Test handling of non-numeric values in budget fields
function testNumericFieldHandling() {
  Logger.log('=== Testing Numeric Field Handling ===');
  
  try {
    // Create a mock row with various non-numeric values
    const mockRow = new Array(55).fill('');
    mockRow[FieldBudget.COLUMNS.MEMBERNAME] = 'Test Organization';
    mockRow[FieldBudget.COLUMNS.CANVASSREQUESTED] = null;  // null value
    mockRow[FieldBudget.COLUMNS.PHONEREQUESTED] = '';     // empty string
    mockRow[FieldBudget.COLUMNS.TEXTREQUESTED] = 'N/A';   // text value
    mockRow[FieldBudget.COLUMNS.EVENTREQUESTED] = '1000'; // string number
    mockRow[FieldBudget.COLUMNS.DIGITALREQUESTED] = 500;  // actual number
    
    const budget = new FieldBudget(mockRow);
    
    Logger.log('Testing getter outputs:');
    Logger.log(`canvassRequested (null): ${budget.canvassRequested} (type: ${typeof budget.canvassRequested})`);
    Logger.log(`phoneRequested (empty): ${budget.phoneRequested} (type: ${typeof budget.phoneRequested})`);
    Logger.log(`textRequested (text): ${budget.textRequested} (type: ${typeof budget.textRequested})`);
    Logger.log(`eventRequested (string): ${budget.eventRequested} (type: ${typeof budget.eventRequested})`);
    Logger.log(`digitalRequested (number): ${budget.digitalRequested} (type: ${typeof budget.digitalRequested})`);
    
    // Test that toFixed works on all values
    Logger.log('\nTesting toFixed():');
    Logger.log(`canvassRequested.toFixed(2): ${budget.canvassRequested.toFixed(2)}`);
    Logger.log(`phoneRequested.toFixed(2): ${budget.phoneRequested.toFixed(2)}`);
    Logger.log(`textRequested.toFixed(2): ${budget.textRequested.toFixed(2)}`);
    Logger.log(`eventRequested.toFixed(2): ${budget.eventRequested.toFixed(2)}`);
    Logger.log(`digitalRequested.toFixed(2): ${budget.digitalRequested.toFixed(2)}`);
    
    Logger.log('✓ All numeric fields handled correctly');
  } catch (error) {
    Logger.log(`✗ Error in numeric field handling: ${error.message}`);
  }
}

/**
 * Test the missing field plan notification
 * Sends a test email for an organization missing a field plan
 */
function testMissingFieldPlanNotification() {
  Logger.log('Testing missing field plan notification...');
  sendMissingFieldPlanNotification('Test Organization XYZ', true);
  Logger.log('Test email sent. Check datateam@alforward.org inbox.');
}

/**
 * Test budget analysis for a specific organization
 * This helps test the full analysis flow
 */
function testSpecificBudgetAnalysis() {
  const budgetSheet = SpreadsheetApp.getActive().getSheetByName('2025_field_budget');
  const data = budgetSheet.getDataRange().getValues();
  
  if (data.length > 1) {
    // Test with the first organization that has a field plan
    for (let i = 1; i < data.length; i++) {
      const orgName = data[i][FieldBudget.COLUMNS.MEMBERNAME];
      const fieldPlanMatch = findMatchingFieldPlan(orgName);
      
      if (fieldPlanMatch) {
        Logger.log(`Testing analysis for: ${orgName}`);
        analyzeSpecificOrganization(orgName, true);
        return;
      }
    }
    Logger.log('No organizations found with both budget and field plan');
  } else {
    Logger.log('No budget data available for testing');
  }
}

/**
 * View summary of budget analysis status
 * Shows current state of all budgets
 */
function viewBudgetAnalysisStatus() {
  const budgetSheet = SpreadsheetApp.getActive().getSheetByName('2025_field_budget');
  const data = budgetSheet.getDataRange().getValues();
  
  let analyzed = 0;
  let pending = 0;
  let missingPlans = 0;
  
  Logger.log('=== Budget Analysis Status ===');
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) {
      const orgName = data[i][FieldBudget.COLUMNS.MEMBERNAME];
      const isAnalyzed = data[i][FieldBudget.COLUMNS.ANALYZED] === true;
      
      if (isAnalyzed) {
        analyzed++;
      } else {
        pending++;
        
        // Check if has field plan
        const fieldPlanMatch = findMatchingFieldPlan(orgName);
        if (!fieldPlanMatch) {
          missingPlans++;
          Logger.log(`  Missing field plan: ${orgName}`);
        }
      }
    }
  }
  
  Logger.log(`\nSummary:`);
  Logger.log(`  Analyzed: ${analyzed}`);
  Logger.log(`  Pending: ${pending}`);
  Logger.log(`  Missing Field Plans: ${missingPlans}`);
}

/**
 * Test the combined weekly summary email
 * This will generate and send the weekly summary in test mode
 */
function testCombinedWeeklySummary() {
  Logger.log('Testing combined weekly summary...');
  generateWeeklySummary(true);
  Logger.log('Test weekly summary sent. Check datateam@alforward.org inbox.');
}