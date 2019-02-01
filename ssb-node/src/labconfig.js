const dns = require('dns');
const os = require('os');

function getIP() {
    return new Promise((resolve, reject) => {
        dns.lookup(os.hostname(), function (err, addr, fam) {
            if (err) {
                reject(err)
            } else {
                resolve(addr);
            }
        })
    });
}

function getHost() {
    return os.hostname();
}

module.exports = {
    getIP,
    getHost,
    appKey: 'fjZnztSijc/aoGDhCvkFoqoR7JHHOmSXJvKmOP58IrM=', // Lab key
    //appKey: '1KHLiKZvAvjbY1ziZEHMXawbCEIM6qwjCDm3VYRan/s=' // Standard Scuttlebutt network key...
};
