var ua;
var call;
var remoteAudio = f('myMultimedia');
var session;
var myMultimedia;
var remote_stream;
var nowCall = false;
var callSession;

var eventHandlersCall = {
    'progress': function (e) { //когда звонок в процессе
        f('call').innerHTML = 'Завершить';
        info("Дозвон...", "", 10000);
        nowCall = true;
    },

    'failed': function (e) { //при ошибке в попытке звонка
        warning("Звонок не удался", e.cause, 60000);
        f('call').innerHTML = 'Позвонить';
        nowCall = false;
    },

    'ended': function (e) { //при завершении звонка
        info("Звонок завершён", e.cause, 10000);
        f('call').innerHTML = 'Позвонить';
        nowCall = false;
    },

    'confirmed': function (e) { //когда наш вызов приняли
        remote_stream = session.connection.getRemoteStreams()[0];
        remoteAudio.srcObject = remote_stream;
        remoteAudio.play();
    },

    'addstream': function (e) { //при взятии трубки
        console.log('addstream');
        remoteAudio.srcObject = event.stream;
        remoteAudio.play();
    },

    'refer': function (e) { //когда входящий звонок только пришёл
        //session.reject(); //положить трубку
        console.log('refer');
        callSession = e.session;
        var numberRegexp = /\"(\d+)\"/;
        var fromNumber = (numberRegexp.exec(e.request.headers.From[0].raw))[1];
        var toNumber = (numberRegexp.exec(e.request.headers.Contact[0].raw))[1].slice(1);
        incomingCall(fromNumber, toNumber);
    }
};

var optionsCall = {
    'eventHandlers': eventHandlersCall,
    'mediaConstraints': {'audio': true, 'video': false},
    media: {
        remote: {
            audio: document.getElementById('myMultimedia')
        }
    }
};

function auth(uri, pass, server) {
    try {
        var socket = new JsSIP.WebSocketInterface(server);
    } catch(e) {
        if (e.name !== "SecurityError") {
            error("Ошибка браузера", "Ошибка безопасности", 20000);
            throw e;
        }
    }

    var hashArgs = server.split(":");  //ws://realm:xxxx/ws -> [{wss}{//realm}{xxxx/ws}]
    hashArgs = hashArgs[1].split("/"); // //realm -> [{}{}{realm}]

    var configuration = {
        sockets: [socket],
        uri: uri,
        password: pass,
        realm   : hashArgs[2],
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
        info("Подключенно", "Подключен к серверу", 1000);
    });

    ua.on('registered', function (e) {
        authForm.success();
    });

    ua.on('unregistered', function (e) {
        unregisterIvent();
        toastr.remove()
        info("Разрегистрирован", "Успешный выход", 1000);
    });

    ua.on('registrationFailed', function (e) {
        authForm.error();
    });

    ua.start();
}

function call(sip) {
    if (!nowCall) {
        session = ua.call(sip, optionsCall);
    } else {
        ua.terminateSessions();
    }
}

function answerCall() {
    callSession.answer(optionsCall);
}

function f(id) {
    return document.getElementById(id);
}
function Form(id) {
    this.form = f(id);
}

Form.prototype = {
    init: function(submit, success, error) {
        this.submit = submit;
        this.success = success;
        this.error = error;
        this.enabled = true; // включена

        var _this = this, listener = function() {
            _this.process();
            var ev = arguments[0] || window.event;
            ev.returnValue = false;
        };

        if(this.form.addEventListener)
            this.form.addEventListener('submit', listener, false);
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
    auth(f('inputSIP').value, f('inputPassword').value, f('inputServer').value)
}

authForm.init(
    //submit
    function() {
        f('inputSIP').value && f('inputServer').value ? submit() : this.error();
        if( f('remembermeAuth').checked){
            localStorage.setItem('sip', f('inputSIP').value);
            localStorage.setItem('pass', f('inputPassword').value);
            localStorage.setItem('server', f('inputServer').value);
            localStorage.setItem('auto', f('autoAuth').checked);
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
        f('successAuth').style.display = "block";
        f('auth').style.display = "none";
        info("Аутентификация", "Успешно!", 1000);
    },

    // error
    function() {
        error("Ошибка аутентификации", "Неправильный SIP или Пароль", 0);
        this.enabled = true;
    }
);

if((localStorage.getItem('sip') !== ' ')){
    f('inputSIP').value = localStorage.getItem("sip");
    f('inputPassword').value = localStorage.getItem("pass");
    f('inputServer').value = localStorage.getItem("server");
    f('remembermeAuth').checked = true;
    if(localStorage.getItem("auto") === 'true'){
        f('autoAuth').checked = true;
        auth(localStorage.getItem("sip"), localStorage.getItem("pass"), localStorage.getItem("server"))
    }
}

function logout() {
    ua.unregister();
}
function unregisterIvent() {
    authForm.enabled = true;
    f('successAuth').style.display = "none";
    f('auth').style.display = "block";
}

var defOpt = {
    "closeButton": true,
    "debug": false,
    "newestOnTop": true,
    "progressBar": false,
    "positionClass": "toast-top-right",
    "preventDuplicates": false,
    "onclick": null,
    "showDuration": "300",
    "hideDuration": "1000",
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "fadeIn",
    "hideMethod": "fadeOut"
};

var callOpt = {
    "closeButton": false,
    "debug": false,
    "newestOnTop": false,
    "progressBar": false,
    "positionClass": "toast-top-full-width",
    "preventDuplicates": false,
    "onclick": null,
    "showDuration": "300",
    "hideDuration": "1000",
    "timeOut": 0,
    "extendedTimeOut": 0,
    "showEasing": "swing",
    "hideEasing": "linear",
    "showMethod": "fadeIn",
    "hideMethod": "fadeOut",
    "tapToDismiss": false
};

function error(title, msg ,time) {
    toastr.options = defOpt;
    toastr.options.timeOut = time;
    toastr.options.extendedTimeOut = time;
    toastr.error(msg, title);
}

function info(title, msg ,time) {
    toastr.options = defOpt;
    toastr.options.timeOut = time;
    toastr.options.extendedTimeOut = time;
    toastr.info(msg, title);
}

function success(title, msg ,time) {
    toastr.options = defOpt;
    toastr.options.timeOut = time;
    toastr.options.extendedTimeOut = time;
    toastr.success(msg, title);
}

function warning(title, msg ,time) {
    toastr.options = defOpt;
    toastr.options.timeOut = time;
    toastr.options.extendedTimeOut = time;
    toastr.warning(msg, title);
}

function incomingCall(fromNumber, toNumber) {
    toastr.options = callOpt;
    toastr.options.timeOut = 20000;
    toastr.options.extendedTimeOut = 20000;
    toastr.warning(fromNumber + " => " + toNumber + "<br /><br /><button onclick='answerCall();' type='button'" +
                   " class='btn clear'>Ответить</button>", "Входящий звонок!");
}

