Package.describe({
    name: 'webpack'
});

Package.registerBuildPlugin({
    name: 'webpack',
    use: ['modules'],
    npmDependencies: {
        "memory-fs": "0.4.1",
        "require-from-string": "2.0.1"
    },
    sources: ['plugin.js']
});

Package.onUse(function (api) {
    api.use('isobuild:compiler-plugin@1.0.0');
});