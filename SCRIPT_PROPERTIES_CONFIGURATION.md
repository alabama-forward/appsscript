# Script Properties Configuration Guide

This document contains all the script properties that need to be configured in your Google Apps Script projects. Add these properties BEFORE updating the code to use them.

## How to Add Script Properties

1. Open your Apps Script project in the editor
2. Click on **Project Settings** (gear icon) in the left sidebar
3. Scroll down to **Script Properties** section
4. Click **Add Script Property**
5. Enter each key-value pair exactly as shown below
6. Click **Save Script Properties**

---

## Field Coordination Browser Properties

Add these properties to your Field Coordination Browser Apps Script project:

### Core Configuration
| Property Key | Property Value |
|--------------|----------------|
| `SPREADSHEET_ID` | `1E3yYNnPbrUNpdIU8TCjcKGtMe5T8qSuvh_1p_zkhZI0` |
| `DATA_SHARING_DOC_URL` | `https://docs.google.com/spreadsheets/d/1E3yYNnPbrUNpdIU8TCjcKGtMe5T8qSuvh_1p_zkhZI0/edit?gid=364896837#gid=364896837` |

### Sheet Names
| Property Key | Property Value |
|--------------|----------------|
| `SHEET_FIELD_PLAN` | `2025_field_plan` |
| `SHEET_PRIORITIES` | `priorities` |
| `SHEET_SEARCH` | `search` |
| `SHEET_ORG_CONTACTS` | `orgContacts` |
| `SHEET_USER_SELECTIONS` | `userSelections` |

### Email Configuration
| Property Key | Property Value |
|--------------|----------------|
| `EMAIL_RECIPIENTS` | `datateam@alforward.org,sherri@alforward.org` |
| `EMAIL_FALLBACK` | `gabri@alforward.org` |

### BigQuery Configuration (Optional - only if using BigQuery integration)
| Property Key | Property Value |
|--------------|----------------|
| `BQ_PROJECT_ID` | `prod-sv-al-898733e3` |
| `BQ_HISTORY_DATASET` | `alforward` |
| `BQ_HISTORY_TABLE` | `precinct_query_history` |
| `BQ_RESULTS_TABLE` | `latest_query_results` |
| `BQ_CATALIST_DISTRICT_DATASET` | `catalist_AL.District` |
| `BQ_CATALIST_PERSON_DATASET` | `catalist_AL.Person` |
| `BQ_CATALIST_MODELS_DATASET` | `catalist_AL.Models` |
| `BQ_CATALIST_HISTORY_DATASET` | `catalist_AL.Vote_History` |
| `BQ_QUERY_TIMEOUT_MS` | `300000` |

---

## FieldPlan Analyzer Properties

Add these properties to your FieldPlan Analyzer Apps Script project:

### Sheet Names
| Property Key | Property Value |
|--------------|----------------|
| `SHEET_FIELD_PLAN` | `2025_field_plan` |
| `SHEET_FIELD_BUDGET` | `2025_field_budget` |

### Email Configuration
| Property Key | Property Value |
|--------------|----------------|
| `EMAIL_RECIPIENTS` | `gabri@alforward.org,sherri@alforward.org,deanna@alforward.org,datateam@alforward.org` |
| `EMAIL_TEST_RECIPIENTS` | `datateam@alforward.org` |
| `EMAIL_REPLY_TO` | `datateam@alforward.org` |

### Cost Targets
| Property Key | Property Value |
|--------------|----------------|
| `COST_TARGET_DOOR` | `1.00` |
| `COST_TARGET_DOOR_STDDEV` | `0.20` |
| `COST_TARGET_PHONE` | `0.66` |
| `COST_TARGET_PHONE_STDDEV` | `0.15` |
| `COST_TARGET_TEXT` | `0.02` |
| `COST_TARGET_TEXT_STDDEV` | `0.01` |
| `COST_TARGET_OPEN` | `0.40` |
| `COST_TARGET_OPEN_STDDEV` | `0.10` |

### Trigger Configuration
| Property Key | Property Value |
|--------------|----------------|
| `TRIGGER_BUDGET_ANALYSIS_HOURS` | `12` |
| `TRIGGER_FIELD_PLAN_CHECK_HOURS` | `12` |
| `TRIGGER_MISSING_PLAN_THRESHOLD_HOURS` | `72` |
| `TRIGGER_WEEKLY_SUMMARY_DAY` | `MONDAY` |
| `TRIGGER_WEEKLY_SUMMARY_HOUR` | `9` |

---

## Important Notes

1. **Copy Values Exactly**: Make sure to copy the property values exactly as shown, including any special characters or formatting.

2. **No Quotes in Values**: When entering values in the Script Properties interface, DO NOT include quotes around the values. The interface automatically handles string values.

3. **Comma-Separated Lists**: For properties with multiple email addresses, keep them as comma-separated values without spaces after commas.

4. **Test After Adding**: After adding all properties, test your script to ensure it can access them correctly using:
   ```javascript
   function testProperties() {
     const props = PropertiesService.getScriptProperties();
     console.log('SPREADSHEET_ID:', props.getProperty('SPREADSHEET_ID'));
     console.log('EMAIL_RECIPIENTS:', props.getProperty('EMAIL_RECIPIENTS'));
   }
   ```

5. **Security**: Script Properties are only visible to users with edit access to your script. They are more secure than hardcoding values in your code.

---

## After Adding Properties

Once you've added all the script properties:

1. **Verify** all properties are saved correctly
2. **Update your code** to use `PropertiesService.getScriptProperties().getProperty('KEY_NAME')` instead of hardcoded values
3. **Test** each function to ensure it works with the new configuration
4. **Remove** hardcoded values from your code

## Troubleshooting

If a script property isn't working:
- Check for typos in the property key
- Ensure there are no extra spaces in keys or values
- Verify the property was saved (refresh the page and check)
- Use the test function above to debug

---

*Remember: After updating script properties, you'll need to update your code to use these properties instead of hardcoded values.*