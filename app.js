var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({extended: false});
var jsonParser = bodyParser.json();
var index = require('./routes/index');
var fs = require("fs");
var es = require('event-stream');
// var users = require('./routes/users');
// var login = require('./routes/login');
// var session = require('express-session');
// var JsSIP = require('JsSIP');
var app = express();
const exec = require('child_process').exec;

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

function isNumber(n) { return /^-?[\d.]+(?:e-?\d+)?$/.test(n); }

app.all("/api", urlencodedParser, function (request, response) {
    if(!request.body) return response.sendStatus(400);
    var data = request.body.data;
    if (request.body.key === "cock") {
        var check = data.replace("-", "");
        if (isNumber(check)) {
            var found = false;
            var s = fs.createReadStream("/etc/asterisk/extensions.conf")
                .pipe(es.split())
                .pipe(es.mapSync(function (line) {
                        s.pause();
                        console.log(line);
                        if (line.indexOf(data) + 1) {
                            found = true;
                            console.log("+++++++++++++++++");
                            response.send("Already exists\n");
                        }
                        s.resume();
                    })
                        .on('error', function (err) {
                            console.log('Error:', err);
                            response.send("Something went wrong...\n" + err + "\n");
                        })
                        .on('end', function () {
                            if (!found) {
                                var string = "\n\n[" + data + "]" +
                                             "\nswitch => Realtime/" + data + "@extensions\n";
                                fs.appendFile("/etc/asterisk/extensions.conf", string, function (error) {
                                    if (error) {
                                        throw error; // если возникла ошибка
                                    } else {
                                        exec('asterisk -rx "dialplan reload"');
                                        response.send("Done, a new record: " + data + "\n");
                                    }
                                });
                            }
                        })
                );
            console.log(data);
        } else {
            response.send("Invalid input \"" + check + "\" - is not a number!\n");
        }
    } else {
        response.send("Wrong key! \""+ request.body.key +"\"\n");
    }
});

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