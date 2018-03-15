Package.describe({
    name: 'webpack-dev-middleware'
});

Package.onUse(function (api) {
    api.use('webapp', 'server');
    api.use('modules');
    api.mainModule('dev-server.js', 'server');
});