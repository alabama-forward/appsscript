# Environment Variables in Google Apps Script

Google Apps Script doesn't support traditional environment variables, but there are several ways to store and access configuration values:

## 1. Script Properties (Recommended)

Best for project-level configuration and settings:

```javascript
// Set values
PropertiesService.getScriptProperties().setProperty("BQ_PROJECT_ID", "my-project-id");
PropertiesService.getScriptProperties().setProperty("DATASET_ID", "my-dataset");

// Get values
const projectId = PropertiesService.getScriptProperties().getProperty("BQ_PROJECT_ID");
const datasetId = PropertiesService.getScriptProperties().getProperty("DATASET_ID");
```

## 2. User Properties

For user-specific settings:

```javascript
// Set values specific to the current user
PropertiesService.getUserProperties().setProperty("PREFERRED_ORG", "org-name");

// Get user-specific values
const userPreferredOrg = PropertiesService.getUserProperties().getProperty("PREFERRED_ORG");
```

## 3. Document Properties

For settings specific to the container document:

```javascript
// Set values specific to this document
PropertiesService.getDocumentProperties().setProperty("LAST_UPDATED", new Date().toISOString());

// Get document-specific values
const lastUpdated = PropertiesService.getDocumentProperties().getProperty("LAST_UPDATED");
```

## 4. Secret Manager Integration

For sensitive data (API keys, credentials), use Google Cloud Secret Manager:

1. Set up Secret Manager in Google Cloud Console
2. Use the Apps Script Secret Manager integration (newer feature)

## 5. In-Code Constants

For non-sensitive, static configuration:

```javascript
// Define at the top of your script
const CONFIG = {
  PROJECT_ID: "my-project-id",
  DATASET_ID: "my-dataset",
  TABLE_ID: "precinct_data"
};

// Use throughout your code
function myFunction() {
  const tableId = CONFIG.TABLE_ID;
  // ...
}
```

## BigQuery Configuration

The application uses a central configuration object for BigQuery settings in `BigQueryIntegration.js`:

```javascript
const BIGQUERY_CONFIG = {
  // Project ID for all BigQuery operations
  projectId: 'prod-sv-al-898733e3',
  
  // Dataset for saving query history and results
  historyDataset: 'alforward',
  historyTableId: 'precinct_query_history',
  resultsTableId: 'latest_query_results',
  
  // Catalist database datasets
  catalistConfig: {
    districtDataset: 'catalist_AL.District',
    personDataset: 'catalist_AL.Person',
    modelsDataset: 'catalist_AL.Models',
    historyDataset: 'catalist_AL.Vote_History'
  },
  
  // Query timeout in milliseconds (5 minutes)
  queryTimeoutMs: 300000
};
```

To update these values for your environment, edit the `BIGQUERY_CONFIG` object at the top of the `BigQueryIntegration.js` file.

## Best Practices

1. Use Script Properties for configuration that might change between environments
2. Never hardcode sensitive information (API keys, credentials)
3. Use descriptive property names (BQ_PROJECT_ID vs PROJECT)
4. Consider adding functions to centralize property access:

```javascript
function getConfig(key, defaultValue = null) {
  const value = PropertiesService.getScriptProperties().getProperty(key);
  return value !== null ? value : defaultValue;
}

// Usage
const projectId = getConfig("BQ_PROJECT_ID", "default-project");
```