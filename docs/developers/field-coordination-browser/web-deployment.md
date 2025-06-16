---
layout: default
title: Web Deployment - Field Coordination Browser
---

# Web Deployment with Apps Script

This guide covers how to deploy web applications using Google Apps Script's HTML Service, from development to production.

## Deployment Architecture

### 1. **Web App Entry Point**

Every Apps Script web app starts with a `doGet()` function:

```javascript
function doGet(e) {
  // Parse URL parameters
  const params = e.parameter;
  const pathInfo = e.pathInfo;
  
  // Route to appropriate page
  if (params.page === 'admin') {
    return serveAdminPage();
  } else if (params.page === 'report') {
    return serveReportPage(params);
  } else {
    return serveMainPage();
  }
}

function serveMainPage() {
  const template = HtmlService.createTemplateFromFile('index');
  
  // Pass server-side data to template
  template.user = Session.getActiveUser().getEmail();
  template.config = getConfiguration();
  template.initialData = getInitialData();
  
  return template.evaluate()
    .setTitle('Field Coordination Browser')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setFaviconUrl('https://example.com/favicon.ico');
}
```

### 2. **HTML Templates**

Use templating for dynamic content:

```html
<!-- index.html -->
<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <meta charset="UTF-8">
  <title><?= title ?></title>
  
  <!-- Include CSS -->
  <?!= include('styles'); ?>
  
  <!-- Pass server data to client -->
  <script>
    window.APP_CONFIG = {
      user: <?= JSON.stringify(user) ?>,
      config: <?= JSON.stringify(config) ?>,
      initialData: <?= JSON.stringify(initialData) ?>
    };
  </script>
</head>
<body>
  <div id="app">
    <h1>Welcome, <?= user ?>!</h1>
    <div id="content">Loading...</div>
  </div>
  
  <!-- Include JavaScript -->
  <?!= include('javascript'); ?>
</body>
</html>
```

### 3. **Modular File Structure**

Organize code into separate files:

```javascript
// Include function for file inclusion
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
```

```html
<!-- styles.html -->
<style>
  :root {
    --primary-color: #1a73e8;
    --secondary-color: #34a853;
    --error-color: #ea4335;
    --background: #f8f9fa;
    --text-primary: #202124;
    --text-secondary: #5f6368;
  }
  
  * {
    box-sizing: border-box;
  }
  
  body {
    font-family: 'Google Sans', Roboto, Arial, sans-serif;
    margin: 0;
    padding: 0;
    background: var(--background);
    color: var(--text-primary);
  }
  
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }
  
  /* Responsive design */
  @media (max-width: 768px) {
    .container {
      padding: 10px;
    }
  }
</style>
```

## Client-Server Communication

### 1. **Using google.script.run**

```javascript
// Client-side JavaScript
class ApiClient {
  static call(functionName, ...args) {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        [functionName](...args);
    });
  }
  
  static async getData(filters = {}) {
    try {
      showLoading();
      const data = await this.call('getFilteredData', filters);
      hideLoading();
      return data;
    } catch (error) {
      hideLoading();
      showError(error);
      throw error;
    }
  }
  
  static async saveData(data) {
    try {
      showLoading();
      const result = await this.call('saveData', data);
      hideLoading();
      showSuccess('Data saved successfully');
      return result;
    } catch (error) {
      hideLoading();
      showError(error);
      throw error;
    }
  }
}

// Usage
async function loadDashboard() {
  try {
    const data = await ApiClient.getData({ status: 'active' });
    renderDashboard(data);
  } catch (error) {
    console.error('Failed to load dashboard:', error);
  }
}
```

### 2. **Server-side API**

```javascript
// Server-side handlers
function getFilteredData(filters) {
  try {
    // Validate user permissions
    const user = validateUser();
    
    // Apply filters
    let data = fetchAllData();
    
    if (filters.status) {
      data = data.filter(item => item.status === filters.status);
    }
    
    if (filters.assignedTo) {
      data = data.filter(item => item.assignedTo === filters.assignedTo);
    }
    
    // Log access
    logAccess(user, 'getData', filters);
    
    return {
      success: true,
      data: data,
      timestamp: new Date()
    };
    
  } catch (error) {
    console.error('Error in getFilteredData:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}

function saveData(data) {
  try {
    // Validate user permissions
    const user = validateUser();
    
    // Validate data
    validateDataStructure(data);
    
    // Save to spreadsheet
    const result = saveToSpreadsheet(data);
    
    // Send notifications
    sendUpdateNotifications(data, user);
    
    // Log action
    logAction(user, 'saveData', data);
    
    return {
      success: true,
      id: result.id,
      message: 'Data saved successfully'
    };
    
  } catch (error) {
    console.error('Error in saveData:', error);
    return {
      success: false,
      error: error.toString()
    };
  }
}
```

## User Interface Components

### 1. **Responsive Navigation**

```html
<!-- navigation.html -->
<nav class="navbar">
  <div class="nav-container">
    <div class="nav-brand">
      <img src="logo.png" alt="Logo" class="nav-logo">
      <span class="nav-title">Field Coordination</span>
    </div>
    
    <button class="nav-toggle" onclick="toggleMenu()">
      <span></span>
      <span></span>
      <span></span>
    </button>
    
    <ul class="nav-menu">
      <li><a href="#" onclick="navigate('dashboard')">Dashboard</a></li>
      <li><a href="#" onclick="navigate('browse')">Browse</a></li>
      <li><a href="#" onclick="navigate('reports')">Reports</a></li>
      <li><a href="#" onclick="navigate('settings')">Settings</a></li>
    </ul>
  </div>
</nav>

<style>
.navbar {
  background: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 60px;
}

.nav-toggle {
  display: none;
  flex-direction: column;
  background: none;
  border: none;
  cursor: pointer;
}

.nav-toggle span {
  width: 25px;
  height: 3px;
  background: var(--text-primary);
  margin: 3px 0;
  transition: 0.3s;
}

@media (max-width: 768px) {
  .nav-toggle {
    display: flex;
  }
  
  .nav-menu {
    position: fixed;
    left: -100%;
    top: 60px;
    flex-direction: column;
    background: white;
    width: 100%;
    text-align: center;
    transition: 0.3s;
    box-shadow: 0 10px 27px rgba(0,0,0,0.05);
  }
  
  .nav-menu.active {
    left: 0;
  }
}
</style>
```

### 2. **Loading States**

```javascript
// Loading state management
class LoadingManager {
  static show(message = 'Loading...') {
    const loader = document.getElementById('loader') || this.createLoader();
    const messageEl = loader.querySelector('.loader-message');
    messageEl.textContent = message;
    loader.classList.add('active');
  }
  
  static hide() {
    const loader = document.getElementById('loader');
    if (loader) {
      loader.classList.remove('active');
    }
  }
  
  static createLoader() {
    const loader = document.createElement('div');
    loader.id = 'loader';
    loader.className = 'loader-overlay';
    loader.innerHTML = `
      <div class="loader-content">
        <div class="loader-spinner"></div>
        <div class="loader-message">Loading...</div>
      </div>
    `;
    
    document.body.appendChild(loader);
    
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      .loader-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(255, 255, 255, 0.9);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s, visibility 0.3s;
        z-index: 9999;
      }
      
      .loader-overlay.active {
        opacity: 1;
        visibility: visible;
      }
      
      .loader-spinner {
        width: 40px;
        height: 40px;
        border: 4px solid #f3f3f3;
        border-top: 4px solid var(--primary-color);
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `;
    document.head.appendChild(style);
    
    return loader;
  }
}
```

### 3. **Error Handling UI**

```javascript
// Error display system
class ErrorHandler {
  static show(error, duration = 5000) {
    const errorContainer = this.getOrCreateContainer();
    const errorElement = this.createErrorElement(error);
    
    errorContainer.appendChild(errorElement);
    
    // Auto-remove after duration
    setTimeout(() => {
      errorElement.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => errorElement.remove(), 300);
    }, duration);
  }
  
  static getOrCreateContainer() {
    let container = document.getElementById('error-container');
    
    if (!container) {
      container = document.createElement('div');
      container.id = 'error-container';
      container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        max-width: 400px;
      `;
      document.body.appendChild(container);
    }
    
    return container;
  }
  
  static createErrorElement(error) {
    const div = document.createElement('div');
    div.className = 'error-notification';
    div.style.cssText = `
      background: #fff;
      border-left: 4px solid var(--error-color);
      padding: 16px;
      margin-bottom: 10px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      animation: slideIn 0.3s ease-out;
    `;
    
    div.innerHTML = `
      <div style="display: flex; align-items: start;">
        <svg width="20" height="20" style="flex-shrink: 0; margin-right: 12px;">
          <circle cx="10" cy="10" r="9" fill="#ea4335"/>
          <text x="10" y="15" text-anchor="middle" fill="white" font-size="14">!</text>
        </svg>
        <div style="flex: 1;">
          <div style="font-weight: 500; margin-bottom: 4px;">Error</div>
          <div style="color: var(--text-secondary); font-size: 14px;">
            ${this.sanitizeError(error)}
          </div>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" 
                style="background: none; border: none; cursor: pointer; padding: 4px;">
          ×
        </button>
      </div>
    `;
    
    return div;
  }
  
  static sanitizeError(error) {
    const message = error.message || error.toString();
    // Remove sensitive information
    return message
      .replace(/Script error.*/, 'An unexpected error occurred')
      .replace(/at.*\(.*\)/g, '') // Remove stack traces
      .replace(/https?:\/\/[^\s]+/g, ''); // Remove URLs
  }
}
```

## Deployment Process

### 1. **Development Deployment**

```javascript
// Configuration for development
const DEV_CONFIG = {
  mode: 'development',
  debugEnabled: true,
  testUsers: ['developer@example.com'],
  mockData: true,
  
  // Feature flags
  features: {
    newDashboard: true,
    advancedSearch: false,
    emailNotifications: false
  }
};

function getConfiguration() {
  const userEmail = Session.getActiveUser().getEmail();
  
  if (DEV_CONFIG.testUsers.includes(userEmail)) {
    return DEV_CONFIG;
  }
  
  return PROD_CONFIG;
}
```

### 2. **Production Deployment Steps**

```bash
# Deployment checklist

## 1. Pre-deployment
- [ ] Update version number
- [ ] Run all tests
- [ ] Check error logs
- [ ] Review code changes
- [ ] Update documentation

## 2. Configuration
- [ ] Set production spreadsheet IDs
- [ ] Configure email recipients
- [ ] Set appropriate permissions
- [ ] Enable error reporting

## 3. Deployment
- [ ] Create new deployment
- [ ] Test with limited users
- [ ] Monitor for errors
- [ ] Gradual rollout

## 4. Post-deployment
- [ ] Verify functionality
- [ ] Check performance
- [ ] Monitor user feedback
- [ ] Document known issues
```

### 3. **Deployment Script**

```javascript
// Automated deployment helper
function deployWebApp() {
  const ui = SpreadsheetApp.getUi();
  
  // Confirm deployment
  const response = ui.alert(
    'Deploy Web App',
    'Are you sure you want to deploy to production?',
    ui.ButtonSet.YES_NO
  );
  
  if (response !== ui.Button.YES) {
    return;
  }
  
  try {
    // Run pre-deployment checks
    runPreDeploymentChecks();
    
    // Update configuration
    updateProductionConfig();
    
    // Create deployment
    const url = createDeployment();
    
    // Show success
    ui.alert(
      'Deployment Successful',
      `Web app deployed at:\n${url}`,
      ui.ButtonSet.OK
    );
    
    // Log deployment
    logDeployment(url);
    
  } catch (error) {
    ui.alert(
      'Deployment Failed',
      error.toString(),
      ui.ButtonSet.OK
    );
  }
}

function runPreDeploymentChecks() {
  // Check for required configurations
  const requiredProps = [
    'SPREADSHEET_ID',
    'EMAIL_RECIPIENTS',
    'ERROR_EMAIL'
  ];
  
  const props = PropertiesService.getScriptProperties();
  const missing = requiredProps.filter(
    prop => !props.getProperty(prop)
  );
  
  if (missing.length > 0) {
    throw new Error(`Missing properties: ${missing.join(', ')}`);
  }
  
  // Verify spreadsheet access
  try {
    const ss = SpreadsheetApp.openById(
      props.getProperty('SPREADSHEET_ID')
    );
    ss.getName(); // Test access
  } catch (error) {
    throw new Error('Cannot access spreadsheet: ' + error);
  }
}
```

## Performance Optimization

### 1. **Code Splitting**

```javascript
// Lazy load components
class ComponentLoader {
  static async load(componentName) {
    if (this.loaded[componentName]) {
      return this.loaded[componentName];
    }
    
    try {
      const component = await google.script.run
        .withSuccessHandler(code => {
          // Create and execute component
          const script = document.createElement('script');
          script.textContent = code;
          document.head.appendChild(script);
          return window[componentName];
        })
        .withFailureHandler(error => {
          console.error(`Failed to load ${componentName}:`, error);
          throw error;
        })
        .getComponent(componentName);
      
      this.loaded[componentName] = component;
      return component;
      
    } catch (error) {
      throw new Error(`Component ${componentName} failed to load`);
    }
  }
  
  static loaded = {};
}

// Server-side component provider
function getComponent(name) {
  const components = {
    'ReportGenerator': 'report-generator.html',
    'AdvancedSearch': 'advanced-search.html',
    'DataVisualizer': 'data-visualizer.html'
  };
  
  if (!components[name]) {
    throw new Error(`Unknown component: ${name}`);
  }
  
  return HtmlService.createHtmlOutputFromFile(components[name])
    .getContent();
}
```

### 2. **Caching Strategy**

```javascript
// Client-side caching
class CacheManager {
  static cache = new Map();
  static maxSize = 50;
  static ttl = 5 * 60 * 1000; // 5 minutes
  
  static set(key, value, customTtl) {
    // Implement LRU eviction
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      value: value,
      expires: Date.now() + (customTtl || this.ttl)
    });
  }
  
  static get(key) {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() > item.expires) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  static async getOrFetch(key, fetchFn, ttl) {
    const cached = this.get(key);
    if (cached !== null) return cached;
    
    const value = await fetchFn();
    this.set(key, value, ttl);
    return value;
  }
}
```

### 3. **Progressive Enhancement**

```javascript
// Start with basic functionality, enhance progressively
document.addEventListener('DOMContentLoaded', () => {
  // Basic functionality available immediately
  initBasicUI();
  
  // Enhance with advanced features
  if ('IntersectionObserver' in window) {
    initLazyLoading();
  }
  
  if ('serviceWorker' in navigator) {
    initOfflineSupport();
  }
  
  // Load advanced components asynchronously
  requestIdleCallback(() => {
    loadAdvancedFeatures();
  });
});

function initBasicUI() {
  // Essential functionality
  document.querySelectorAll('[data-action]').forEach(el => {
    el.addEventListener('click', handleAction);
  });
}

function loadAdvancedFeatures() {
  // Non-essential enhancements
  import('./analytics.js');
  import('./tooltips.js');
  import('./animations.js');
}
```

## Security Best Practices

### 1. **Content Security**

```javascript
// Sanitize user input
function sanitizeHTML(html) {
  const div = document.createElement('div');
  div.textContent = html;
  return div.innerHTML;
}

// Validate data before sending to server
function validateFormData(data) {
  const errors = [];
  
  // Check required fields
  if (!data.name || data.name.trim().length === 0) {
    errors.push('Name is required');
  }
  
  // Validate email
  if (data.email && !isValidEmail(data.email)) {
    errors.push('Invalid email address');
  }
  
  // Check length limits
  if (data.description && data.description.length > 1000) {
    errors.push('Description too long (max 1000 characters)');
  }
  
  return errors;
}
```

### 2. **Access Control**

```javascript
// Server-side access control
function checkPermissions(action, resource) {
  const user = Session.getActiveUser().getEmail();
  const permissions = getUserPermissions(user);
  
  if (!permissions[action] || !permissions[action].includes(resource)) {
    throw new Error('Access denied');
  }
  
  return true;
}

// Client-side permission checks
function canUserEdit() {
  return APP_CONFIG.user.permissions.includes('edit');
}

function renderEditButton() {
  if (canUserEdit()) {
    return '<button onclick="editItem()">Edit</button>';
  }
  return '';
}
```

## Next Steps

- Learn about [Class Structures](/appsscript/developers/fieldplan-analyzer/class-structure) for organized code
- Explore [Timer Implementation](/appsscript/developers/fieldplan-analyzer/timers) for automation
- Master [Email Response Generation](/appsscript/developers/fieldplan-analyzer/email-responses)