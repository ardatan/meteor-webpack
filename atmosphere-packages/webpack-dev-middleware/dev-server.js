if (Meteor.isServer && Meteor.isDevelopment) {
    const path = Npm.require('path');

    const webpack = require('webpack');
    let allWebpackConfigs = Npm.require('../../../../../../webpack.config.js');

    if (!(allWebpackConfigs instanceof Array)) {
        allWebpackConfigs = [allWebpackConfigs];
    }

    let webpackConfig = allWebpackConfigs.find(webpackConfig => {
        if (webpackConfig.target) {
            if (webpackConfig.target == 'web') {
                return true;
            } else {
                return false;
            }
        } else {
            return true;
        }
    })

    if (webpackConfig && webpackConfig.devServer) {
        const webpackDevMiddleware = require('webpack-dev-middleware');
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

        if (webpackConfig.devServer && webpackConfig.devServer.hot) {

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
        }

        const compiler = webpack(webpackConfig);
        // Tell Meteor to use the webpack-dev-middleware and use the webpack.config.js
        // configuration file as a base.
        const devMiddlewareInstance = webpackDevMiddleware(compiler, webpackConfig.devServer);
        const HEAD_REGEX = /<head[^>]*>((.|[\n\r])*)<\/head>/im
        const BODY_REGEX = /<body[^>]*>((.|[\n\r])*)<\/body>/im;
        WebApp.connectHandlers.use((req, res, next) => {
            devMiddlewareInstance(req, {
                end(content) {
                    if (/<[a-z][\s\S]*>/i.test(content) && !req.url.includes('.js')) {
                        WebAppInternals.registerBoilerplateDataCallback('webpack', (req, data) => {
                            const head = HEAD_REGEX.exec(content)[1];
                            data.dynamicHead = data.dynamicHead || '';
                            data.dynamicHead += head.split('src').join('defer src');
                            const body = BODY_REGEX.exec(content)[1];
                            data.dynamicBody = data.dynamicBody || '';
                            data.dynamicBody += body.split('src').join('defer src');
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
            const webpackHotMiddleware = require('webpack-hot-middleware');
            WebApp.connectHandlers.use(webpackHotMiddleware(compiler));
        }
    }

}