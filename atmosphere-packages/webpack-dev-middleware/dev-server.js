

const path = Npm.require('path');
const projectPath = path.resolve('.').split(path.sep + '.meteor')[0];

function interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj.default : obj;
}

function isMultiCompiler(compiler) {
    // Duck typing as `instanceof MultiCompiler` fails when npm decides to
    // install multiple instances of webpack.
    return compiler && compiler.compilers;
}

function findCompiler(multiCompiler, name) {
    return multiCompiler.compilers.filter(compiler => compiler.name.indexOf(name) === 0);
}

function findStats(multiStats, name) {
    return multiStats.stats.filter(stats => stats.compilation.name.indexOf(name) === 0);
}

function getFilename(serverStats, outputPath, chunkName) {
    const assetsByChunkName = serverStats.toJson().assetsByChunkName;
    let filename = assetsByChunkName[chunkName] || '';
    // If source maps are generated `assetsByChunkName.main`
    // will be an array of filenames.
    return path.join(
        outputPath,
        Array.isArray(filename)
            ? filename.find(asset => /\.js$/.test(asset))
            : filename
    );
}

function installSourceMapSupport(fs) {
    const sourceMapSupport = Npm.require(path.join(projectPath, 'node_modules/source-map-support'));
    sourceMapSupport.install({
        // NOTE: If https://github.com/evanw/node-source-map-support/pull/149
        // lands we can be less aggressive and explicitly invalidate the source
        // map cache when Webpack recompiles.
        emptyCacheBetweenOperations: true,
        retrieveFile(source) {
            try {
                return fs.readFileSync(source, 'utf8');
            } catch (ex) {
                // Doesn't exist
            }
        }
    });
}

/**
 * Passes the request to the most up to date 'server' bundle.
 * NOTE: This must be mounted after webpackDevMiddleware to ensure this
 * middleware doesn't get called until the compilation is complete.
 * @param   {MultiCompiler} multiCompiler                  e.g webpack([clientConfig, serverConfig])
 * @options {String}        options.chunkName              The name of the main server chunk.
 * @return  {Function}                                     Middleware fn.
 */
function webpackHotServerMiddleware(multiCompiler) {
    const debug = Npm.require(path.join(projectPath, 'node_modules/debug'))('webpack-hot-server-middleware');
    debug('Using webpack-hot-server-middleware');

    if (!isMultiCompiler(multiCompiler)) {
        throw new Error(`Expected webpack compiler to contain both a 'client' and/or 'server' config`);
    }

    const serverCompiler = findCompiler(multiCompiler, 'server')[0];
    const clientCompilers = findCompiler(multiCompiler, 'client');

    if (!serverCompiler) {
        throw new Error(`Expected a webpack compiler named 'server'`);
    }
    if (!clientCompilers.length) {
        debug(`Cannot find webpack compiler named 'client'. Starting without client compiler`);
    }

    const outputFs = serverCompiler.outputFileSystem;
    const outputPath = serverCompiler.outputPath;

    installSourceMapSupport(outputFs);

    let error = false;

    const doneHandler = (multiStats) => {
        error = false;
        const serverStats = findStats(multiStats, 'server')[0];
        // Server compilation errors need to be propagated to the client.
        if (serverStats.compilation.errors.length) {
            error = serverStats.compilation.errors[0];
            return;
        }

        let clientStatsJson = null;

        if (clientCompilers.length) {
            const clientStats = findStats(multiStats, 'client');
            clientStatsJson = clientStats.map(obj => obj.toJson());
            
            if (clientStatsJson.length === 1) {
                clientStatsJson = clientStatsJson[0];
            }
        }

        const filename = getFilename(serverStats, outputPath, 'main');
        const buffer = outputFs.readFileSync(filename);
        Meteor.server.method_handlers = {};
        Meteor.server.publish_handlers = {};
        try{
            const requireFromString =Npm.require(path.join(projectPath, 'node_modules/require-from-string'));
            interopRequireDefault(
                requireFromString(buffer.toString(),filename)
            );
        }catch(e){
            console.log(e)
        }
    };

    if (multiCompiler.hooks) {
        // Webpack 4
        multiCompiler.hooks.done.tap('WebpackHotServerMiddleware', Meteor.bindEnvironment(doneHandler));
    } else {
        // Webpack 3
        multiCompiler.plugin('done', doneHandler);
    }

    return function (req, res, next) {
        next();
    };
}


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

function arrangeConfig(webpackConfig){
    if (!(webpackConfig instanceof Array)) {
        webpackConfig = [webpackConfig];
    }
    for(const singleWebpackConfig of webpackConfig){
        singleWebpackConfig.mode = 'development';
        singleWebpackConfig.externals = webpackConfig.externals || [];
        singleWebpackConfig.externals.push(resolveExternals);
        singleWebpackConfig.context = projectPath;
        singleWebpackConfig.name = singleWebpackConfig.target == 'node' ? 'server' : 'client';
        if(singleWebpackConfig.target !== 'node' && singleWebpackConfig.devServer && singleWebpackConfig.devServer.hot){
            if (singleWebpackConfig.entry instanceof Array || typeof singleWebpackConfig.entry === 'string') {
                if (!(singleWebpackConfig.entry instanceof Array)) {
                    singleWebpackConfig.entry = [singleWebpackConfig.entry];
                }
                singleWebpackConfig.entry = {
                    app: singleWebpackConfig.entry
                };
            }
            //singleWebpackConfig.devServer.serverSideRender = true;
            for (const key in singleWebpackConfig.entry) {
                singleWebpackConfig.entry[key].push('webpack-hot-middleware/client');
            }
        }
    }
    return webpackConfig;
}

if (Meteor.isServer && Meteor.isDevelopment) {
    const webpack = Npm.require(path.join(projectPath, 'node_modules/webpack'))
    const webpackConfig = arrangeConfig(Npm.require(path.join(projectPath, 'webpack.config.js')));

    if (webpackConfig) {
        const webpackDevMiddleware = Npm.require(path.join(projectPath, 'node_modules/webpack-dev-middleware'));

        const compiler = webpack(webpackConfig);
        // Tell Meteor to use the webpack-dev-middleware and use the webpack.config.js
        // configuration file as a base.
        const clientConfig = webpackConfig.find(singleWebpackConfig => (singleWebpackConfig.target !== 'node'))
        const serverConfig = webpackConfig.find(singleWebpackConfig => (singleWebpackConfig.target == 'node'))
        const devMiddlewareInstance = webpackDevMiddleware(compiler, clientConfig.devServer);
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
        if (clientConfig && clientConfig.devServer && clientConfig.devServer.hot) {
            const webpackHotMiddleware = Npm.require(path.join(projectPath, 'node_modules/webpack-hot-middleware'));
            WebApp.connectHandlers.use(webpackHotMiddleware(compiler.compilers.find(compiler => (compiler.name == 'client'))));
        }
        if(serverConfig && serverConfig.devServer && serverConfig.devServer.hot){
            WebApp.connectHandlers.use(Meteor.bindEnvironment(webpackHotServerMiddleware(compiler)));
        }

    }

}