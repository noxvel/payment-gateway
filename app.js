const express = require('express');
const bodyParser = require('body-parser');

const ActionHandler = require('./workers/ActionHandler')
const {
  BaseError,
  BadRequestError
} = require('./errors');

const logger = require('./logger');

const app = express();

app.use(logger.express);

// create application/json parser
const jsonParser = bodyParser.json();
// parse an HTML body into a string
const xmlParser = bodyParser.text({
  type: ['text/html', 'text/xml']
});

app.use(jsonParser)
app.use(xmlParser)
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
  //res.sendStatus(400);
	res.send('Connection is working fine');
});


app.post('/privat', asyncMiddleware(async (req, res, next) => {

  let handler;

  if (req.is('json')) {
    handler = new ActionHandler('json');
    res.type('json');
  } else if (req.is('text/xml')) {
    handler = new ActionHandler('xml');
    res.type('text/xml');
  } else {
    throw new BadRequestError();
  }

  if (!req.body) {
    throw new BadRequestError();
  }

  handler.parseRequest(req.body);

  handler.createAction();

  handler.getRequestValues();

  await handler.resolveAction();

  handler.createResponse();

  res.send(handler.resBody);

}));

app.use(function (err, req, res, next) {
  // console.error(err)
  logger.error.error(err.message);

  if (err instanceof BaseError) {
    if (req.is('json')) {
      res.type('json');
      res.send(err.createResponse('json'));
    } else if (req.is('text/xml')) {
      res.type('text/xml');
      res.send(err.createResponse('xml'));
    } else {
      res.status(500).json({
        message: "Wrong Content-Type header in request, use JSON or XML type to see error message"
      });
    }
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
