

if (Meteor.isServer && Meteor.isDevelopment) {
    const path = Npm.require('path');

    const webpack = Npm.require('webpack');
    const webpackDevMiddleware = Npm.require('webpack-dev-middleware');
    const webpackHotMiddleware = Npm.require('webpack-hot-middleware');
    const [clientConfig, serverConfig] = require('../webpack.config.js');

    const projectPath = path.resolve('.').split(path.sep + '.meteor')[0];

    clientConfig.mode = 'development';
    clientConfig.context = projectPath;

    const clientCompiler = webpack(clientConfig);
    // Tell express to use the webpack-dev-middleware and use the webpack.config.js
    // configuration file as a base.
    WebApp.connectHandlers.use(webpackDevMiddleware(clientCompiler, clientConfig.devServer));
    if (clientConfig.devServer.hot) {
        WebApp.connectHandlers.use(webpackHotMiddleware(clientCompiler));
    }
    WebAppInternals.registerBoilerplateDataCallback('webpack', (request, data, arch) => {
        data.dynamicBody = `<script defer src="main.js"></script>`;
    });
}