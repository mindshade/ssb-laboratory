const server = require('../util/server');
const nodeRootDir = '/root/ssb-node';

const argv = process.argv;

if (argv.length !== 6) {
    console.error("minion expects parameters: ip port hostname datadir");
    process.exit(-1);
}

const mConfig = {
    ip: argv[2],
    port: argv[3],
    hostname: argv[4],
    datadir: argv[5]
};

// Prepend all logging with a minion prefix
const __console_log = console.log;
const __console_error = console.error;
const consolePrefix = `[${mConfig.hostname}]`;
console.log = function() {
    __console_log.apply(console, [consolePrefix].concat(Array.from(arguments)));
};
console.error = function() {
    __console_error.apply(console, [consolePrefix].concat(Array.from(arguments)));
};


server.init(mConfig.datadir, mConfig.hostname);

const fs = require('fs');
const cli = require('../util/cli');

onmessage = function(event) {
    try {
        cli.exec(event.data, function (err) {
            if (err) postMessage("COMMAND ERROR: "+err)
        });
    } catch (e) {
        postMessage("ERROR THROWN: "+e.message);
    }
};

(async function() {

    // Set up config object for commands
    const config = {};
    config['port'] = mConfig.port;
    config['ip'] = mConfig.ip;
    config['hostname'] = mConfig.hostname;
    config['datadir'] = mConfig.datadir;

    console.log(`Spawned [${config.hostname} ${config.ip}:${config.port} ${config.datadir}]`);

    // Set up state object which is shared between all commands
    const state = {};

    // Loop over the js files in ./src/commands and "install" them.
    const commandsFolder = `${nodeRootDir}/src/commands`;
    fs.readdirSync(commandsFolder).forEach(file => {
        const cmd = /^(.*)\.js$/g.exec(file);
        if (cmd && cmd[1] !== "minion") { // Don't make the minion command available to minions, that would be crazy.
            require(`${commandsFolder}/${cmd[1]}`)(cli, config, state);
        }
    });

})();
