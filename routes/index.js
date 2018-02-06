var express = require('express');
var router = express.Router();
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({extended: false});

router.get('/', function(req, res, next) {
        res.render('index', {"header": "kek"})
});

module.exports = router;