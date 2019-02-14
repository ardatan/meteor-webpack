const WEBPACK_CONFIG_FILE = process.env.WEBPACK_CONFIG_FILE || 'webpack.config.js';
const DYNAMIC_ASSETS = process.env.DYNAMIC_ASSETS || false;
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
        Array.isArray(filename) ?
        filename.find(asset => /\.js$/.test(asset)) :
        filename
    );
}

function installSourceMapSupport(fs) {
    const sourceMapSupport = Npm.require('source-map-support');
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
        // Iterate across opened sessions
        for (const sessionId in Meteor.server.sessions) {
            if (!Meteor.server.sessions.hasOwnProperty(sessionId)) {
                continue;
            }
            
            // This is flag means that currently worker do processing message
            // and each receiving message over ddp will be cached in queue
            Meteor.server.sessions[sessionId].workerRunning = true;
        }

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

        /**
         * Delete all methods/publications that are set
         * by the code itself (e.g: anything defined by the developer)
         * so it can be re-injected on each hot-push,
         * but keep all handlers that are set by external packages
         * because they get injeted only on a "full" restart to the server.

         * For example if a publication is updated (Meteor.publish('todos')),
         * HMR cannot inject new publication without removing the existing one.
         */

        // Define a key that is likely to stay unique
        const handlersCache = '____webpack_handlers_cache_____'
        const handlers = Meteor.server[handlersCache]

        if (!handlers) {
            // This code will run only upon a "full" restart.
            // On this time, the handlers contains only methods/publications
            // that were set by external packages.

            // We cant store the functions (passed by reference) so store the keys and check for existence later.
            const oldMethodHandlers = Object.keys(Meteor.server.method_handlers)
            const oldPublishHandlers = Object.keys(Meteor.server.publish_handlers)

            Meteor.server[handlersCache] = {
                methods: oldMethodHandlers,
                publications: oldPublishHandlers
            }

        } else {
            // If we already cached the "constant" handlers, keep them and delete the rest

            for (const methodHandlerName in Meteor.server.method_handlers) {
                if (!handlers.methods.includes(methodHandlerName)) {
                    delete Meteor.server.method_handlers[methodHandlerName]
                }
            }

            for (const publishHandlerName in Meteor.server.publish_handlers) {
                if (!handlers.publications.includes(publishHandlerName)) {
                    delete Meteor.server.publish_handlers[publishHandlerName]
                }
            }
        }

        try {
            const requireFromString = Npm.require('require-from-string');
            interopRequireDefault(
                requireFromString(buffer.toString(), filename)
            );
        } catch (e) {
            console.log(e)
        } finally {
            // Iterate across opened sessions
            for (const sessionId in Meteor.server.sessions) {
                if (!Meteor.server.sessions.hasOwnProperty(sessionId)) {
                    continue;
                }
                
                // Reverted back flag to initial value
                Meteor.server.sessions[sessionId].workerRunning = false;
                // To replay cached messages need to send on processing some fake message
                Meteor.server.sessions[sessionId].processMessage({msg: 'test'});
            }
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

function arrangeConfig(webpackConfig) {
    if (!(webpackConfig instanceof Array)) {
        webpackConfig = [webpackConfig];
    }
    webpackConfig = webpackConfig.filter(singleWebpackConfig => singleWebpackConfig.devServer);
    for (const singleWebpackConfig of webpackConfig) {
        const webpackPackageJson = Npm.require(path.join(projectPath, 'node_modules/webpack/package.json'));
        if (webpackPackageJson.version.split('.')[0] > 3) {
            singleWebpackConfig.mode = 'development';
        }
        singleWebpackConfig.context = projectPath;
        singleWebpackConfig.name = singleWebpackConfig.target == 'node' ? 'server' : 'client';
        if (singleWebpackConfig.target !== 'node' && singleWebpackConfig.devServer && singleWebpackConfig.devServer.hot) {
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
                singleWebpackConfig.entry[key].push('webpack-hot-middleware/client?reload=true');
            }
        }
    }
    return webpackConfig;
}

if (Meteor.isServer && Meteor.isDevelopment && !Meteor.isTest && !Meteor.isAppTest) {
    const webpack = Npm.require(path.join(projectPath, 'node_modules/webpack'))
    const webpackConfig = arrangeConfig(Npm.require(path.join(projectPath, WEBPACK_CONFIG_FILE)));

    if (webpackConfig.length) {
        const webpackDevMiddleware = Npm.require(path.join(projectPath, 'node_modules/webpack-dev-middleware'));

        const compiler = webpack(webpackConfig);
        // Tell Meteor to use the webpack-dev-middleware and use the webpack.config.js
        // configuration file as a base.
        const clientConfig = webpackConfig.find(singleWebpackConfig => (singleWebpackConfig.target !== 'node'))
        const clientCompiler = compiler.compilers.find(compiler => (compiler.name == 'client'));
        const serverConfig = webpackConfig.find(singleWebpackConfig => (singleWebpackConfig.target == 'node'))
        clientConfig.devServer.contentBase = clientConfig.devServer.contentBase || clientCompiler.outputPath;
        clientConfig.devServer.publicPath = clientConfig.devServer.publicPath || (clientConfig.output && clientConfig.output.publicPath);
        const HEAD_REGEX = /<head[^>]*>((.|[\n\r])*)<\/head>/im
        const BODY_REGEX = /<body[^>]*>((.|[\n\r])*)<\/body>/im;
        const SCRIPT_REGEX = /<script type="text\/javascript" src="([^"]+)"><\/script>/gm
        const STYLE_REGEX = /<link href="([^"]+)" rel="stylesheet">/gm

        WebApp.rawConnectHandlers.use(webpackDevMiddleware(compiler, {
            index: false,
            ...clientConfig.devServer
        }));

        let head
        let body
        let css = []
        let js = []

        WebAppInternals.registerBoilerplateDataCallback('meteor/ardatan:webpack', (req, data) => {
            data.dynamicHead = data.dynamicHead || '';
            data.dynamicHead = head
            data.dynamicBody = data.dynamicBody || '';
            data.dynamicBody = body
            if(DYNAMIC_ASSETS) {
                data.js = data.js.concat(js)
                data.css = data.css.concat(css)
            }
        })

        compiler.hooks.done.tap('meteor-webpack', ({
            stats
        }) => {
            const {
                assets
            } = stats[0].compilation
            const index = clientConfig.devServer.index || 'index.html'
            const publicPath = clientConfig.output && clientConfig.output.publicPath || '/'

            if(assets[index]) {
                const content = assets[index].source()
                head = HEAD_REGEX.exec(content)[1];
                body = BODY_REGEX.exec(content)[1];
            }

            // Optional Merging assets into Meteor boilerplate
            // Use with `inject: false` option on HtmlWebpackPlugin
            if(DYNAMIC_ASSETS) {
                css = []
                js = []
                Object.keys(assets).forEach(key => {
                    const url = publicPath + key
                    if(key.endsWith('.js')) {
                        js.push({ url })
                    } else if(key.endsWith('.css')) {
                        css.push({ url })
                    }
                })
            }

            // Remove any whitespace at the end of the body or server-render will mangle the HTML output
            body = body.replace(/[\t\n\r\s]+$/, '')
        });
        if (clientConfig && clientConfig.devServer && clientConfig.devServer.hot) {
            const webpackHotMiddleware = Npm.require(path.join(projectPath, 'node_modules/webpack-hot-middleware'));
            WebApp.rawConnectHandlers.use(webpackHotMiddleware(clientCompiler));
        }
        if (serverConfig && serverConfig.devServer && serverConfig.devServer.hot) {
            WebApp.rawConnectHandlers.use(Meteor.bindEnvironment(webpackHotServerMiddleware(compiler)));
        }

    }

}
