//JsSIP.debug.enable('JsSIP:*');

var ua;
var call;
var remoteAudio = f('myMultimedia');
var session; // outgoing call session here
var local_stream;
var myMultimedia;
var remote_stream;
var theirMultimedia;
var nowCall = false;

var eventHandlersCall = {
    'progress': function (data) {
        //if (data.originator === 'remote') data.response.body = null;
        //f('statusCall').innerHTML = 'Попытка звонка...';
        f('call').innerHTML = 'Завершить';
        info("Дозвон...", "", 10000);
        nowCall = true;
    },

    'failed': function (e) {
        // if (e.hasOwnProperty(value)) {
        //     $('statusCall').innerHTML = 'Звонок не удался в связи с' + e.data.value;
        // } else {
        //f('statusCall').innerHTML = 'Звонок не удался в связи с ' + e.cause;
        // }
        warning("Звонок не удался", e.cause, 60000);
        console.log('Не удался звонок');
        f('call').innerHTML = 'Позвонить';
        nowCall = false;
    },

    'ended': function (e) {
        // if (e.hasOwnProperty(value)) {
        //     $('statusCall').innerHTML = 'Звонок закончился в связи с' + e.data.value;
        // } else {
        //f('statusCall').innerHTML = 'Звонок закончился в связи с ' + e.cause;
        info("Звонок завершён", e.cause, 10000);
        f('call').innerHTML = 'Позвонить';
        nowCall = false;
        // }
    },

    'confirmed': function (e) {
        local_stream = session.connection.getLocalStreams()[0];
        console.log(local_stream); //If i print this variable I do get a media stream
        console.log(local_stream.getAudioTracks());
        console.log('CALL CONFIRMED');
        remote_stream = session.connection.getRemoteStreams()[0];
        console.log(remote_stream);
        console.log(remote_stream.getAudioTracks());
        remoteAudio.src = window.URL.createObjectURL(remote_stream);
        remoteAudio.play();
        //remoteAudio.src = e.stream.getAudioTracks();
        //remoteAudio.play();
        // myMultimedia = JsSIP.rtcninja.attachMediaStream(myMultimedia, local_stream); //here I get "element is null"
    }
    // 'addstream': function (e) {
    //     remote_stream = e.stream;
    //     console.log(remote_stream); //If i print this variable I do get a media stream
    //     console.log('REMOTE STREAM RECEIVED');
    //     console.log(e);
    //     console.trace('remote stream added ' +e.stream.getAudioTracks().length);
    //     // theirMultimedia = JsSIP.rtcninja.attachMediaStream(theirMultimedia, remote_stream); //here I get "element is null"
    // }
    // 'newRTCSession': function(data){
    //     console.log("newSession");
    //     var session = data.session;
    //
    //     if (session.direction === "incoming") {
    //         // answer incoming call
    //         session.answer(optionsCall);
    //     }
    // }
};

var optionsCall = {
    'eventHandlers': eventHandlersCall,
    'mediaConstraints': {'audio': true, 'video': false},
    //'pcConfig': {
    //'iceServers': [
    //    { 'urls': ['stun:stun.l.google.com:19302'] }
    //]
    //}
    media: {
        remote: {
            audio: document.getElementById('myMultimedia')
        }
    }
};

function auth(uri, pass, server) {
    try {
        var socket = new JsSIP.WebSocketInterface(server); //ws://212.224.113.123:8088/ws
    } catch(e) {
        if (e.name !== "SecurityError") {
            error("Ошибка браузера", "Ошибка безопасности", 20000);
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
        session_timers_refresh_method: 'invite',
        // 'extraHeaders': ['X-Foo: foo', 'X-Bar: bar'],
        // 'mediaConstraints': {'audio': true, 'video':false},
        // 'rtcOfferConstraints' : {'offerToReceiveAudio' : true } ,
        //
        // mandatory: [{
        //     OfferToReceiveAudio: true,
        //     OfferToReceiveVideo: false
        // },{'DtlsSrtpKeyAgreement': true} ]

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
        info("Подключенно", "Подключен к серверу", 1000);
    });

    ua.on('registered', function (e) {
        console.log('Зарегистрирован');
        authForm.success();
    });

    ua.on('unregistered', function (e) {
        console.log('Разрегистрирован');
        unregisterIvent();
        info("Разрегистрирован", "Успешный выход", 1000);
    });

    ua.on('registrationFailed', function (e) {
        console.log('Регистрация не удалась');
        authForm.error();
    });

    ua.start();
}

function call(sip) {
    if (!nowCall) {
        session = ua.call(sip, optionsCall); //'sip:79043402122@212.224.113.123'
    } else {
        ua.terminateSessions();
    }
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
    auth(f('inputSIP').value, f('inputPassword').value, f('inputServer').value)
}

//auth("sip:7812@159.89.100.53", "cock", "ws://159.89.100.53:8088/ws");

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
        //f('statusAuth').innerHTML = 'Неправильный SIP или пароль.';
        error("Ошибка аутентификации", "Неправильный SIP или Пароль", 0);
        this.enabled = true;
        //this.message('Регистрация не удалась');
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

toastr.options = {
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

function error(title, msg ,time) {
    toastr.options.timeOut = time;
    toastr.options.extendedTimeOut = time;
    toastr.error(msg, title);
}

function info(title, msg ,time) {
    toastr.options.timeOut = time;
    toastr.options.extendedTimeOut = time;
    toastr.info(msg, title);
}

function success(title, msg ,time) {
    toastr.options.timeOut = time;
    toastr.options.extendedTimeOut = time;
    toastr.success(msg, title);
}

function warning(title, msg ,time) {
    toastr.options.timeOut = time;
    toastr.options.extendedTimeOut = time;
    toastr.warning(msg, title);
}

