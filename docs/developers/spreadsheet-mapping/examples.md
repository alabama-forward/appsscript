---
layout: default
title: Mapping Examples
parent: Spreadsheet Mapping
grand_parent: For Developers
nav_order: 2
---

# Spreadsheet Mapping Examples

Real-world examples of spreadsheet mapping patterns for common use cases.

## Example 1: Inventory Management System

### Sheet Structure

```javascript
// Inventory tracking with multiple related sheets
const INVENTORY_CONFIG = {
  sheets: {
    PRODUCTS: 'Products',
    INVENTORY: 'Inventory',
    TRANSACTIONS: 'Transactions',
    SUPPLIERS: 'Suppliers'
  },
  
  columns: {
    PRODUCTS: {
      SKU: 0,
      NAME: 1,
      CATEGORY: 2,
      UNIT_COST: 3,
      SALE_PRICE: 4,
      SUPPLIER_ID: 5
    },
    INVENTORY: {
      SKU: 0,
      QUANTITY: 1,
      LOCATION: 2,
      REORDER_POINT: 3,
      LAST_UPDATED: 4
    },
    TRANSACTIONS: {
      ID: 0,
      DATE: 1,
      SKU: 2,
      TYPE: 3, // 'IN' or 'OUT'
      QUANTITY: 4,
      REFERENCE: 5
    }
  }
};
```

### Implementation

```javascript
class InventoryManager {
  constructor() {
    this.ss = SpreadsheetApp.getActiveSpreadsheet();
    this.cache = {};
  }
  
  // Get current stock level for a product
  getStockLevel(sku) {
    const sheet = this.ss.getSheetByName(INVENTORY_CONFIG.sheets.INVENTORY);
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][INVENTORY_CONFIG.columns.INVENTORY.SKU] === sku) {
        return {
          sku: sku,
          quantity: data[i][INVENTORY_CONFIG.columns.INVENTORY.QUANTITY],
          location: data[i][INVENTORY_CONFIG.columns.INVENTORY.LOCATION],
          reorderPoint: data[i][INVENTORY_CONFIG.columns.INVENTORY.REORDER_POINT]
        };
      }
    }
    return null;
  }
  
  // Record a transaction and update inventory
  recordTransaction(sku, type, quantity, reference) {
    const transactionSheet = this.ss.getSheetByName(INVENTORY_CONFIG.sheets.TRANSACTIONS);
    const inventorySheet = this.ss.getSheetByName(INVENTORY_CONFIG.sheets.INVENTORY);
    
    // Generate transaction ID
    const transactionId = 'TRX' + Date.now();
    
    // Add transaction record
    transactionSheet.appendRow([
      transactionId,
      new Date(),
      sku,
      type,
      quantity,
      reference
    ]);
    
    // Update inventory
    const inventoryData = inventorySheet.getDataRange().getValues();
    for (let i = 1; i < inventoryData.length; i++) {
      if (inventoryData[i][INVENTORY_CONFIG.columns.INVENTORY.SKU] === sku) {
        const currentQty = inventoryData[i][INVENTORY_CONFIG.columns.INVENTORY.QUANTITY];
        const newQty = type === 'IN' ? currentQty + quantity : currentQty - quantity;
        
        inventorySheet.getRange(i + 1, INVENTORY_CONFIG.columns.INVENTORY.QUANTITY + 1)
          .setValue(newQty);
        inventorySheet.getRange(i + 1, INVENTORY_CONFIG.columns.INVENTORY.LAST_UPDATED + 1)
          .setValue(new Date());
        
        break;
      }
    }
    
    return transactionId;
  }
  
  // Get products below reorder point
  getLowStockProducts() {
    const inventorySheet = this.ss.getSheetByName(INVENTORY_CONFIG.sheets.INVENTORY);
    const productsSheet = this.ss.getSheetByName(INVENTORY_CONFIG.sheets.PRODUCTS);
    
    const inventoryData = inventorySheet.getDataRange().getValues();
    const productsData = productsSheet.getDataRange().getValues();
    
    const lowStock = [];
    
    for (let i = 1; i < inventoryData.length; i++) {
      const qty = inventoryData[i][INVENTORY_CONFIG.columns.INVENTORY.QUANTITY];
      const reorderPoint = inventoryData[i][INVENTORY_CONFIG.columns.INVENTORY.REORDER_POINT];
      
      if (qty <= reorderPoint) {
        const sku = inventoryData[i][INVENTORY_CONFIG.columns.INVENTORY.SKU];
        
        // Find product details
        const product = productsData.find(row => 
          row[INVENTORY_CONFIG.columns.PRODUCTS.SKU] === sku
        );
        
        if (product) {
          lowStock.push({
            sku: sku,
            name: product[INVENTORY_CONFIG.columns.PRODUCTS.NAME],
            currentQty: qty,
            reorderPoint: reorderPoint,
            supplier: product[INVENTORY_CONFIG.columns.PRODUCTS.SUPPLIER_ID]
          });
        }
      }
    }
    
    return lowStock;
  }
}
```

## Example 2: CRM System

### Sheet Structure

```javascript
const CRM_CONFIG = {
  sheets: {
    CONTACTS: 'Contacts',
    COMPANIES: 'Companies',
    INTERACTIONS: 'Interactions',
    OPPORTUNITIES: 'Opportunities'
  },
  
  columns: {
    CONTACTS: {
      ID: 0,
      FIRST_NAME: 1,
      LAST_NAME: 2,
      EMAIL: 3,
      PHONE: 4,
      COMPANY_ID: 5,
      STATUS: 6,
      LAST_CONTACT: 7
    },
    INTERACTIONS: {
      ID: 0,
      DATE: 1,
      CONTACT_ID: 2,
      TYPE: 3, // Email, Call, Meeting
      NOTES: 4,
      NEXT_ACTION: 5,
      NEXT_DATE: 6
    }
  }
};
```

### Implementation with Relationships

```javascript
class CRMSystem {
  constructor() {
    this.ss = SpreadsheetApp.getActiveSpreadsheet();
  }
  
  // Get contact with related data
  getContactDetails(contactId) {
    const contactSheet = this.ss.getSheetByName(CRM_CONFIG.sheets.CONTACTS);
    const interactionSheet = this.ss.getSheetByName(CRM_CONFIG.sheets.INTERACTIONS);
    const companySheet = this.ss.getSheetByName(CRM_CONFIG.sheets.COMPANIES);
    
    // Find contact
    const contactData = contactSheet.getDataRange().getValues();
    let contact = null;
    
    for (let i = 1; i < contactData.length; i++) {
      if (contactData[i][CRM_CONFIG.columns.CONTACTS.ID] === contactId) {
        const row = contactData[i];
        contact = {
          id: row[CRM_CONFIG.columns.CONTACTS.ID],
          firstName: row[CRM_CONFIG.columns.CONTACTS.FIRST_NAME],
          lastName: row[CRM_CONFIG.columns.CONTACTS.LAST_NAME],
          email: row[CRM_CONFIG.columns.CONTACTS.EMAIL],
          phone: row[CRM_CONFIG.columns.CONTACTS.PHONE],
          companyId: row[CRM_CONFIG.columns.CONTACTS.COMPANY_ID],
          status: row[CRM_CONFIG.columns.CONTACTS.STATUS],
          lastContact: row[CRM_CONFIG.columns.CONTACTS.LAST_CONTACT]
        };
        break;
      }
    }
    
    if (!contact) return null;
    
    // Get interactions
    const interactions = this.getContactInteractions(contactId);
    
    // Get company details
    if (contact.companyId) {
      contact.company = this.getCompanyById(contact.companyId);
    }
    
    return {
      ...contact,
      interactions: interactions,
      interactionCount: interactions.length
    };
  }
  
  // Get all interactions for a contact
  getContactInteractions(contactId) {
    const sheet = this.ss.getSheetByName(CRM_CONFIG.sheets.INTERACTIONS);
    const data = sheet.getDataRange().getValues();
    const interactions = [];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][CRM_CONFIG.columns.INTERACTIONS.CONTACT_ID] === contactId) {
        interactions.push({
          id: data[i][CRM_CONFIG.columns.INTERACTIONS.ID],
          date: data[i][CRM_CONFIG.columns.INTERACTIONS.DATE],
          type: data[i][CRM_CONFIG.columns.INTERACTIONS.TYPE],
          notes: data[i][CRM_CONFIG.columns.INTERACTIONS.NOTES],
          nextAction: data[i][CRM_CONFIG.columns.INTERACTIONS.NEXT_ACTION],
          nextDate: data[i][CRM_CONFIG.columns.INTERACTIONS.NEXT_DATE]
        });
      }
    }
    
    // Sort by date descending
    return interactions.sort((a, b) => b.date - a.date);
  }
  
  // Add interaction and update contact
  addInteraction(contactId, type, notes, nextAction, nextDate) {
    const interactionSheet = this.ss.getSheetByName(CRM_CONFIG.sheets.INTERACTIONS);
    const contactSheet = this.ss.getSheetByName(CRM_CONFIG.sheets.CONTACTS);
    
    // Generate interaction ID
    const interactionId = 'INT' + Date.now();
    
    // Add interaction
    interactionSheet.appendRow([
      interactionId,
      new Date(),
      contactId,
      type,
      notes,
      nextAction || '',
      nextDate || ''
    ]);
    
    // Update contact's last contact date
    const contactData = contactSheet.getDataRange().getValues();
    for (let i = 1; i < contactData.length; i++) {
      if (contactData[i][CRM_CONFIG.columns.CONTACTS.ID] === contactId) {
        contactSheet.getRange(i + 1, CRM_CONFIG.columns.CONTACTS.LAST_CONTACT + 1)
          .setValue(new Date());
        break;
      }
    }
    
    return interactionId;
  }
}
```

## Example 3: Task Management with Dependencies

### Advanced Mapping Pattern

```javascript
class TaskManager {
  constructor() {
    this.ss = SpreadsheetApp.getActiveSpreadsheet();
    this.taskSheet = this.ss.getSheetByName('Tasks');
    this.columnMap = this.getColumnMap();
  }
  
  // Dynamic column mapping
  getColumnMap() {
    const headers = this.taskSheet.getRange(1, 1, 1, this.taskSheet.getLastColumn())
      .getValues()[0];
    const map = {};
    headers.forEach((header, index) => {
      map[header] = index;
    });
    return map;
  }
  
  // Get tasks with dependencies resolved
  getTaskHierarchy(parentId = null) {
    const data = this.taskSheet.getRange(2, 1, 
      this.taskSheet.getLastRow() - 1, 
      this.taskSheet.getLastColumn()
    ).getValues();
    
    const tasks = data.map(row => ({
      id: row[this.columnMap['Task ID']],
      title: row[this.columnMap['Title']],
      parentId: row[this.columnMap['Parent ID']],
      status: row[this.columnMap['Status']],
      assignee: row[this.columnMap['Assignee']],
      dueDate: row[this.columnMap['Due Date']],
      dependencies: (row[this.columnMap['Dependencies']] || '').split(',').filter(d => d),
      children: []
    }));
    
    // Build hierarchy
    const taskMap = {};
    tasks.forEach(task => {
      taskMap[task.id] = task;
    });
    
    const rootTasks = [];
    tasks.forEach(task => {
      if (task.parentId && taskMap[task.parentId]) {
        taskMap[task.parentId].children.push(task);
      } else if (!task.parentId) {
        rootTasks.push(task);
      }
    });
    
    return parentId ? taskMap[parentId]?.children || [] : rootTasks;
  }
  
  // Check if task can be started (dependencies complete)
  canStartTask(taskId) {
    const data = this.taskSheet.getDataRange().getValues();
    let taskRow = null;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][this.columnMap['Task ID']] === taskId) {
        taskRow = data[i];
        break;
      }
    }
    
    if (!taskRow) return false;
    
    const dependencies = (taskRow[this.columnMap['Dependencies']] || '')
      .split(',')
      .filter(d => d.trim());
    
    if (dependencies.length === 0) return true;
    
    // Check if all dependencies are complete
    for (const depId of dependencies) {
      const depTask = data.find(row => 
        row[this.columnMap['Task ID']] === depId.trim()
      );
      
      if (!depTask || depTask[this.columnMap['Status']] !== 'Completed') {
        return false;
      }
    }
    
    return true;
  }
}
```

## Example 4: Form Response Processing

### Automated Data Processing

```javascript
class FormProcessor {
  constructor() {
    this.ss = SpreadsheetApp.getActiveSpreadsheet();
    this.responseSheet = this.ss.getSheetByName('Form Responses');
    this.processedSheet = this.ss.getSheetByName('Processed Data');
    this.setupTrigger();
  }
  
  setupTrigger() {
    // Remove existing triggers
    const triggers = ScriptApp.getProjectTriggers();
    triggers.forEach(trigger => {
      if (trigger.getHandlerFunction() === 'processNewResponses') {
        ScriptApp.deleteTrigger(trigger);
      }
    });
    
    // Create new trigger
    ScriptApp.newTrigger('processNewResponses')
      .forSpreadsheet(this.ss)
      .onFormSubmit()
      .create();
  }
  
  processNewResponses(e) {
    const range = e.range;
    const row = range.getRow();
    const responseData = this.responseSheet.getRange(row, 1, 1, 
      this.responseSheet.getLastColumn()).getValues()[0];
    
    // Process the response
    const processed = this.transformResponse(responseData);
    
    // Add to processed sheet
    this.processedSheet.appendRow(processed);
    
    // Send notification
    this.sendNotification(processed);
  }
  
  transformResponse(responseRow) {
    // Map form fields to processed format
    return [
      'PROC' + Date.now(), // ID
      new Date(), // Process date
      responseRow[1], // Email
      responseRow[2].toUpperCase(), // Name (normalized)
      this.categorizeResponse(responseRow[3]), // Category
      this.calculatePriority(responseRow), // Priority
      'Pending' // Initial status
    ];
  }
  
  categorizeResponse(responseText) {
    const categories = {
      'technical': ['bug', 'error', 'crash', 'broken'],
      'feature': ['add', 'new', 'improve', 'enhance'],
      'support': ['help', 'how', 'question', 'confused']
    };
    
    const lowercaseText = responseText.toLowerCase();
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => lowercaseText.includes(keyword))) {
        return category;
      }
    }
    
    return 'general';
  }
  
  calculatePriority(responseRow) {
    // Custom priority logic
    let priority = 0;
    
    // Check urgency indicators
    if (responseRow[4] === 'Urgent') priority += 3;
    if (responseRow[5] === 'Production Issue') priority += 2;
    
    // Map to priority levels
    if (priority >= 4) return 'High';
    if (priority >= 2) return 'Medium';
    return 'Low';
  }
}
```

## Best Practices Summary

### 1. Error Handling

```javascript
function safeGetValue(sheet, row, column, defaultValue = '') {
  try {
    const value = sheet.getRange(row, column).getValue();
    return value || defaultValue;
  } catch (e) {
    console.error(`Error getting value at ${row},${column}: ${e.message}`);
    return defaultValue;
  }
}
```

### 2. Batch Operations

```javascript
function batchUpdate(updates) {
  const sheet = SpreadsheetApp.getActiveSheet();
  
  // Group updates by row
  const rowUpdates = {};
  updates.forEach(update => {
    if (!rowUpdates[update.row]) {
      rowUpdates[update.row] = [];
    }
    rowUpdates[update.row].push(update);
  });
  
  // Apply updates in batches
  Object.entries(rowUpdates).forEach(([row, updates]) => {
    const values = sheet.getRange(row, 1, 1, sheet.getLastColumn())
      .getValues()[0];
    
    updates.forEach(update => {
      values[update.column - 1] = update.value;
    });
    
    sheet.getRange(row, 1, 1, values.length).setValues([values]);
  });
}
```

### 3. Data Integrity

```javascript
class DataValidator {
  static validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }
  
  static validateRequired(value, fieldName) {
    if (!value || value.toString().trim() === '') {
      throw new Error(`${fieldName} is required`);
    }
    return true;
  }
  
  static validateUnique(sheet, column, value, excludeRow = null) {
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (i === excludeRow - 1) continue;
      if (data[i][column] === value) {
        return false;
      }
    }
    return true;
  }
}
```

## Next Steps

- Implement caching for frequently accessed data
- Add audit trails for data changes
- Create unit tests for your mapping functions
- Consider using Google Apps Script libraries for reusable code
- Explore advanced features like custom formulas and conditional formatting