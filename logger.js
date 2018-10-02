const fs = require('fs');
const path = require('path');
const log4js = require('log4js');

const { LOGS_PATH } = require('./connection-config');

const logDir = path.join(LOGS_PATH, 'payment-gateway-logs');
// ensure log directory exists
fs.existsSync(logDir) || fs.mkdirSync(logDir);


log4js.configure({
  appenders: {
    console: { type: 'console' },
    fileAccess: { type: 'file', filename: path.join(logDir, 'access.log'), maxLogSize: 10485760 },
    fileError: { type: 'file', filename: path.join(logDir, 'error.log'), maxLogSize: 10485760 },
  },
  categories: {
    access: { appenders: ['fileAccess'], level: 'all' },
    error: { appenders: ['fileError'], level: 'error' },
    default: { appenders: ['console'], level: 'info' }
  }
 });


module.exports = { 
  access: log4js.getLogger('access'),
  error: log4js.getLogger('error'),
  express: log4js.connectLogger(log4js.getLogger('access'), {level: log4js.levels.INFO}),
};