module.exports = function(cli, config, state) {

    const {vorpal, logAndCb, log, logErr, logAsJSON} = cli;


    vorpal.command('publish <message>', 'Post a message to the message log.')
        .option('-v, --verbose', 'Log posted message structure')
        .option('-t, --type <messageType>', 'Publish JSON string as specific message type. Default type is "post".')
        .action(function (args, cb) {
            if (state.ssb_server) {
                let publishMessage;
                if (args.options.type) {
                    try {
                        publishMessage = JSON.parse(args.message);
                        publishMessage['type'] = args.options.type;
                    } catch (e) {
                        logErr("Failed to parse JSON message: "+ e.message);
                        cb();
                        return;
                    }
                } else {
                    publishMessage = {
                        type: 'post',
                        text: args.message
                    }
                }

                state.ssb_server.identities.publishAs({
                    id: state.ssb_server.id,
                    content: publishMessage,
                    private: false,
                }, function (err, msg) {
                    if (err) {
                        logErr(err)
                    } else if (args.options.verbose) {
                        vorpal.log(`Published: ${JSON.stringify(msg)}`);
                    }
                    cb();
                });
            } else {
                log("Server not started");
                cb();
            }
        });

};
