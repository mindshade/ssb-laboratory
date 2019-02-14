exports.name = 'chat';
exports.version = '1.0.0';

exports.manifest = {
    hello: 'sync',
    tell: 'sync',
    whisper: 'sync',
    allow: 'sync'
};

exports.permissions = {
    anonymous: {
        allow: ['hello', 'tell', 'whisper']
    },
    master : {
        allow: ['allow'] // The 'allow' method is protected.
    }
};

const allowedWhisperers = [];

exports.init = function (server, config) {

    // Auth hook inspired from how `ssb-invite` handles this.
    // The hoox pattern is used, https://www.npmjs.com/package/hoox
    // See discussion http://git.scuttlebot.io/%256afaPE3DST9lBpE5OI3pRmcSCdeNB6Lbz3ukv5ElO74%3D.sha256
    // server.auth.hook(function (fn, args) {
    //     // Fallback and execute normal permission check
    //     const pubkey = args[0], cb = args[1];
    //     fn(pubkey, function (err, auth) {
    //         if (auth) console.log("AUTH", JSON.stringify(auth));
    //         if (err||auth) {
    //             return cb(err, auth)
    //         }
    //         if (allowedWhisperers.indexOf(pubkey) > -1) {
    //             console.log("[chat.auth.hook] found allowed whisperee");
    //             return cb(null, false);
    //         } else {
    //             cb(new Error('Access denied'));
    //         }
    //     });
    // });

    return {
        hello: function (name) {
            console.log(`[chat:hello] ${this.id} said: ${name}`);
            return `Hello ${name}!`;
        },
        tell: function (msg) {
            console.log(`[chat:tell] ${this.id} told me: ${msg}`);
            return `Got it!`;
        },
        whisper: function(msg) {
            if (allowedWhisperers.indexOf(this.id) > -1) {
                console.log(`[chat:whisper] ${this.id} whispered: ${msg}`);
                return "Mum's the word...";
            } else {
                throw new Error('Access denied');
            }
        },
        allow: function(accessorKey) {
            if (allowedWhisperers.indexOf(this.id) === -1) {
                console.log(`[chat:allow] added ${accessorKey} as an allowed whisperer`);
                allowedWhisperers.push(accessorKey);
            } else {
                console.log(`[chat:allow] ${accessorKey} is already an allowed whisperer`);
            }
        }
    }
};



