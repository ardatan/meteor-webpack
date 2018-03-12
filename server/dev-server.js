

if (Meteor.isServer && Meteor.isDevelopment) {

    const path = require('path');
    const rimraf = require('rimraf');

    const webpack = require('webpack');
    const webpackDevMiddleware = require('webpack-dev-middleware');
    const webpackHotMiddleware = require('webpack-hot-middleware');

    const [clientConfig, serverConfig] = require('../imports/webpack.config.dev.js');

    const projectPath = path.resolve('.').split(path.sep + '.meteor')[0];
    rimraf(path.join(projectPath, 'client/build'), () => { });
    rimraf(path.join(projectPath, 'public/build'), () => { });

    clientConfig.mode = 'development';

    const clientCompiler = webpack(clientConfig);
    // Tell express to use the webpack-dev-middleware and use the webpack.config.js
    // configuration file as a base.
    WebApp.connectHandlers.use(webpackDevMiddleware(clientCompiler, clientConfig.devServer));
    if (clientConfig.devServer.hot) {
        WebApp.connectHandlers.use(webpackHotMiddleware(clientCompiler));
    }
    WebAppInternals.registerBoilerplateDataCallback('webpack', (request, data, arch) => {
        data.dynamicBody = '<script defer src="lib.js"></script>';
    });

    serverConfig.mode = 'development';
    const serverCompiler = webpack(serverConfig);
    const serverWatching = serverCompiler.watch({
        /* watchOptions */
    }, (err, stats) => {
        if (stats.hasErrors()) {
            console.error(stats.toString());
        } else if (stats.hasWarnings()) {
            console.warn(stats.toString());
        } else {
            console.info(stats.toString());
        }
    });
}
