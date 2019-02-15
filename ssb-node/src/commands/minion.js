const Worker = require("tiny-worker");;

module.exports = function(cli, config, state) {

    const {vorpal, logAndCb, log, logErr, logAsJSON} = cli;

    let counter = 1;
    const MAXMINIONS = 50;
    const minions = new Map();

    function spawnMinion() {
        const id = counter++;
        // minionentrypoint.js expects process.argv to be: _node _script <ip> <port> <host> <datadirectory>
        const margs = ['127.0.1.'+(id+1), 9876, 'ssb-minion-'+id, '/tmp'];
        const moptions = {
            cwd: '/root/ssb-node'
        };
        const minion = new Worker('./src/minion/minionentrypoint.js', margs, moptions);
        minion.onmessage = function(event) {
            log(`[minion:${id}] `+ event.data);
        };
        minions.set(id, minion);
    }

    function terminateAllMinions() {
        minions.forEach(m => m.terminate());
        minions.clear();
    }

    // Make sure we bring all minions down with us
    process.on('exit', (code) => {
        terminateAllMinions();
    });

    vorpal.command('minion-spawn', 'Create a ssb-node minion, i.e. a forked process which we can control from our cli.')
        .option('-n, --number <number-to-spawn>', 'Number of minion to spawn.')
        .option('-f, --force', 'Force spawning even if comfort limit is exceeded.')
        .action(function (args, cb) {
            const spawnCount = args.options.number || 1;
            const allowance = Math.max(MAXMINIONS - minions.size, 0);
            if (!args.options.force && spawnCount > allowance) {
                log(`Only ${MAXMINIONS} minions may be spawned (to protect your docker container from locking up), you have ${allowance} left. Use '--force' to override.`)
            } else {
                for (let i=0; i<spawnCount; i++) {
                    spawnMinion();
                }
            }
            cb();
        });

    vorpal.command('minion-command <command>', 'Command all (or one) active minions, once they are spawned. Parameter <command> is any command, except minion commands, of course.')
        .option('-m, --minion <minion-id>', 'Command only a specific minion.')
        .action(function (args, cb) {
            if (minions.size > 0) {
                if (args.options.minion) {
                    const min = minions.get(args.options.minion);
                    if (min) {
                        min.postMessage(args.command);
                    } else {
                        log("Unknown minion id");
                    }
                } else {
                    minions.forEach(m => {
                        if (m.child.connected) {
                            m.postMessage(args.command)
                        } else {
                            logErr("Minion crash detected.")
                        }
                    });
                }
            } else {
                log("No minions are available.")
            }
            cb();
        });

    vorpal.command('minion-terminate', 'Terminate all minions.')
        .action(function (args, cb) {
            if (minions.size > 0) {
                terminateAllMinions();
            } else {
                log("No minions are available.")
            }
            cb();
        });

};
