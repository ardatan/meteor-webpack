Package.describe({
    name: 'webpack'
});

Package.registerBuildPlugin({
    name: 'webpack',
    use: ['modules'],
    npmDependencies: {
        "require-from-string": "2.0.1",
        "memory-fs": "0.4.1",
        "jsdom": "11.6.2"
    },
    sources: ['plugin.js']
});

Package.onUse(function (api) {
    api.use('isobuild:compiler-plugin@1.0.0', 'server');
});