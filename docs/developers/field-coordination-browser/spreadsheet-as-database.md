---
layout: default
title: Spreadsheet as Database - Field Coordination Browser
---

# Using Google Sheets as a Database

Google Sheets can serve as an effective lightweight database for Apps Script applications. This guide shows how to implement database-like functionality using spreadsheets.

## Database Design Principles

### 1. **Sheet as Table**

Each sheet represents a table in your database:

```javascript
const DATABASE_SCHEMA = {
  // Main data table
  items: {
    sheet: 'Items',
    columns: {
      id: 0,
      name: 1,
      description: 2,
      status: 3,
      assignedTo: 4,
      createdAt: 5,
      updatedAt: 6
    },
    primaryKey: 'id'
  },
  
  // Users table
  users: {
    sheet: 'Users',
    columns: {
      email: 0,
      name: 1,
      role: 2,
      active: 3,
      lastLogin: 4
    },
    primaryKey: 'email'
  },
  
  // Audit log table
  auditLog: {
    sheet: 'AuditLog',
    columns: {
      timestamp: 0,
      user: 1,
      action: 2,
      details: 3
    }
  }
};
```

### 2. **Data Types and Validation**

Implement data type validation:

```javascript
class DataValidator {
  static validate(value, type, constraints = {}) {
    switch (type) {
      case 'string':
        return this.validateString(value, constraints);
      case 'number':
        return this.validateNumber(value, constraints);
      case 'date':
        return this.validateDate(value, constraints);
      case 'email':
        return this.validateEmail(value);
      case 'boolean':
        return this.validateBoolean(value);
      default:
        throw new Error(`Unknown type: ${type}`);
    }
  }
  
  static validateString(value, { minLength, maxLength, pattern } = {}) {
    if (typeof value !== 'string') {
      throw new Error('Value must be a string');
    }
    
    if (minLength && value.length < minLength) {
      throw new Error(`String must be at least ${minLength} characters`);
    }
    
    if (maxLength && value.length > maxLength) {
      throw new Error(`String must be at most ${maxLength} characters`);
    }
    
    if (pattern && !pattern.test(value)) {
      throw new Error('String does not match required pattern');
    }
    
    return value;
  }
  
  static validateNumber(value, { min, max, integer } = {}) {
    const num = Number(value);
    
    if (isNaN(num)) {
      throw new Error('Value must be a number');
    }
    
    if (integer && !Number.isInteger(num)) {
      throw new Error('Value must be an integer');
    }
    
    if (min !== undefined && num < min) {
      throw new Error(`Number must be at least ${min}`);
    }
    
    if (max !== undefined && num > max) {
      throw new Error(`Number must be at most ${max}`);
    }
    
    return num;
  }
  
  static validateDate(value) {
    const date = new Date(value);
    
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }
    
    return date;
  }
  
  static validateEmail(value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!emailRegex.test(value)) {
      throw new Error('Invalid email address');
    }
    
    return value.toLowerCase();
  }
  
  static validateBoolean(value) {
    if (typeof value === 'boolean') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    
    throw new Error('Value must be boolean');
  }
}
```

## CRUD Operations

### 1. **Create (Insert)**

```javascript
class SheetDatabase {
  constructor(spreadsheetId) {
    this.spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  }
  
  insert(tableName, data) {
    const table = DATABASE_SCHEMA[tableName];
    if (!table) {
      throw new Error(`Table ${tableName} not found`);
    }
    
    const sheet = this.spreadsheet.getSheetByName(table.sheet);
    const lock = LockService.getScriptLock();
    
    try {
      lock.waitLock(10000);
      
      // Generate ID if needed
      if (table.primaryKey === 'id' && !data.id) {
        data.id = Utilities.getUuid();
      }
      
      // Add timestamps
      const now = new Date();
      data.createdAt = data.createdAt || now;
      data.updatedAt = now;
      
      // Convert to row array
      const row = this.objectToRow(data, table.columns);
      
      // Append to sheet
      sheet.appendRow(row);
      
      // Log the action
      this.logAction('INSERT', tableName, data);
      
      return data;
      
    } finally {
      lock.releaseLock();
    }
  }
  
  objectToRow(obj, columns) {
    const row = new Array(Object.keys(columns).length);
    
    for (const [field, index] of Object.entries(columns)) {
      row[index] = obj[field] || '';
    }
    
    return row;
  }
  
  logAction(action, table, data) {
    const logSheet = this.spreadsheet.getSheetByName('AuditLog');
    logSheet.appendRow([
      new Date(),
      Session.getActiveUser().getEmail(),
      `${action} ${table}`,
      JSON.stringify(data)
    ]);
  }
}
```

### 2. **Read (Select)**

```javascript
class SheetDatabase {
  // ... previous code ...
  
  find(tableName, criteria = {}) {
    const table = DATABASE_SCHEMA[tableName];
    const sheet = this.spreadsheet.getSheetByName(table.sheet);
    
    // Get all data
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return []; // No data besides header
    
    const headers = data[0];
    const results = [];
    
    // Search through rows
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      const record = this.rowToObject(row, table.columns);
      
      if (this.matchesCriteria(record, criteria)) {
        results.push(record);
      }
    }
    
    return results;
  }
  
  findOne(tableName, criteria = {}) {
    const results = this.find(tableName, criteria);
    return results[0] || null;
  }
  
  findById(tableName, id) {
    const table = DATABASE_SCHEMA[tableName];
    
    if (!table.primaryKey) {
      throw new Error(`Table ${tableName} has no primary key`);
    }
    
    return this.findOne(tableName, { [table.primaryKey]: id });
  }
  
  rowToObject(row, columns) {
    const obj = {};
    
    for (const [field, index] of Object.entries(columns)) {
      obj[field] = row[index];
    }
    
    return obj;
  }
  
  matchesCriteria(record, criteria) {
    for (const [field, value] of Object.entries(criteria)) {
      if (value instanceof RegExp) {
        if (!value.test(record[field])) return false;
      } else if (typeof value === 'object' && value !== null) {
        // Handle complex queries
        if (!this.matchComplexCriteria(record[field], value)) {
          return false;
        }
      } else {
        if (record[field] !== value) return false;
      }
    }
    
    return true;
  }
  
  matchComplexCriteria(fieldValue, criteria) {
    // Support MongoDB-style operators
    for (const [operator, value] of Object.entries(criteria)) {
      switch (operator) {
        case '$gt':
          if (!(fieldValue > value)) return false;
          break;
        case '$gte':
          if (!(fieldValue >= value)) return false;
          break;
        case '$lt':
          if (!(fieldValue < value)) return false;
          break;
        case '$lte':
          if (!(fieldValue <= value)) return false;
          break;
        case '$ne':
          if (fieldValue === value) return false;
          break;
        case '$in':
          if (!value.includes(fieldValue)) return false;
          break;
        case '$regex':
          if (!new RegExp(value).test(fieldValue)) return false;
          break;
        default:
          throw new Error(`Unknown operator: ${operator}`);
      }
    }
    
    return true;
  }
}
```

### 3. **Update**

```javascript
class SheetDatabase {
  // ... previous code ...
  
  update(tableName, criteria, updates) {
    const table = DATABASE_SCHEMA[tableName];
    const sheet = this.spreadsheet.getSheetByName(table.sheet);
    const lock = LockService.getScriptLock();
    
    try {
      lock.waitLock(10000);
      
      const data = sheet.getDataRange().getValues();
      const updatedRows = [];
      
      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const record = this.rowToObject(row, table.columns);
        
        if (this.matchesCriteria(record, criteria)) {
          // Apply updates
          Object.assign(record, updates);
          record.updatedAt = new Date();
          
          // Convert back to row
          const updatedRow = this.objectToRow(record, table.columns);
          
          // Update sheet
          sheet.getRange(i + 1, 1, 1, updatedRow.length)
            .setValues([updatedRow]);
          
          updatedRows.push(record);
        }
      }
      
      // Log the action
      this.logAction('UPDATE', tableName, {
        criteria: criteria,
        updates: updates,
        affected: updatedRows.length
      });
      
      return updatedRows;
      
    } finally {
      lock.releaseLock();
    }
  }
  
  updateById(tableName, id, updates) {
    const table = DATABASE_SCHEMA[tableName];
    
    if (!table.primaryKey) {
      throw new Error(`Table ${tableName} has no primary key`);
    }
    
    const results = this.update(
      tableName, 
      { [table.primaryKey]: id }, 
      updates
    );
    
    return results[0] || null;
  }
}
```

### 4. **Delete**

```javascript
class SheetDatabase {
  // ... previous code ...
  
  delete(tableName, criteria) {
    const table = DATABASE_SCHEMA[tableName];
    const sheet = this.spreadsheet.getSheetByName(table.sheet);
    const lock = LockService.getScriptLock();
    
    try {
      lock.waitLock(10000);
      
      const data = sheet.getDataRange().getValues();
      const rowsToDelete = [];
      
      // Find rows to delete (in reverse order)
      for (let i = data.length - 1; i >= 1; i--) {
        const row = data[i];
        const record = this.rowToObject(row, table.columns);
        
        if (this.matchesCriteria(record, criteria)) {
          rowsToDelete.push({
            index: i + 1,
            record: record
          });
        }
      }
      
      // Delete rows
      rowsToDelete.forEach(({ index }) => {
        sheet.deleteRow(index);
      });
      
      // Log the action
      this.logAction('DELETE', tableName, {
        criteria: criteria,
        deleted: rowsToDelete.map(r => r.record)
      });
      
      return rowsToDelete.length;
      
    } finally {
      lock.releaseLock();
    }
  }
  
  deleteById(tableName, id) {
    const table = DATABASE_SCHEMA[tableName];
    
    if (!table.primaryKey) {
      throw new Error(`Table ${tableName} has no primary key`);
    }
    
    return this.delete(tableName, { [table.primaryKey]: id });
  }
}
```

## Advanced Features

### 1. **Indexing**

Create indexes for faster lookups:

```javascript
class IndexManager {
  constructor(database) {
    this.database = database;
    this.indexes = {};
  }
  
  createIndex(tableName, fieldName) {
    const cacheKey = `${tableName}_${fieldName}`;
    
    if (this.indexes[cacheKey]) {
      return; // Index already exists
    }
    
    const data = this.database.find(tableName);
    const index = new Map();
    
    data.forEach(record => {
      const value = record[fieldName];
      
      if (!index.has(value)) {
        index.set(value, []);
      }
      
      index.get(value).push(record);
    });
    
    this.indexes[cacheKey] = {
      field: fieldName,
      data: index,
      createdAt: new Date()
    };
  }
  
  findByIndex(tableName, fieldName, value) {
    const cacheKey = `${tableName}_${fieldName}`;
    const index = this.indexes[cacheKey];
    
    if (!index) {
      // No index, fall back to regular search
      return this.database.find(tableName, { [fieldName]: value });
    }
    
    return index.data.get(value) || [];
  }
  
  refreshIndex(tableName, fieldName) {
    const cacheKey = `${tableName}_${fieldName}`;
    delete this.indexes[cacheKey];
    this.createIndex(tableName, fieldName);
  }
}
```

### 2. **Transactions**

Implement transaction-like behavior:

```javascript
class Transaction {
  constructor(database) {
    this.database = database;
    this.operations = [];
    this.lock = null;
  }
  
  begin() {
    this.lock = LockService.getScriptLock();
    this.lock.waitLock(30000); // 30 second timeout
    this.operations = [];
  }
  
  insert(tableName, data) {
    this.operations.push({
      type: 'INSERT',
      table: tableName,
      data: data
    });
  }
  
  update(tableName, criteria, updates) {
    this.operations.push({
      type: 'UPDATE',
      table: tableName,
      criteria: criteria,
      updates: updates
    });
  }
  
  delete(tableName, criteria) {
    this.operations.push({
      type: 'DELETE',
      table: tableName,
      criteria: criteria
    });
  }
  
  commit() {
    try {
      const results = [];
      
      for (const operation of this.operations) {
        switch (operation.type) {
          case 'INSERT':
            results.push(this.database.insert(
              operation.table, 
              operation.data
            ));
            break;
            
          case 'UPDATE':
            results.push(this.database.update(
              operation.table,
              operation.criteria,
              operation.updates
            ));
            break;
            
          case 'DELETE':
            results.push(this.database.delete(
              operation.table,
              operation.criteria
            ));
            break;
        }
      }
      
      return results;
      
    } catch (error) {
      // In a real database, we would rollback here
      // With sheets, we log the error and may need manual cleanup
      console.error('Transaction failed:', error);
      throw error;
      
    } finally {
      if (this.lock) {
        this.lock.releaseLock();
      }
    }
  }
  
  rollback() {
    this.operations = [];
    if (this.lock) {
      this.lock.releaseLock();
    }
  }
}
```

### 3. **Query Builder**

Create a fluent query interface:

```javascript
class QueryBuilder {
  constructor(database, tableName) {
    this.database = database;
    this.tableName = tableName;
    this.criteria = {};
    this.sortField = null;
    this.sortOrder = 'asc';
    this.limitValue = null;
    this.offsetValue = 0;
  }
  
  where(field, value) {
    this.criteria[field] = value;
    return this;
  }
  
  whereGreaterThan(field, value) {
    this.criteria[field] = { $gt: value };
    return this;
  }
  
  whereLessThan(field, value) {
    this.criteria[field] = { $lt: value };
    return this;
  }
  
  whereIn(field, values) {
    this.criteria[field] = { $in: values };
    return this;
  }
  
  whereRegex(field, pattern) {
    this.criteria[field] = { $regex: pattern };
    return this;
  }
  
  orderBy(field, order = 'asc') {
    this.sortField = field;
    this.sortOrder = order;
    return this;
  }
  
  limit(value) {
    this.limitValue = value;
    return this;
  }
  
  offset(value) {
    this.offsetValue = value;
    return this;
  }
  
  execute() {
    let results = this.database.find(this.tableName, this.criteria);
    
    // Apply sorting
    if (this.sortField) {
      results.sort((a, b) => {
        const aVal = a[this.sortField];
        const bVal = b[this.sortField];
        
        if (this.sortOrder === 'asc') {
          return aVal > bVal ? 1 : -1;
        } else {
          return aVal < bVal ? 1 : -1;
        }
      });
    }
    
    // Apply offset and limit
    if (this.offsetValue > 0 || this.limitValue !== null) {
      const start = this.offsetValue;
      const end = this.limitValue ? start + this.limitValue : undefined;
      results = results.slice(start, end);
    }
    
    return results;
  }
  
  count() {
    const results = this.database.find(this.tableName, this.criteria);
    return results.length;
  }
  
  first() {
    this.limit(1);
    const results = this.execute();
    return results[0] || null;
  }
}

// Usage example
const db = new SheetDatabase('spreadsheet-id');
const query = new QueryBuilder(db, 'items');

const activeItems = query
  .where('status', 'active')
  .whereGreaterThan('priority', 5)
  .orderBy('createdAt', 'desc')
  .limit(10)
  .execute();
```

## Performance Best Practices

### 1. **Batch Reading**

```javascript
function batchRead(ranges) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const batchData = spreadsheet.getRangeList(ranges).getRanges()
    .map(range => ({
      range: range.getA1Notation(),
      values: range.getValues()
    }));
  
  return batchData;
}
```

### 2. **Batch Writing**

```javascript
function batchWrite(updates) {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  
  updates.forEach(({ sheetName, range, values }) => {
    const sheet = spreadsheet.getSheetByName(sheetName);
    sheet.getRange(range).setValues(values);
  });
}
```

### 3. **Connection Pooling**

```javascript
class SpreadsheetPool {
  constructor(maxConnections = 5) {
    this.connections = [];
    this.maxConnections = maxConnections;
  }
  
  getConnection(spreadsheetId) {
    // Check if we already have this connection
    let connection = this.connections.find(
      c => c.id === spreadsheetId
    );
    
    if (!connection) {
      // Create new connection
      if (this.connections.length >= this.maxConnections) {
        // Remove least recently used
        this.connections.shift();
      }
      
      connection = {
        id: spreadsheetId,
        spreadsheet: SpreadsheetApp.openById(spreadsheetId),
        lastUsed: new Date()
      };
      
      this.connections.push(connection);
    }
    
    connection.lastUsed = new Date();
    return connection.spreadsheet;
  }
}
```

## Next Steps

- Explore [Web Deployment](/appsscript/developers/field-coordination-browser/web-deployment) strategies
- Learn about [Class Structures](/appsscript/developers/fieldplan-analyzer/class-structure) in the analyzer
- Master [Spreadsheet Mapping](/appsscript/developers/spreadsheet-mapping/configuration) techniques