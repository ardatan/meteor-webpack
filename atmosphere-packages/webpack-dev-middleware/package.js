Package.describe({
    name: 'ardatan:webpack-dev-middleware',
    debugOnly: true,
    version: '0.0.11',
    summary: 'Webpack Dev Middleware for Meteor',
    git: 'https://github.com/ardatan/meteor-webpack',
    documentation: '../../README.md'
});

Package.onUse(function (api) {
    api.use('webapp@1.5.0', 'server');
    api.addFiles('dev-server.js', 'server');
});

Npm.depends({
    debug: "4.1.1",
    "source-map-support": "0.5.12",
    "require-from-string": "2.0.2"
});
