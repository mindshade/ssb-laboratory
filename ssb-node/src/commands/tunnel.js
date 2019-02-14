const server = require('../util/server');

module.exports = function(cli, config, state) {

    const { vorpal, logAndCb, log, logErr, logAsJSON } = cli;

    vorpal.command('tunnel-ping <ssb_key>', 'Send a tunnel ping to ssb node with given key.')
        .action(function (args, cb) {
            if (state.ssb_server && state.portalId && state.portalAddress) {
                server.tunnelRpc(state.portalId, args.ssb_key, function(err, rpc_remote) {
                    if (err) logErr(err);
                    else {
                        vorpal.log("ping: rpc_remote id = " + rpc_remote.id);
                        rpc_remote.tunnel.ping(function (err, _ts) {
                            if (err) {
                                logAndCb(cb, err);
                            } else {
                                vorpal.log("ping returned: " + _ts);
                            }
                        });
                    }
                    cb();
                });
            } else {
                log("Server not started, or tunnel is not activated.");
                cb();
            }
        });

    // TODO: Add support for listing announced
    // vorpal.command('tunnel-list', 'List the connected tunnels. Doesnt work with official ssb-tunnel plugin.')
    //     .action(function (args, cb) {
    //         if (state.ssb_server) {
    //             logAsJSON(state.ssb_server.tunnel.list(), true);
    //         } else {
    //             log("Server not started.")
    //         }
    //         cb();
    //     });

};
