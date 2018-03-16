Package.describe({
    name: 'webpack'
});

Package.registerBuildPlugin({
    name: 'webpack',
    use: ['modules'],
    sources: ['plugin.js']
});

Package.onUse(function (api) {
    api.use('isobuild:compiler-plugin@1.0.0', 'server');
});