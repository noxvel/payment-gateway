## Application for exchange payment data


This app is take a role of payment gateway for bank terminal and your billing system.

---

### Info
Configuration for connection to bases and more, must be placed in file connection-config.js, in format of export constants.

Example:

```javascript
// SQL config for taking payment act data
exports.PAYMENT_ACT_SQL_CONFIG = {
  user: 'user',
  password: 'password',
  server: 'localhost',
  database: 'myDatabase',
};
// API for bonuscard information
exports.BONUSCARD_API_PATH = 'http://localhost/Bonuscard_API_Path';

// API for create billing document
exports.BILLING_DOCUMENT_API_PATH = 'http://localhost/BillingDoc_API_Path/';

// Path for SQLite file
exports.SQLITE_FILE_PATH = 'path/to/database.sqlite';

// Path to app log files
exports.LOGS_PATH = '/path/to/logs';

// SQL procedure name for payment act
exports.PAYMENT_ACT_PROCEDURE_NAME = 'ProcedureName';
```