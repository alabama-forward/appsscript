---
layout: default
title: Script Properties Guide
parent: Developer Documentation
nav_order: 4
---

# Script Properties Guide
{: .no_toc }

## Table of contents
{: .no_toc .text-delta }

1. TOC
{:toc}

---

## Overview

Script Properties in Google Apps Script provide a secure way to store configuration values, API keys, and other sensitive information outside of your code. This guide explains how to use Script Properties effectively in your Apps Script projects.

## Why Use Script Properties?

### Security Benefits
- **Keep sensitive data out of your code**: Never hardcode API keys, spreadsheet IDs, or email addresses
- **Prevent accidental exposure**: Script properties are not included when sharing or publishing code
- **Separate configuration from logic**: Makes your code more maintainable and secure

### Development Benefits
- **Environment-specific configuration**: Different values for development vs. production
- **Easy updates**: Change configuration without modifying code
- **Team collaboration**: Each developer can use their own test spreadsheets

## Setting Script Properties

### Through the Apps Script Editor

1. Open your Apps Script project
2. Click on **Project Settings** (gear icon) in the left sidebar
3. Scroll down to **Script Properties**
4. Click **Add script property**
5. Enter the property name and value
6. Click **Save script properties**

### Through Code

```javascript
// Set a single property
PropertiesService.getScriptProperties().setProperty('KEY_NAME', 'value');

// Set multiple properties
PropertiesService.getScriptProperties().setProperties({
  'SPREADSHEET_ID': 'your-spreadsheet-id',
  'EMAIL_RECIPIENTS': 'email1@example.com,email2@example.com',
  'API_KEY': 'your-api-key'
});

// Delete a property
PropertiesService.getScriptProperties().deleteProperty('KEY_NAME');

// Delete all properties (use with caution!)
PropertiesService.getScriptProperties().deleteAllProperties();
```

## Reading Script Properties

### Basic Usage

```javascript
// Get a single property
const scriptProps = PropertiesService.getScriptProperties();
const spreadsheetId = scriptProps.getProperty('SPREADSHEET_ID');

// Get all properties as an object
const allProps = scriptProps.getProperties();
```

### With Fallback Values

Always provide fallback values to handle missing properties gracefully:

```javascript
const scriptProps = PropertiesService.getScriptProperties();

// Using logical OR for fallback
const spreadsheetId = scriptProps.getProperty('SPREADSHEET_ID') || 'default-spreadsheet-id';

// For numeric values, be careful with falsy values
const timeout = parseInt(scriptProps.getProperty('TIMEOUT_MS') || '5000');

// For boolean values
const debugMode = scriptProps.getProperty('DEBUG_MODE') === 'true';
```

## Best Practices

### 1. Use Descriptive Names

Use clear, consistent naming conventions:

```javascript
// Good
const SPREADSHEET_ID = scriptProps.getProperty('SPREADSHEET_ID');
const BQ_PROJECT_ID = scriptProps.getProperty('BQ_PROJECT_ID');
const EMAIL_RECIPIENTS = scriptProps.getProperty('EMAIL_RECIPIENTS');

// Avoid
const id = scriptProps.getProperty('id');
const proj = scriptProps.getProperty('proj');
```

### 2. Group Related Properties

Use prefixes to group related properties:

```javascript
// BigQuery configuration
const BQ_PROJECT_ID = scriptProps.getProperty('BQ_PROJECT_ID');
const BQ_DATASET_ID = scriptProps.getProperty('BQ_DATASET_ID');
const BQ_TABLE_ID = scriptProps.getProperty('BQ_TABLE_ID');

// Email configuration
const EMAIL_RECIPIENTS = scriptProps.getProperty('EMAIL_RECIPIENTS');
const EMAIL_REPLY_TO = scriptProps.getProperty('EMAIL_REPLY_TO');
const EMAIL_SUBJECT_PREFIX = scriptProps.getProperty('EMAIL_SUBJECT_PREFIX');
```

### 3. Document Required Properties

Create a configuration template for your project:

```javascript
/**
 * Required Script Properties:
 * 
 * SPREADSHEET_ID - The ID of the main data spreadsheet
 * EMAIL_RECIPIENTS - Comma-separated list of email addresses
 * 
 * Optional Script Properties:
 * 
 * DEBUG_MODE - Set to 'true' to enable debug logging
 * CACHE_DURATION - Cache duration in seconds (default: 3600)
 */
```

### 4. Validate Properties on Startup

```javascript
function validateConfiguration() {
  const required = ['SPREADSHEET_ID', 'EMAIL_RECIPIENTS', 'API_KEY'];
  const scriptProps = PropertiesService.getScriptProperties();
  const missing = [];
  
  required.forEach(prop => {
    if (!scriptProps.getProperty(prop)) {
      missing.push(prop);
    }
  });
  
  if (missing.length > 0) {
    throw new Error(`Missing required script properties: ${missing.join(', ')}`);
  }
}
```

## Common Patterns

### Configuration Object Pattern

Create a configuration object that centralizes all property access:

```javascript
const Config = {
  get spreadsheetId() {
    return PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  },
  
  get emailRecipients() {
    const recipients = PropertiesService.getScriptProperties().getProperty('EMAIL_RECIPIENTS') || '';
    return recipients.split(',').map(email => email.trim());
  },
  
  get debugMode() {
    return PropertiesService.getScriptProperties().getProperty('DEBUG_MODE') === 'true';
  },
  
  get cacheTimeout() {
    return parseInt(PropertiesService.getScriptProperties().getProperty('CACHE_TIMEOUT') || '3600');
  }
};

// Usage
const spreadsheet = SpreadsheetApp.openById(Config.spreadsheetId);
MailApp.sendEmail(Config.emailRecipients.join(','), subject, body);
```

### Lazy Loading Pattern

Load properties once and cache them:

```javascript
let configCache = null;

function getConfig() {
  if (!configCache) {
    const scriptProps = PropertiesService.getScriptProperties();
    configCache = {
      spreadsheetId: scriptProps.getProperty('SPREADSHEET_ID'),
      sheetNames: {
        data: scriptProps.getProperty('SHEET_DATA') || 'Data',
        config: scriptProps.getProperty('SHEET_CONFIG') || 'Config',
        log: scriptProps.getProperty('SHEET_LOG') || 'Log'
      },
      email: {
        recipients: (scriptProps.getProperty('EMAIL_RECIPIENTS') || '').split(','),
        replyTo: scriptProps.getProperty('EMAIL_REPLY_TO') || 'noreply@example.com'
      }
    };
  }
  return configCache;
}

// Clear cache when properties change
function clearConfigCache() {
  configCache = null;
}
```

## Migration Guide

### Converting Hardcoded Values

Before:
```javascript
const SPREADSHEET_ID = '1234567890abcdef';
const EMAIL_RECIPIENTS = ['user1@example.com', 'user2@example.com'];
const API_ENDPOINT = 'https://api.example.com/v1';
```

After:
```javascript
const scriptProps = PropertiesService.getScriptProperties();
const SPREADSHEET_ID = scriptProps.getProperty('SPREADSHEET_ID');
const EMAIL_RECIPIENTS = (scriptProps.getProperty('EMAIL_RECIPIENTS') || '').split(',');
const API_ENDPOINT = scriptProps.getProperty('API_ENDPOINT') || 'https://api.example.com/v1';
```

### Creating a Properties Template

Create a template file (not included in version control) for team members:

```javascript
// script-properties-template.js
// Copy this file and set your own values
// DO NOT commit actual values to version control

const PROPERTIES_TEMPLATE = {
  // Spreadsheet Configuration
  'SPREADSHEET_ID': 'your-spreadsheet-id-here',
  'SHEET_DATA': 'Data',
  'SHEET_CONFIG': 'Config',
  
  // Email Configuration
  'EMAIL_RECIPIENTS': 'email1@example.com,email2@example.com',
  'EMAIL_REPLY_TO': 'noreply@example.com',
  
  // API Configuration
  'API_KEY': 'your-api-key-here',
  'API_ENDPOINT': 'https://api.example.com/v1',
  
  // Feature Flags
  'DEBUG_MODE': 'false',
  'ENABLE_CACHING': 'true'
};

// Function to set all properties at once
function initializeProperties() {
  PropertiesService.getScriptProperties().setProperties(PROPERTIES_TEMPLATE);
  console.log('Script properties initialized');
}
```

## Security Considerations

### What NOT to Store

Even though Script Properties are more secure than hardcoding, avoid storing:
- User passwords
- OAuth tokens (use the OAuth2 library instead)
- Highly sensitive data that should be encrypted

### Access Control

- Script Properties are accessible to anyone with edit access to the script
- Use Google Cloud IAM for more granular access control
- Consider using Google Cloud Secret Manager for highly sensitive data

### Audit Trail

Log access to sensitive properties:

```javascript
function getSecureProperty(propertyName) {
  const value = PropertiesService.getScriptProperties().getProperty(propertyName);
  
  // Log access (be careful not to log the actual value)
  console.log(`Property accessed: ${propertyName} by ${Session.getActiveUser().getEmail()}`);
  
  return value;
}
```

## Troubleshooting

### Common Issues

1. **Property not found**: Always use fallback values
2. **Type conversion errors**: Script Properties are always strings
3. **Quota limits**: Script Properties have a 500KB total storage limit
4. **Property not updating**: Clear any caches after updating properties

### Debugging

```javascript
// List all current properties (careful with sensitive data)
function debugProperties() {
  const props = PropertiesService.getScriptProperties().getProperties();
  
  // Log property names only (not values)
  console.log('Current properties:', Object.keys(props));
  
  // Check specific property
  const spreadsheetId = props['SPREADSHEET_ID'];
  console.log('Spreadsheet ID exists:', !!spreadsheetId);
}
```

## Example: Complete Configuration Setup

Here's a complete example showing how to set up and use Script Properties in a project:

```javascript
// config.js - Configuration management

/**
 * Configuration object with all script properties
 */
const Config = (() => {
  let cache = null;
  
  const load = () => {
    if (cache) return cache;
    
    const scriptProps = PropertiesService.getScriptProperties();
    
    cache = {
      // Spreadsheet configuration
      spreadsheet: {
        id: scriptProps.getProperty('SPREADSHEET_ID'),
        sheets: {
          data: scriptProps.getProperty('SHEET_DATA') || 'Data',
          config: scriptProps.getProperty('SHEET_CONFIG') || 'Configuration',
          log: scriptProps.getProperty('SHEET_LOG') || 'Log'
        }
      },
      
      // Email configuration
      email: {
        recipients: (scriptProps.getProperty('EMAIL_RECIPIENTS') || '').split(',').map(e => e.trim()),
        replyTo: scriptProps.getProperty('EMAIL_REPLY_TO') || 'noreply@example.com',
        subjectPrefix: scriptProps.getProperty('EMAIL_SUBJECT_PREFIX') || '[AutoReport]'
      },
      
      // API configuration
      api: {
        key: scriptProps.getProperty('API_KEY'),
        endpoint: scriptProps.getProperty('API_ENDPOINT'),
        timeout: parseInt(scriptProps.getProperty('API_TIMEOUT_MS') || '30000')
      },
      
      // Feature flags
      features: {
        debugMode: scriptProps.getProperty('DEBUG_MODE') === 'true',
        enableCache: scriptProps.getProperty('ENABLE_CACHE') !== 'false',
        sendEmails: scriptProps.getProperty('SEND_EMAILS') !== 'false'
      }
    };
    
    return cache;
  };
  
  const reload = () => {
    cache = null;
    return load();
  };
  
  const validate = () => {
    const config = load();
    const errors = [];
    
    if (!config.spreadsheet.id) {
      errors.push('SPREADSHEET_ID is required');
    }
    
    if (config.email.recipients.length === 0) {
      errors.push('EMAIL_RECIPIENTS is required');
    }
    
    if (config.api.key && !config.api.endpoint) {
      errors.push('API_ENDPOINT is required when API_KEY is set');
    }
    
    if (errors.length > 0) {
      throw new Error(`Configuration errors:\n${errors.join('\n')}`);
    }
    
    return true;
  };
  
  return {
    get: () => load(),
    reload,
    validate
  };
})();

// Usage example
function main() {
  try {
    Config.validate();
    const config = Config.get();
    
    const spreadsheet = SpreadsheetApp.openById(config.spreadsheet.id);
    const dataSheet = spreadsheet.getSheetByName(config.spreadsheet.sheets.data);
    
    // Process data...
    
    if (config.features.sendEmails) {
      MailApp.sendEmail({
        to: config.email.recipients.join(','),
        replyTo: config.email.replyTo,
        subject: `${config.email.subjectPrefix} Daily Report`,
        body: 'Report content here'
      });
    }
  } catch (error) {
    console.error('Error in main:', error);
    throw error;
  }
}
```

## Next Steps

- Review the [Apps Script Security Guide](https://developers.google.com/apps-script/guides/security)
- Learn about [Google Cloud Secret Manager](https://cloud.google.com/secret-manager) for advanced use cases
- Implement property validation in your projects
- Create a properties template for your team