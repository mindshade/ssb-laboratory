module.exports = function(cli, config, state) {

    const {vorpal, logAndCb, log, logErr, logAsJSON} = cli;

    vorpal.command('invite-create', 'Create an invite for this server.')
        .action(function (args, cb) {
            if (state.ssb_server) {
                state.ssb_server.invite.create({
                    // modern: true,  // Doesn't work either...
                    uses: 1000,
                    note: "This is an invite",
                    external: config.hostname
                }, function(err, invite) {
                    if (err) logErr(err);
                    else vorpal.log(JSON.stringify(invite));
                    cb();
                });
            } else {
                log("Server not started");
                cb();
            }
        });

    vorpal.command('invite-accept <invite>', 'Accept an invite to joina a pub/hub/portal.')
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
};
