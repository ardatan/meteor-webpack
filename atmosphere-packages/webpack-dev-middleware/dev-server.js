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
        webpackConfig.externals = webpackConfig.externals || [];


        function resolveExternals(context, request, callback) {
            return resolveMeteor(request, callback) ||
                callback();
        }

        function resolveMeteor(request, callback) {
            var match = request.match(/^meteor\/(.+)$/);
            var package = match && match[1];
            if (package) {
                callback(null, `Package['${package}']`);
                return true;
            }
        };
        webpackConfig.externals.push(resolveExternals);
        webpackConfig.context = projectPath;
        if (webpackConfig.entry instanceof Array || typeof webpackConfig.entry === 'string') {
            if (!(webpackConfig.entry instanceof Array)) {
                webpackConfig.entry = [webpackConfig.entry];
            }
            webpackConfig.entry = {
                app: webpackConfig.entry
            };
        }
        for (const key in webpackConfig.entry) {
            webpackConfig.entry[key].push('webpack-hot-middleware/client');
        }

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
                            data.dynamicHead = window.document.head.innerHTML.split('src').join('async src');
                            data.dynamicBody = window.document.body.innerHTML.split('src').join('async src');
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