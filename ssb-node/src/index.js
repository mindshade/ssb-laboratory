const vorpal = require('vorpal')();
const pull = require('pull-stream');
const server = require('./server');
const labconfig = require('./labconfig');

async function stopServers(state) {
    return new Promise(async (resolve, reject) => {

        function _doClose(closeable, description) {
            return new Promise((resolve, reject) => {
                if (closeable) {
                    log(`Closing ${description}...`);
                    closeable.close(function (err) {
                        if (err) console.error(err);
                        else log(`Closed ${description}.`);
                        resolve();
                    });
                } else {
                    resolve();
                }
            });
        }

        await _doClose(state.ssb_server, 'Server');
        state.ssb_server = null;
        resolve();
    });
}

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

(async function() {

    const port = 9876;
    const ip = await labconfig.getIP();
    const hostname = await labconfig.getHost();

    const state = {};

    vorpal.isCommandArgKeyPairNormalized = false; // If enabled, this corrupts some argument strings with '=' in them.

    vorpal.command('start')
        .option('-v, --verbose', 'Verbose')
        .option('-p, --portal', 'Start in portal/hub mode.')
        .option('-t, --tunnel <portalAddres>', 'Open a tunnel to portal with given address')
        .description('Start ssb_server. If already started it will be restarted.')
        .action(async function (args, cb) {
            try {
                await stopServers(state);

                const configs = [];
                configs.push(server.cfgDefault(ip, port));
                if (args.options.portal) {
                    configs.push(server.cfgPortal(hostname, ip, port));
                }
                if (args.options.tunnel) {
                    state.portalAddress = args.options.tunnel;
                    state.portalId = '@'+/^.*shs:([^=]+=)$/g.exec(state.portalAddress)[1]+'.ed25519';
                    configs.push(server.cfgTunnelToPortal(state.portalId, state.portalAddress));
                }

                state.ssb_server = server.start(args.options.verbose, ...configs);
            } catch (e) {
                logErr(e);
            }
            cb();
        });

    vorpal.command('stop', 'Stop ssb_server.')
        .action(async function (args, cb) {
            try {
                await stopServers(state);
            } catch (e) {
                logErr(e);
            }
            cb();
        });

    vorpal.command('getId', 'Show my ssb identity, using the whoami method.')
        .option('-v, --verbose', 'Verbose')
        .action(function (args, cb) {
            if (state.ssb_server) {
                state.ssb_server.whoami(function (err, msg) {
                    if (err) logErr(err);
                    else {
                        if (args.options.verbose) {
                            logAsJSON(msg, true);
                        } else {
                            log(msg.id);
                        }
                    }
                });
            } else {
                log("Server not started.")
            }
            cb();
        });

    vorpal.command('getAddress', 'Show my ssb net address.')
        .action(function (args, cb) {
            if (state.ssb_server) {
                log(state.ssb_server.getAddress().replace('localhost', hostname));
            } else {
                log("Server not started.")
            }
            cb();
        });

    vorpal.command('logStream', 'Dump the entire message log.')
        .action(function (args, cb) {
            if (state.ssb_server) {
                let index = 0;
                pull(
                    state.ssb_server.createLogStream({type: 'post', live: false}),
                    pull.collect(function (err, msgs) {
                        if (err) {
                            logErr(err);
                        } else {
                            if (msgs) {
                                msgs.forEach(m => vorpal.log(`${vorpal.chalk.yellow(index++)}: ${JSON.stringify(m)}`));
                            }
                        }
                        cb();
                    })
                );
            } else {
                log("Server not started");
                cb();
            }
        });

    vorpal.command('post <message>', 'Post a message to the message log.')
        .option('-v, --verbose', 'Log posted message structure')
        .action(function (args, cb) {
            if (state.ssb_server) {
                state.ssb_server.publish({type: 'post', text: args.message}, function (err, msg) {
                    if (err) {
                        logErr(err)
                    } else if (args.options.verbose) {
                        vorpal.log(`Posted: ${JSON.stringify(msg)}`);
                    }
                    cb();
                });
            } else {
                log("Server not started");
                cb();
            }
        });


    vorpal.command('invite', 'Create an invite for this server.')
        .action(function (args, cb) {
            if (state.ssb_server) {
                state.ssb_server.invite.create({
                    uses: 1000,
                    note: "This is an invite",
                    external: hostname
                }, function(err, invite) {
                    if (err) logErr(err);
                    else vorpal.log(`Server invite: ${JSON.stringify(invite)}`);
                    cb();
                });
            } else {
                log("Server not started");
                cb();
            }
        });


    vorpal.command('accept <invite>', 'Accept an invite to joina a pub/hub/portal.')
        .action(function (args, cb) {
            if (state.ssb_server) {
                state.ssb_server.invite.accept(args.invite, function (err) {
                    if (err) logErr(err);
                    else vorpal.log('Invite used.');
                    cb();
                });
            } else {
                log("Server not started");
                cb();
            }
        });

    vorpal.command('tunnelPing <ssb_key>', 'Send a tunnel ping to ssb node with given key.')
        .action(function (args, cb) {
            if (state.ssb_server && state.portalId && state.portalAddress) {
                const remoteId = /^@([^=]+=)\.ed25519$/g.exec(args.ssb_key)[1];
                const tunnelAddress = `tunnel:${state.portalId}:${args.ssb_key}~shs:${remoteId}`;
                state.ssb_server.connect(tunnelAddress, function (err, rpc_remote) {
                    if (err) {
                        logAndCb(cb, err);
                    } else {
                        vorpal.log("ping: rpc_remote id = "+rpc_remote.id);
                        rpc_remote.tunnel.ping(function (err, _ts) {
                            if (err) {
                                logAndCb(cb, err);
                            } else {
                                vorpal.log("ping returned: "+_ts);
                                rpc_remote.close(cb);
                            }
                        });
                    }
                });
            } else {
                log("Server not started, or tunnel is not activated.");
                cb();
            }
        });

    vorpal.command('listTunnels', 'List the connected tunnels.')
        .action(function (args, cb) {
            if (state.ssb_server) {
                logAsJSON(state.ssb_server.tunnel.list(), true);
            } else {
                log("Server not started.")
            }
            cb();
        });

    vorpal.command('chat <msg> <ssb_key>', 'Send direct chat message to remote ssb node using a tunnel.')
        .action(function (args, cb) {

            const remoteId = /^@([^=]+=)\.ed25519$/g.exec(args.ssb_key)[1];
            const tunnelAddress = `tunnel:${state.portalId}:${args.ssb_key}~shs:${remoteId}`;

            function _connectRpc(tunnelAddress, cb) {
                if (!state.rpcs) {
                    state.rpcs = {};
                }
                if (state.rpcs && state.rpcs[remoteId] && !state.rpcs[remoteId].closed) {
                    vorpal.log("Reused exisiting remote rpc connection to:"+state.rpcs[remoteId].id);
                    cb(null, state.rpcs[remoteId]);
                } else {
                    state.ssb_server.connect(tunnelAddress, function (err, rpc_remote) { // See node_modules/secret-stack/core.js:206
                        if (err) {
                            cb(err);
                        } else {
                            vorpal.log("Opened new remote rpc connection to:"+rpc_remote.id);
                            state.rpcs[remoteId] = rpc_remote;
                            cb(null, rpc_remote);
                        }
                    });
                }
            }

            if (state.ssb_server && state.portalId && state.portalAddress) {
                _connectRpc(tunnelAddress, function(err, rpc_remote) {
                    if (err) logErr(err);
                    else rpc_remote.chat.hello(args.msg, function (err, reply) {
                        if (err) logErr(err);
                        else {
                            vorpal.log("hello returned: " + reply);
                        }
                    });
                    cb();
                });
            } else {
                log("Server not started, or tunnel is not activated.");
                cb();
            }
        });

    try {
        vorpal
            .delimiter(vorpal.chalk.yellow(`[${hostname} ${ip}]>`))
            .show();
    } catch (e) {
        logErr(e);
    }
})();
