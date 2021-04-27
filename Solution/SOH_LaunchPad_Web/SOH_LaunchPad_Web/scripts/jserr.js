
function JSErrLog(message, source, lineno, colno, error) {

    var JSErr = {};
    JSErr.message = message;
    JSErr.source = source;
    JSErr.lineno = lineno;
    JSErr.colno = colno;
    JSErr.error = error;
    JSErr.user = localStorage.getItem('SOH_Username');

    JSErrLogUpload(JSON.stringify(JSErr));

    return false;
};

function JSErrLogInit() {
    window.onerror = JSErrLog;

    for(var i=0;i<window.frames.length;i++){
        window.frames[i].onerror = JSErrLog;
    }
}


function JSErrHandle(error) {

    var JSErr = {};
    JSErr.message = "AsyncErr";
    JSErr.error = error.toString() + ";" + error.stack;
    JSErr.user = localStorage.getItem('SOH_Username');

    JSErrLogUpload(JSON.stringify(JSErr));
}

function JSErrLogUpload(err) {
    var _navigator = {};
    for (var i in navigator) _navigator[i] = navigator[i];
    delete _navigator.plugins;
    delete _navigator.mimeTypes;

    $.ajax({
        type: "POST",
        async: true,
        url: "JSLog.ashx",
        data: {
            data: err,
            nav: JSON.stringify(_navigator)
        },
        contentType: "application/json; charset=utf-8",
        dataType: "json",
        error: function (jqXHR, textStatus, errorThrown) {
        },
        success: function (data) {
        }
    });
}