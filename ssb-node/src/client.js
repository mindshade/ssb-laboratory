const log = require('util').log;
const fs = require('fs');
const Client = require('ssb-client');
const ssbKeys = require('ssb-keys');
const labConfig = require('./labconfig');

function start(verbose, ip, port) {
    return new Promise((resolve, reject) => {

        log(`Starting ssb-client...`);
        const manifestAsString = fs.readFileSync("/root/.ssb-laboratory/manifest.json");
        const manifest = JSON.parse(manifestAsString);
        const keys = ssbKeys.loadOrCreateSync('./ssb-laboratory.key');

        const clientConfig = {
            host: ip,
            port: port,
            manifest: manifest,
            key: keys.id,
            caps: {
                shs: labConfig.appKey
            }
        };

        if (verbose) {
            log(`Starting client with config ${JSON.stringify(clientConfig)}`);
        }

        Client(keys, clientConfig, function (err, client) {
            if (err) reject(err);
            else {
                log(`Started ssb-client.`);
                resolve(client);
            }
        });
    });
}


module.exports = {
    start
};
