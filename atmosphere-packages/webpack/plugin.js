const WEBPACK_CONFIG_FILE = process.env.WEBPACK_CONFIG_FILE || 'webpack.config.js';
const ENABLE_LEGACY_BUILD = process.env.ENABLE_LEGACY_BUILD || false;
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

            // Disable legacy builds in development
            const arch = targetFile.getArch()
            if(arch === 'web.browser.legacy' && !ENABLE_LEGACY_BUILD && process.env.NODE_ENV === 'development') {
                return
            }

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

            let assets;
            const {
                compilation
            } = new Promise((resolve, reject) => {
                if (compiler.hooks.assetEmitted /* Webpack 5 */) {
                    assets = {};
                    compiler.hooks.assetEmitted.tap('meteor-webpack', (path, { content }) => {
                        assets[path] = { source() { return content } };
                    });
                }
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

            assets = (assets || compilation.assets);

            const existsIndexHtml = 'index.html' in assets;
            let indexDoc;
            const jsFiles = {};
            for (const path in assets) {
                const asset = assets[path];
                const source = asset.source();
                if (existsIndexHtml) {
                    const data = source.toString('utf8');
                    if (path.endsWith('index.html')) {
                        const {
                            window: {
                                document
                            }
                        } = new JSDOM(data);
                        indexDoc = document;
                    } else if (path.endsWith('.js')) {
                        jsFiles[path] = {
                            main: false,
                            data: source.toString('utf8')
                        };
                    } else {
                        targetFile.addAsset({
                            path,
                            data: source
                        });
                    }
                } else {
                    if (path.endsWith('.js')) {
                        let data = source.toString('utf8');
                        if (targetPlatform == 'node') {
                            data = 'const require = Npm.require;' + data;
                        }
                        targetFile.addJavaScript({
                            path,
                            data,
                            bare: true
                        });
                    } else if (path.endsWith('.css')) {
                        const data = source.toString('utf8');
                        targetFile.addStylesheet({
                            path,
                            data
                        })
                    } else {
                        targetFile.addAsset({
                            path,
                            data: source
                        });
                    }
                }

            }
            if (existsIndexHtml) {
                const scriptElems = indexDoc.querySelectorAll('script[src]');
                let cnt = -1;
                for (const scriptElem of scriptElems) {
                    const srcPath = scriptElem.src;
                    for (const path in jsFiles) {
                        if (srcPath.includes(path)) {
                            jsFiles[path].main = true;
                            scriptElem.remove();
                        }
                    }
                }
                for (const path in jsFiles) {
                    const {
                        main,
                        data
                    } = jsFiles[path];
                    if (main) {
                        targetFile.addJavaScript({
                            path,
                            data,
                            bare: true
                        });
                    } else {
                        targetFile.addAsset({
                            path,
                            data
                        });
                    }
                }
                targetFile.addHtml({
                    data: indexDoc.head.innerHTML,
                    section: 'head'
                });
                targetFile.addHtml({
                    data: indexDoc.body.innerHTML,
                    section: 'body'
                });
            }


        }
    }
});
