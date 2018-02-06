var express = require('express');
var router = express.Router();

router.get('/', function (req, res){
    res.render('login', {status: 'Попытка...'})
    //, sipIn: req.session.sip, passIn: req.session.password
});

module.exports = router;