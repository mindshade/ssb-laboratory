const log = require('util').log;
const Config = require('ssb-config/inject');
const fs = require('fs');
const path = require('path');
const ssbKeys = require('ssb-keys');
const merge = require('deep-extend');
const labConfig = require('../labconfig');

const keys = ssbKeys.loadOrCreateSync('./ssb-laboratory.key');

// Inspired from Patchwork, see https://github.com/ssbc/patchwork/blob/master/server-process.js
var createSbot = require('ssb-server')
    .use(require('ssb-server/plugins/master'))
    .use(require('ssb-server/plugins/no-auth'))
    .use(require('ssb-server/plugins/unix-socket'))
    .use(require('ssb-server/plugins/local'))
    .use(require('ssb-server/plugins/logging'))
    .use(require('ssb-gossip'))
    .use(require('ssb-replicate'))
    .use(require('ssb-friends'))
    .use(require('ssb-blobs'))
    .use(require('ssb-invite'))
    .use(require('ssb-tunnel'))
    .use(require('../plugins/chat'));

let server;

function start(verbose, ...cfgs) {
        log(`Starting ssb-server...`);
        const customConfig = merge({}, ...cfgs);
        const config = Config('ssb-laboratory', customConfig);

        server = createSbot(config);

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
        return server;
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


const rpcs = {};

function tunnelRpc(portalId, remoteKey, cb) {

    const remoteId = /^@([^=]+=)\.ed25519$/g.exec(remoteKey)[1];
    const tunnelAddress = `tunnel:${portalId}:${remoteKey}~shs:${remoteKey}`;

    if (rpcs && rpcs[remoteId] && !rpcs[remoteId].closed) {
        console.log("Reused existing remote rpc connection to:"+rpcs[remoteId].id);
        cb(null, rpcs[remoteId]);
    } else {
        server.connect(tunnelAddress, function (err, rpc_remote) { // See node_modules/secret-stack/core.js:206
            if (err) {
                cb(err);
            } else {
                console.log("Opened new remote rpc connection to:"+rpc_remote.id);
                rpcs[remoteId] = rpc_remote;
                cb(null, rpc_remote);
            }
        });
    }
}


module.exports = {
    start,
    cfgDefault,
    cfgPortal,
    cfgTunnelToPortal,
    tunnelRpc
};


