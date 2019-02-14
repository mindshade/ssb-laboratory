const fs = require('fs');
const cli = require('./util/cli');
const labconfig = require('./labconfig');

const nodeRootDir = '/root/ssb-node';

const { vorpal, logAndCb, log, logErr, logAsJSON } = cli;

(async function() {

    // Set up config object for commands
    const config = {};
    config['port'] = 9876;
    config['ip'] = await labconfig.getIP();
    config['hostname'] = await labconfig.getHost();

    // Set up state object which is shared between all commands
    const state = {};

    // Loop over the js files in ./src/commands and "install" them.
    const commandsFolder = `${nodeRootDir}/src/commands`;
    process.stdout.write('Loading commands: ')
    fs.readdirSync(commandsFolder).forEach(file => {
        const cmd = /^(.*)\.js$/g.exec(file);
        if (cmd) {
            require(`./commands/${cmd[1]}`)(cli, config, state);
            process.stdout.write(cmd[1]+" ");
        }
    });
    process.stdout.write("\n")

    // Show the command prompt
    try {
        cli.show(`${config.hostname} ${config.ip}`)
    } catch (e) {
        logErr(e);
    }
})();
