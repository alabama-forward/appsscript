# Budget Analyzer Requirements Questions

## Overview
These questions will help clarify the requirements for developing a budget analyzer that integrates with the existing field plan analyzer system.

## Questions

### 1. Email Recipients and Content
Who should receive the budget analysis emails? Should it be the same recipients as the field plan emails (gabri@alforward.org, sherri@alforward.org, deanna@alforward.org, datateam@alforward.org), or a different group? What specific budget metrics and analysis should be included in the email?

Answer: The same emails that receive the field plan analysis should receive the budget analysis. The budget analysis should be similar to that of the fieldplan in that it sets a reasonable and unreasonable range. The budget_trigger_functions set a target costs per attempt for each tactic. The email should also include the results of the budget_class helper functions.

### 2. Budget-to-Field Plan Matching Logic
When matching budgets to field plans, should the system only match by exact organization name, or should it handle variations (e.g., "Organization ABC" vs "Organization ABC Inc.")? What should happen if multiple field plans exist for the same organization?

Answer: The matching should be done using the MEMBER ORG or MEMBER NAME columns for the field plan and budget analyzer. The names are already normalized so it should use exact matching. If there multiple field plans for the same organization, check if an analysis has already occured. If it has, return a new analysis using the newest field plan. 

### 3. Analysis Calculations
Which specific calculations from the budget should be compared against the field plan data? For example:
- Should we calculate if the requested canvass funding aligns with the door/open canvassing attempts?
- Should we verify if data funding requests match the expected data entry hours?
- Should we compare travel costs against the geographic scope (field counties)?

Answer: For now, we want to a simpler one to one comparisons. So that if there is a budget item for open canvassing, it should be compared to the open canvassing field in the field plan.

### 4. Gap Analysis Integration
How should the "gap" fields (adminGap, dataGap, etc.) factor into the analysis? Should the analyzer recommend funding levels based on the field plan metrics, or just report on the alignment between requested amounts and planned activities?

Answer: The analyzer should bot report on the alignment AND should flag if we can increase funding based on the gap while remaining within a standard deviation of the target cost per attempt.

### 5. Cost-Per-Attempt Thresholds
The current budget_trigger_functions.js defines target costs per attempt (DOOR: $1.00, PHONE: $0.66, TEXT: $0.02, OPEN: $0.40). Should these thresholds be used in the email analysis? Should organizations exceeding these thresholds receive specific recommendations?

Answer: The upper and lower bands of these should be within a standard deviation of the cost. 

### 6. Unmatched Budgets Handling
What should happen to budgets that don't have matching field plans after multiple 12-hour checks? Should there be a maximum wait time before sending a "missing field plan" notification? Should these budgets be tracked separately?

Answer: If a budget is submitted but a matching field plan hasnt been found after 72 hours, email the same email addresses that would have received the analysis. 

### 7. Analysis Status Tracking
Should the system update the "analyzed" field in the budget sheet after sending the analysis email? Should it track which budgets have been analyzed, which are pending field plans, and which have been skipped?

Answer: Yes. The system should update the analyzed field. AND the program should only analyze those budget rows that don't show that they have been analyzed yet. This should be the first thing that the system checks every 12 hours. 

### 8. Timing and Trigger Coordination
Should the budget analyzer run independently of the field plan analyzer, or should they coordinate? For example, should a budget analysis automatically trigger when a matching field plan is found, even if it's not the regular 12-hour check?

Answer: The budget analyzer should run independently. Note however that the field plan submission should trigger the budget analyzer to look for a matching budget. 

### 9. Historical Data and Amendments
How should the system handle updated budgets or field plans? If an organization submits a revised budget or field plan, should it re-analyze and send a new email? Should it track version history?

Answer: The system should look for updates to the budget or field plans that are already there and let the email recipients know that an update was made and should trigger a new field plan analysis and a new budget analysis.

### 10. Failure Scenarios and Notifications
What should happen if a budget has critical issues (e.g., negative values, missing required fields, calculation errors)? Should the system send error notifications to administrators? Should it attempt to process other budgets if one fails?

Answer: If the system encounters a critical issue, it should alert the email recipients and continue analyzing the subsequent budgetss.

## Additional Considerations

- Should the analyzer generate any summary reports across all budgets? Answer: Once a week, the budget analyzer and field plan analyzer should generate a summary. 
- Should there be a way to manually trigger analysis for specific organizations? Answer: Absolutely!
- Should the email include comparisons to other similar organizations? Answer: No.
- Should the system maintain a log of all analyses performed? Answer: Yes.