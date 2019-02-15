// Entrypoint needs to use absolute require path, subsequent requires calls
// works with relative paths.
require(__dirname+'/src/minion/minionworker');
