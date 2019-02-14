const pull = require('pull-stream');

module.exports = function(cli, config, state) {

    const {vorpal, logAndCb, log, logErr, logAsJSON} = cli;

    vorpal.command('inspect-id', 'Show my ssb identity, using the whoami method.')
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

    vorpal.command('inspect-address', 'Show my ssb net address.')
        .action(function (args, cb) {
            if (state.ssb_server) {
                log(state.ssb_server.getAddress().replace('localhost', config.hostname));
            } else {
                log("Server not started.")
            }
            cb();
        });

    vorpal.command('inspect-logstream', 'Dump the entire message log.')
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

};
