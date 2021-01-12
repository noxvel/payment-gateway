const express = require('express');
const bodyParser = require('body-parser');

const ActionHandler = require('./workers/ActionHandler')
const {
  BaseError,
  BadRequestError,
  InternalServerError,
} = require('./errors');

const logger = require('./logger');

const app = express();

app.use(logger.express);

// set the view engine to ejs
app.set('view engine', 'ejs');

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

app.get('/', (req, res)  => {
  //res.sendStatus(400);
	res.send('Connection is working fine');
});

// about page 
app.get('/paymentsDataToWatch', asyncMiddleware(async (req, res, next) => {
  let page = req.query.page || 1;
  let limit = req.query.limit || 20;
  let offset = (page - 1) * limit || 0;

  const DataBase = require('./workers/Database.js');
  const db = new DataBase('findAll');
  await db.connect();   
  await db.definePayment();
  let data = await db.findAll(limit, offset);
  await db.disconnect()
  res.render('paymentsData', {data: data, limit: parseInt(limit), page: parseInt(page)});
}));

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
      res.type('json').status(err.httpCode).send(err.createResponse('json'));
    } else if (req.is('text/xml')) {
      res.type('text/xml').status(err.httpCode).send(err.createResponse('xml'));
    } else {
      res.type('json').status(err.httpCode).send(err.createResponse('json'));
    }
  } else {
    const newErr = new InternalServerError("", err.message);
    res.type('json').status(newErr.httpCode).send(newErr.createResponse('json'));
  }

  // res.status(500).json({
  //   message: 'an error occurred',
  //   err: err.message
  // })

})

app.listen(4321, 'localhost');
