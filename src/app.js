
var createError = require('http-errors');
var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const path = require('path');

// const session = require('express-session')
// const lodash = require('lodash')
// const { v4: uuid4 } = require('uuid')
const cors = require('cors')

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


// Solve CORS Error
// app.use((req, res, next) => {
//   res.setHeader('Access-Control-Allow-Origin', '*');
//   res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//   res.setHeader('Access-Control-Allow-Credentials',"true")
//   next();
// });
app.use(cors({origin: [
  "http://localhost:4200","*","65.1.36.205:4200"
], credentials: true}));

// //Middle-ware
// app.use(session(
//   { name:'SessionCookie',
//     genid: function(req) {
//         console.log('session id created');
//       return uuid4();}, // use UUIDs for session IDs
//     secret: 'secret-key',
//     resave: false,
//     saveUninitialized: false,
//     cookie: { secure: false,maxAge:600000,sameSite:'None',httpOnly:false}
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
