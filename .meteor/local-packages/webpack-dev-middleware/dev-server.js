if (Meteor.isServer && Meteor.isDevelopment) {
    const path = Npm.require('path');

    const webpack = require('webpack');
    const webpackDevMiddleware = require('webpack-dev-middleware');
    const webpackHotMiddleware = require('webpack-hot-middleware');
    const { JSDOM } = require('jsdom');
    const allWebpackConfigs = Npm.require('../../../../../../webpack.config.js');
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
        const devMiddlewareInstance = webpackDevMiddleware(compiler, webpackConfig.devServer);
        WebApp.connectHandlers.use((req, res, next) => {
            devMiddlewareInstance(req, {
                end(content) {
                    if (content.includes('<html>')) {
                        WebAppInternals.registerBoilerplateDataCallback('webpack', (req, data) => {
                            const { window } = new JSDOM(content);
                            data.dynamicHead = window.document.head.innerHTML.replace('src', 'async src');
                            data.dynamicBody = window.document.body.innerHTML.replace('src', 'async src');
                        })
                        next();
                    } else {
                        res.end(content);
                    }
                },
                setHeader() {
                    //res.setHeader(...arguments);
                }
            }, next)
        });
        if (webpackConfig.devServer.hot) {
            WebApp.connectHandlers.use(webpackHotMiddleware(compiler));
        }
    }

}