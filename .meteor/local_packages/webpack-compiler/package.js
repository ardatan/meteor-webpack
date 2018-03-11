Package.describe({
    name: 'ardatan:webpack-compiler'
});

Package.registerBuildPlugin({
    name: 'ardatan:webpack-compiler',
    sources: ['plugin.js'],
    npmDependencies: {
        "webpack": "4.1.1",
        "memory-fs": "0.4.1"
    }
});

Package.onUse(api => {
    api.use('isobuild:compiler-plugin@1.0.0', 'server');
})