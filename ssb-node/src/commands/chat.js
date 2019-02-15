const server = require('../util/server');

module.exports = function(cli, config, state) {

    const {vorpal, logAndCb, log, logErr, logAsJSON} = cli;

    function _withRemoteChatEndpoint(portalId, remoteKey, cb) {
        server.tunnelRpc(state.portalId, remoteKey, function(err, rpc_remote) {
            if (err) cb(err);
            else cb (null, rpc_remote.chat);
        });
    }

    vorpal.command('chat-hello <id> <myname>', 'Send hello message using the chat plugin to remote ssb node using a tunnel.')
        .action(function (args, cb) {
            if (state.ssb_server && state.portalId && state.portalAddress) {
                _withRemoteChatEndpoint(state.portalId, args.id, function(err, chat) {
                    if (err) logErr(err);
                    else chat.hello(args.myname, function (err, reply) {
                        if (err) logErr(err);
                        else {
                            vorpal.log("remote node returned: " + reply);
                        }
                    });
                    cb();
                });
            } else {
                log("Server not started, or tunnel is not activated.");
                cb();
            }
        });


    vorpal.command('chat-tell <id> <message>', 'Tell a remote node a message using the chat plugin over a tunnel.')
        .action(function (args, cb) {
            if (state.ssb_server && state.portalId && state.portalAddress) {
                _withRemoteChatEndpoint(state.portalId, args.id, function(err, chat) {
                    if (err) logErr(err);
                    else chat.tell(args.message, function (err, reply) {
                        if (err) logErr(err);
                        else {
                            vorpal.log("remote node returned: " + reply);
                        }
                    });
                    cb();
                });
            } else {
                log("Server not started, or tunnel is not activated.");
                cb();
            }
        });

    vorpal.command('chat-whisper <id> <message>', 'Try whispering to a remote node using the chat plugin over a tunnel. Note: The whisperee must have allowed you as a whisperer this first.')
        .action(function (args, cb) {
            if (state.ssb_server && state.portalId && state.portalAddress) {
                _withRemoteChatEndpoint(state.portalId, args.id, function(err, chat) {
                    if (err) logErr(err);
                    else chat.whisper(args.message, function (err, reply) {
                        if (err) logErr(err);
                        else {
                            vorpal.log("remote node returned: " + reply);
                        }
                    });
                    cb();
                });
            } else {
                log("Server not started, or tunnel is not activated.");
                cb();
            }
        });

    vorpal.command('chat-allow-whisperee <id>', 'Allow a whisperee to whisper to us.')
        .action(function (args, cb) {
            if (state.ssb_server) {
                state.ssb_server.chat.allow(args.id);
            } else {
                log("Server not started, or tunnel is not activated.");
            }
            cb();
        });

};
