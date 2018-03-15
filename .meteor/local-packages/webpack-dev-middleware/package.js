Package.describe({
    name: 'webpack-dev-middleware',
    debugOnly: true
});

Package.onUse(function (api) {
    api.use('webapp', 'server');
    api.use('modules', 'server');
    api.mainModule('dev-server.js', 'server');
});