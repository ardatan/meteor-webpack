function resolveExternals(context, request, callback) {
    return resolveMeteor(request, callback) ||
        callback();
}

function resolveMeteor(request, callback) {
    var match = request.match(/^meteor\/(.+)$/);
    var package = match && match[1];
    if (package) {
        callback(null, `Package['${package}']`);
        return true;
    }
};

module.exports = function meteorExternals() {
    return resolveExternals;
}