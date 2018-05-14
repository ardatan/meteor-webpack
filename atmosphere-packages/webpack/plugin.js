const WEBPACK_CONFIG_FILE = process.env.WEBPACK_CONFIG_FILE || 'webpack.config.js';
Plugin.registerCompiler({
    extensions: ['js', 'jsx', 'ts', 'tsx', 'html'],
}, function () {

    const path = Npm.require('path');
    const requireFromString = Npm.require('require-from-string');
    let webpack;
    try {
        webpack = Npm.require('webpack');
    } catch (e) {
        console.log('You have to install webpack to use this package!')
    }
    const MemoryFS = Npm.require('memory-fs');
    const mfs = new MemoryFS();
    const {
        JSDOM
    } = Npm.require('jsdom');
    const compilerCache = {
        sourceHashes: {}
    };
    return {

        constructNewCompilerForTarget(compilerCache, targetPlatform, targetFile) {
            let allWebpackConfigs = requireFromString(targetFile.getContentsAsString(), path.join(process.cwd(), './' + targetFile.getPathInPackage()), {
                prependPaths: [process.cwd()]
            });
            if (!(allWebpackConfigs instanceof Array)) {
                allWebpackConfigs = [allWebpackConfigs];
            }

            const webpackConfig = allWebpackConfigs.find(webpackConfig => {
                if (webpackConfig.target) {
                    if (webpackConfig.target == targetPlatform) {
                        return true;
                    } else {
                        return false;
                    }
                } else if (targetPlatform == 'web') {
                    return true;
                }
            })

            if (process.env.NODE_ENV !== 'production' && webpackConfig.devServer) {
                compilerCache[targetPlatform] = null;
                return false;
            }

            if (webpackConfig) {
                const webpackPackageJson = Npm.require('webpack/package.json');
                if (webpackPackageJson.version.split('.')[0] > 3) {
                    webpackConfig.mode = process.env.NODE_ENV == 'production' ? 'production' : 'development';
                }
                compilerCache[targetPlatform] = webpack(webpackConfig);
                compilerCache[targetPlatform].outputFileSystem = mfs;
                return true;
            }
        },
        processFilesForTarget(inputFiles) {

            //Find Webpack Configuration File
            const targetFile = inputFiles.find(inputFile => inputFile.getPathInPackage().endsWith(WEBPACK_CONFIG_FILE));
            //Get source hash in order to check if configuration is changed.
            const sourceHash = targetFile.getSourceHash();

            const targetPlatform = targetFile.getArch().includes('web') ? 'web' : 'node';

            //If source hash doesn't match the previous hash, clean the cache.
            if (compilerCache.sourceHashes[targetPlatform] !== sourceHash) {
                compilerCache.sourceHashes[targetPlatform] == sourceHash;
                delete compilerCache[targetPlatform];
            }

            if (!compilerCache[targetPlatform] &&
                !this.constructNewCompilerForTarget(compilerCache, targetPlatform, targetFile)) {
                return;
            }

            const compiler = compilerCache[targetPlatform];

            const {
                compilation
            } = new Promise((resolve, reject) => {
                compiler.hooks.done.tap('meteor-webpack', resolve)
                compiler.run((err, stats) => {
                    if (err) {
                        reject(err);
                    }
                    if (stats) {
                        console.log(stats.toString({
                            colors: true
                        }));
                    }
                });
            }).await();
            const {
                assets
            } = compilation;
            const existsIndexHtml = 'index.html' in assets;
            for (const path in assets) {
                const asset = assets[path];
                const data = asset.source();
                if (path.endsWith('index.html')) {
                    const {
                        window: {
                            document
                        }
                    } = new JSDOM(data.toString('utf8').split(' src="').join(' defer src="'));
                    targetFile.addHtml({
                        data: document.head.innerHTML,
                        section: 'head'
                    });
                    targetFile.addHtml({
                        data: document.body.innerHTML,
                        section: 'body'
                    });
                } else if (!existsIndexHtml && path.endsWith('.js')) {
                    targetFile.addJavaScript({
                        path,
                        data: 'const require = Npm.require;\n' + data.toString('utf8'),
                        bare: true
                    });
                } else if (!existsIndexHtml && path.endsWith('.css')) {
                    targetFile.addStylesheet({
                        path,
                        data: data.toString('utf8')
                    })
                } else {
                    targetFile.addAsset({
                        path,
                        data
                    });
                }
            }



        }
    }
});