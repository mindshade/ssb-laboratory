
const vorpal = require('vorpal')();

function logAndCb(cb, err) {
    vorpal.log(err);
    cb();
}

function log(msg) {
    vorpal.log(msg);
}

function logErr(err) {
    vorpal.log(vorpal.chalk.red(err.stack ? err.stack : JSON.stringify(err)));
}

function logAsJSON(obj, pretty) {
    vorpal.log(pretty ? JSON.stringify(obj, null ,2) :JSON.stringify(obj));
}

vorpal.isCommandArgKeyPairNormalized = false; // If enabled, this corrupts some argument strings with '=' in them.


function show(promptInfo) {
    vorpal
        .delimiter(vorpal.chalk.yellow(`[${promptInfo}]>`))
        .show();
}

module.exports = {
    vorpal,
    log,
    logErr,
    logAsJSON,
    show
};
