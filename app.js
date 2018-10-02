const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const {
  LOGS_PATH
} = require('./connection-config');
const ActionHandler = require('./workers/ActionHandler')
const {
  BaseError,
  BadRequestError
} = require('./errors');

const logger = require('./logger');

const app = express();

app.use(logger.express);

// create application/json parser
// const jsonParser = bodyParser.json();
// parse an HTML body into a string
const xmlParser = bodyParser.text({
  type: ['text/html', 'text/xml']
});

// //CORS Middleware
// app.use(function (req, res, next) {
//   //Enabling CORS 
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT");
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, contentType,Content-Type, Accept, Authorization");
//   next();
// });

const asyncMiddleware = fn =>
  (req, res, next) => {
    Promise.resolve(fn(req, res, next))
      .catch(next);
  };

app.get('/', function (req, res) {
  res.sendStatus(400);
});

app.post('/privat', xmlParser, asyncMiddleware(async (req, res, next) => {
  let handler = new ActionHandler();

  if (!req.body) {
    throw new BadRequestError();
  }

  handler.parseRequest(req.body);

  handler.createAction();

  handler.getRequestValues();

  await handler.resolveAction();

  handler.createResponse();

  res.send(handler.xml);

}));

app.use(function (err, req, res, next) {
  // console.error(err)
  logger.error.error(err.message);

  if (err instanceof BaseError) {
    res.send(err.createResponse());
  } else {
    res.status(500).json({
      message: err.message
    });
  }

  // res.status(500).json({
  //   message: 'an error occurred',
  //   err: err.message
  // })

})

app.listen(4321, 'localhost');