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
    filePaymentRequests: { type: 'file', filename: path.join(logDir, 'paymentRequests.log'), maxLogSize: 10485760 },
    fileSelfpaymentRequests: { type: 'file', filename: path.join(logDir, 'selfpaymentRequests.log'), maxLogSize: 10485760 },
  },
  categories: {
    access: { appenders: ['fileAccess'], level: 'all' },
    error: { appenders: ['fileError'], level: 'error' },
    paymentRequests: { appenders: ['filePaymentRequests'], level: 'info' },
    selfpaymentRequests: { appenders: ['fileSelfpaymentRequests'], level: 'info' },
    default: { appenders: ['console'], level: 'info' }
  }
 });


module.exports = { 
  access: log4js.getLogger('access'),
  error: log4js.getLogger('error'),
  paymentRequests: log4js.getLogger('paymentRequests'),
  selfpaymentRequests: log4js.getLogger('selfpaymentRequests'),
  express: log4js.connectLogger(log4js.getLogger('access'), {level: log4js.levels.INFO}),
};