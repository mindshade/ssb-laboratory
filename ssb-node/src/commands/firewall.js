const { exec } = require('child_process');

const nodeRootDir = '/root/ssb-node';

module.exports = function(cli) {

    async function applyFwProfile(profileScript, cb) {
        return new Promise((resolve, reject) => {
            exec(`/bin/ash ${nodeRootDir}/${profileScript}`, (err, stdout, stderr) => {
                if (err) {
                    reject(err);
                } else {
                    // the *entire* stdout and stderr (buffered)
                    cli.log(stdout);
                    cli.logErr(stderr);
                    resolve();
                }
            });
        });
    }

    cli.vorpal.command('firewall [profile]')
        .option('-r, --reset', 'Reset iptables to block all incoming connections')
        .description('Apply a firewall profile. Available profiles: "hub" - Allow incoming TCP on 9876, "accept" - Allow anything.')
        .action(async function (args, cb) {
            try {
                if (args.options.reset) {
                    await applyFwProfile("script/fw.sh")
                }
                if (args.profile) {
                    await applyFwProfile(`script/fw-${args.profile}.sh`)
                }
            } catch (e) {
                cli.logErr(e.message);
            }
            cb();
        });
};
