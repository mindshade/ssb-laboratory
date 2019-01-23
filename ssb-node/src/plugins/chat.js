exports.name = 'chat'
exports.version = '1.0.0'

exports.manifest = {
    hello: 'sync'
}

exports.permissions = {
    anonymous: {allow: ['hello']}
}

exports.init = function (sbot, config) {
    return {
        hello: function (msg) {
            console.log(`chat: ${this.id} said: ${msg}`);
            return "Got it!";
        }
    }
}



