

if (Meteor.isServer && Meteor.isDevelopment) {
    const path = Npm.require('path');

    const webpack = Npm.require('webpack');
    const webpackDevMiddleware = Npm.require('webpack-dev-middleware');
    const webpackHotMiddleware = Npm.require('webpack-hot-middleware');
    const allWebpackConfigs = Npm.require('../../../../../../../webpack.config.js');
    let webpackConfig;
    if (allWebpackConfigs instanceof Array) {
        const target = 'web';
        webpackConfig = allWebpackConfigs.find(webpackConfig => {
            if (webpackConfig.target) {
                if (webpackConfig.target == target) {
                    if (webpackConfig.devServer) {
                        return true;
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            } else {
                if (webpackConfig.devServer) {
                    return true;
                } else {
                    return false;
                }
            }
        })
    } else {
        webpackConfig = allWebpackConfigs;
    }

    if (webpackConfig) {
        const projectPath = path.resolve('.').split(path.sep + '.meteor')[0];

        webpackConfig.mode = 'development';
        webpackConfig.context = projectPath;

        const compiler = webpack(webpackConfig);

        // Tell Meteor to use the webpack-dev-middleware and use the webpack.config.js
        // configuration file as a base.
        WebApp.connectHandlers.use(webpackDevMiddleware(compiler, webpackConfig.devServer));
        if (webpackConfig.devServer.hot) {
            WebApp.connectHandlers.use(webpackHotMiddleware(compiler));
        }
        WebAppInternals.registerBoilerplateDataCallback('webpack', (request, data, arch) => {
            data.dynamicBody = data.dynamicBody || '';
            data.dynamicBody = +`<script defer src="main.js"></script>`;
        });
    }

}