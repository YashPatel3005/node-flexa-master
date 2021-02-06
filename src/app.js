
var createError = require('http-errors');
var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const path = require('path');

// const session = require('express-session')
// const lodash = require('lodash')
// const { v4: uuid4 } = require('uuid')

//set Environment variable using dotenv package 
const envPath = path.resolve(process.cwd(), '.env.'+ process.env.NODE_ENV)
require('dotenv').config({path: envPath.replace(' ','')})


const ApiRoutes = require('./v1/routes')

const swaggerUi = require('swagger-ui-express');
const swaggerDocs = require('./middleware/swagger')

const database = require('./config/database')

//Adding API prefix
express.application.prefix = express.Router.prefix = function(path,configure){
  var router = express.Router();
    this.use(path, router);
    configure(router);
    return router;
}

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// //Middle-ware
// app.use(session(
//   { name:'SessionCookie',
//     genid: function(req) {
//         console.log('session id created');
//       return uuid4();}, // use UUIDs for session IDs
//     secret: 'secret-key',
//     resave: false,
//     saveUninitialized: false,
//     cookie: { secure: false}
//   }));

app.prefix('/v1',function(app){
  app.use('/api',ApiRoutes)
})

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs))


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

// var dummy = [
//   {
//     userId: 'US_40816709-f54f-4d34-9f2d-07f4c4214087',
//     email: 'vinrap@gmail.com',
//     nodeId: null,
//     status: null
//   },
//   {
//     userId: 'US_40816709-f54f-4d34-9f2d-07f4c4214087',
//     email: 'vinrap@gmail.com',
//     nodeId: 'ND_ae46200e-5ff1-4fa9-9ebe-4f440feb49bd',
//     status: 1
//   },
//   {
//     userId: 'US_40816709-f54f-4d34-9f2d-07f4c4214087',
//     email: 'vinrap@gmail.com',
//     nodeId: 'ND_b4815e67-284c-428f-b70c-1501da43882e',
//     status: 1
//   },
//   {
//     userId: 'US_40816709-f54f-4d34-9f2d-07f4c4214087',
//     email: 'vinrap@gmail.com',
//     nodeId: 'ND_4498aacb-671a-4605-be7c-4287876b38e6',
//     status: 0
//   },
//   {
//     userId: 'US_40816709-f54f-4d34-9f2d-07f4c4214087',
//     email: 'vinrap@gmail.com',
//     nodeId: 'ND_9cf33c26-493c-4a64-9d71-5a5ab4d79626',
//     status: 1
//   },
//   {
//     userId: 'US_40816709-f54f-4d34-9f2d-07f4c4214087',
//     email: 'vinrap@gmail.com',
//     nodeId: null,
//     status: null
//   },
//   {
//     userId: 'US_40816709-f54f-4d34-9f2d-07f4c4214087',
//     email: 'vinrap@gmail.com',
//     nodeId: null,
//     status: null
//   },
//   {
//     userId: 'US_40816709-f54f-4d34-9f2d-07f4c4214087',
//     email: 'vinrap@gmail.com',
//     nodeId: 'ND_3148be7c-aa0a-4035-94d3-0454c14a5fc5',
//     status: 1
//   },
//   {
//     userId: 'US_40816709-f54f-4d34-9f2d-07f4c4214087',
//     email: 'vinrap@gmail.com',
//     nodeId: 'ND_b75c4b9c-91f3-43b3-b405-78b703606473',
//     status: 0
//   }
// ];


// var dum = dummy.map((d)=>  ({nodeId:d.nodeId, status: d.status}));
// var usr = {
//   'userId':dummy[0].userId,
//   'nodes':dum
// }

// console.log(JSON.stringify({usr}));