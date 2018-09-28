const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const ActionHandler = require('./ActionHandler.js')
const {
  BaseError,
  BadRequestError
} = require('./errors');

const app = express();
app.use(morgan('combined'));

// create application/json parser
const jsonParser = bodyParser.json();
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

app.post('/privat', xmlParser, asyncMiddleware( async (req, res, next) => {
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
  console.error(err)

  if (err instanceof BaseError){
    res.send(err.createResponse());
  }else{
    res.status(500).json({message: err.message});
  } 

  // res.status(500).json({
  //   message: 'an error occurred',
  //   err: err.message
  // })
  
})

app.listen(3000, function () {
  console.log('app is running, and it is very good!');
})