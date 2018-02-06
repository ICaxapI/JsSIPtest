//JsSIP.debug.enable('JsSIP:*');

var ua;
var call;
var local_stream;
var remote_stream;
var myMultimedia;
var theirMultimedia;
var eventHandlersCall = {


    'progress': function (data) {
        //if (data.originator === 'remote') data.response.body = null;
        $('statusCall').innerHTML = 'Попытка звонка...';
    },

    'failed': function (e) {
        // if (e.hasOwnProperty(value)) {
        //     $('statusCall').innerHTML = 'Звонок не удался в связи с' + e.data.value;
        // } else {
            $('statusCall').innerHTML = 'Звонок не удался в связи с ' + e.cause;
        // }
        console.log('Не удался звонок');
    },

    'ended': function (e) {
        // if (e.hasOwnProperty(value)) {
        //     $('statusCall').innerHTML = 'Звонок закончился в связи с' + e.data.value;
        // } else {
            $('statusCall').innerHTML = 'Звонок закончился в связи с ' + e.cause;
        // }
    },

    'confirmed': function (e) {
        local_stream = ua.connection.getLocalStreams()[0];
        console.log(local_stream); //If i print this variable I do get a media stream
        myMultimedia = JsSIP.rtcninja.attachMediaStream(myMultimedia, local_stream);
    },
    'addstream': function (e) {
        remote_stream = e.stream;
        console.log(remote_stream); //If i print this variable I do get a media stream
        theirMultimedia = JsSIP.rtcninja.attachMediaStream(theirMultimedia, remote_stream);
    }
};
var optionsCall = {
    'eventHandlers': eventHandlersCall,
    'mediaConstraints': {'audio': true, 'video': false},
    'pcConfig': {
        'iceServers': [
            { 'urls': ['stun:stun.l.google.com:19302'] }
        ]
    }
};
function auth(uri, pass, server) {
    try {
        var socket = new JsSIP.WebSocketInterface(server); //ws://212.224.113.123:8088/ws
    } catch(e) {
        if (e.name !== "SecurityError") {
            throw e;
        }
    }

    var configuration = {
        sockets: [socket],
        uri: uri, //sip:alextest@212.224.113.123
        password: pass, //3B2687A8eb43748C
        realm   : '159.89.100.53',
        //transport: 'wss',
        no_answer_timeout: 120,
        session_timers: false,
        session_timers_refresh_method: 'invite'
    };

    try {
        ua = new JsSIP.UA(configuration);
    } catch(e) {
        if (e.name !== "SecurityError") {
            throw e;
        }
    }

    ua.on('connected', function (e) {
        console.log('Подключенно');
    });

    ua.on('registered', function (e) {
        console.log('Зарегистрирован');
        authForm.success();
    });

    ua.on('unregistered', function (e) {
        console.log('Разрегистрирован');
        unregisterIvent();
    });

    ua.on('registrationFailed', function (e) {
        console.log('Регистрация не удалась');
        authForm.error();
    });

    ua.start();
}

function call(sip) {
    ua.call(sip, optionsCall); //'sip:79043402122@212.224.113.123'
}

function $(id) {
    return document.getElementById(id);
}
function Form(id) {
    this.form = $(id);
}

Form.prototype = {
    init: function(submit, success, error) {
        this.submit = submit;
        this.success = success;
        this.error = error;
        this.enabled = true; // включена

        // по событию формы onsubmit
        var _this = this, listener = function() {
            _this.process();
            var ev = arguments[0] || window.event;
            ev.returnValue = false;
        };

        if(this.form.addEventListener)
            this.form.addEventListener('submit', listener, false);
        // для IE
        //@cc_on this.form.attachEvent('onsubmit', listener);
    },

    process: function() {
        if(this.enabled) {
            this.enabled = false;
            this.submit();
        }
    },

    message: function(text) {
        alert(text);
    }
};

var authForm = new Form('auth');

function submit() {
    authForm.enabled = false;
    auth($('inputSIP').value, $('inputPassword').value, $('inputServer').value)
}

//auth("sip:7812@159.89.100.53", "cock", "ws://159.89.100.53:8088/ws");

authForm.init(
    //submit
    function() {
        $('inputSIP').value && $('inputServer').value ? submit() : this.error();
        if( $('remembermeAuth').checked){
            localStorage.setItem('sip', $('inputSIP').value);
            localStorage.setItem('pass', $('inputPassword').value);
            localStorage.setItem('server', $('inputServer').value);
            localStorage.setItem('auto', $('autoAuth').checked);
        } else {
            localStorage.setItem('sip', ' ');
            localStorage.setItem('pass', ' ');
            localStorage.setItem('server', ' ');
            localStorage.setItem('auto', false);
        }
    },

    // success
    function() {
        authForm.enabled = false;
        $('successAuth').style.display = "block";
        $('auth').style.display = "none";
    },

    // error
    function() {
        $('statusAuth').innerHTML = 'Неправильный SIP или пароль.';
        this.enabled = true;
        //this.message('Регистрация не удалась');
    }
);

if((localStorage.getItem('sip') !== ' ')){
    $('inputSIP').value = localStorage.getItem("sip");
    $('inputPassword').value = localStorage.getItem("pass");
    $('inputServer').value = localStorage.getItem("server");
    $('remembermeAuth').checked = true;
    if(localStorage.getItem("auto") === 'true'){
        $('autoAuth').checked = true;
        auth(localStorage.getItem("sip"), localStorage.getItem("pass"), localStorage.getItem("server"))
    }
}

function logout() {
    ua.unregister();
}
function unregisterIvent() {
    authForm.enabled = true;
    $('successAuth').style.display = "none";
    $('auth').style.display = "block";
}