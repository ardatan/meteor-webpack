Package.describe({
    name: 'ardatan:webpack',
    version: '0.0.3',
    summary: 'Webpack Integration for Meteor',
    git: 'https://github.com/ardatan/meteor-webpack',
    documentation: '../../README.md'
});

Package.registerBuildPlugin({
    name: 'webpack',
    sources: ['plugin.js'],
    npmDependencies: {
        "jsdom": "11.6.2",
        "memory-fs": "0.4.1",
        "require-from-string": "2.0.1"
    }
});

Package.onUse(function (api) {
    api.use('isobuild:compiler-plugin@1.0.0', 'server');
});