const server = require('../util/server');

module.exports = function(cli, config, state) {

    const { vorpal, logAndCb, log, logErr, logAsJSON } = cli;

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

    vorpal.command('server-start')
        .option('-v, --verbose', 'Verbose')
        .option('-p, --portal', 'Start in portal/hub mode.')
        .option('-t, --tunnel <portalAddres>', 'Open a tunnel to portal with given address')
        .description('Start ssb_server. If already started it will be restarted.')
        .action(async function (args, cb) {
            try {
                await stopServers(state);

                const configs = [];
                // Append default configuration
                configs.push(server.cfgDefault(config.ip, config.port));

                if (args.options.portal) {
                    // Append portal/hub configuration
                    configs.push(server.cfgPortal(config.hostname, config.ip, config.port));
                }

                if (args.options.tunnel) {
                    // Append tunnel configuration
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

    vorpal.command('server-stop', 'Stop ssb_server.')
        .action(async function (args, cb) {
            try {
                await stopServers(state);
            } catch (e) {
                logErr(e);
            }
            cb();
        });


};
