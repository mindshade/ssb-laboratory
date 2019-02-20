const log = require('util').log;
const Config = require('ssb-config/inject');
const ssbKeys = require('ssb-keys');
const merge = require('deep-extend');
const labConfig = require('../labconfig');

// Inspired by Patchwork module setup, see https://github.com/ssbc/patchwork/blob/master/server-process.js
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
    .use(require('ssb-identities'))
    .use(require('../plugins/chat'));

let server;
let nodeName;
let keys;
let dataPath;

function init(path, name) {
    dataPath = path;
    nodeName = name;
    keys = ssbKeys.loadOrCreateSync(`${dataPath}/${nodeName}.key`);
}

function start(verbose, ...cfgs) {
    log(`Starting ssb-server...`);
    const customConfig = merge({}, ...cfgs);
    const config = Config(`${nodeName}`, customConfig);
    if (verbose) {
        log(`Configuration: ${JSON.stringify(config)}`);
    }
    server = createSbot(config);
    log(`Started ssb-server`);
    return server;
}

function cfgDefault(ip, port) {
    return {
        path: dataPath+"/"+nodeName,
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
    init,
    start,
    cfgDefault,
    cfgPortal,
    cfgTunnelToPortal,
    tunnelRpc
};


