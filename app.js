var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({extended: false});
var jsonParser = bodyParser.json();
var index = require('./routes/index');
// var users = require('./routes/users');
// var login = require('./routes/login');
// var session = require('express-session');
// var JsSIP = require('JsSIP');
var app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(logger('dev'));
app.use(jsonParser);
app.use(urlencodedParser);
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// app.use(session({
//     key: 'sid',
//     secret: 'YouAreSureWhatYouReadingIt?'
// }));

app.all('/', index);

app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

app.use(function(err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error');
});

module.exports = app;