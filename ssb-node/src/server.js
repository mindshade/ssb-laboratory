const log = require('util').log;
const Server = require('ssb-server');
const Config = require('ssb-config/inject');
const fs = require('fs');
const path = require('path');
const ssbKeys = require('ssb-keys');
const merge = require('deep-extend');
const labConfig = require('./labconfig');

const keys = ssbKeys.loadOrCreateSync('./ssb-laboratory.key');

function start(verbose, ...cfgs) {
    return new Promise((resolve, reject) => {
        log(`Starting ssb-server...`);
        const customConfig = merge({}, ...cfgs);
        const config = Config('ssb-laboratory', customConfig);

        // Inspired from Patchwork, see https://github.com/ssbc/patchwork/blob/master/server-process.js
        const server = Server.createSsbServer(function (err, result) {
            if (err) log(err);
            resolve(server);
        })
            .use(require('ssb-server/plugins/master'))
            .use(require('ssb-server/plugins/gossip'))
            .use(require('ssb-server/plugins/replicate'))
            .use(require('ssb-server/plugins/no-auth'))
            .use(require('ssb-server/plugins/unix-socket'))
            //    .use(require('ssb-friends'))
            .use(require('ssb-server/plugins/invite'))
            .use(require('ssb-server/plugins/local'))
            .use(require('ssb-server/plugins/logging'))
            .use(require('ssb-tunnel'))
            .use(require('./plugins/chat'))
            (config);

        // Save an updated list (manifest) of methods this server has made public
        // in a location that ssb-client will know to check
        const manifest = server.getManifest();
        const manifestAsString = JSON.stringify(manifest);
        const manifestFilename = path.join(config.path, 'manifest.json');
        if (verbose) {
            log(`Writing manifest to ${manifestFilename}`);
            log(`Manifest: ${manifestAsString}`);
            log(`Configuration: ${JSON.stringify(config)}`);
        }
        fs.writeFileSync(manifestFilename, manifestAsString);
        log(`Started ssb-server`);

        // WORKAROUND, when tunnel is enabled the createSsbServer callback never returns, which hangs
        // the startup unless we resolve the promise here. TODO: Investigate
        setTimeout(function() { resolve(server); }, 2000);
    });
}

function cfgDefault(ip, port) {
    return {
        port: 9876,
        host: ip,
        pub: false,
        local: false,
        master: keys.id,
        keys: keys,
        caps: {
            shs: labConfig.appKey
        },
        logging: {
            level: 'info'
        },
        connections: {
            incoming: {
                net: [{ scope: ["device" ], "transform": "shs", host: ip, port: port }] // Allow client to connect from device.
            },
            outgoing: {
                net: [{ transform: "shs" }]
            }
        }
    };
}

function cfgPortal(hostName, ip, port) {
    return {
        pub: true,
        connections: {
            incoming: {
                net: [{ scope: ["local", "device", "public"], "external": [hostName], "transform": "shs", host: ip, port: port }]
            }
        },
        tunnel: { logging: true }
    };
}

function cfgTunnelToPortal(portalId, portalAddress) {
    return {
        connections: {
            incoming: {
                tunnel: [{scope: 'public', transform: 'shs', portal: portalId }],
            },
            outgoing: {
                tunnel: [{ scope: ["public"], /* portal: keys.id,*/ transform: "shs"}]
            }
        },
        seeds: [ portalAddress ],
        tunnel: { logging: true }
    };
}


module.exports = {
    start,
    cfgDefault,
    cfgPortal,
    cfgTunnelToPortal
};


