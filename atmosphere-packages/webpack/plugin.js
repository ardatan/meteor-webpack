Plugin.registerCompiler({
    extensions: ['js', 'jsx', 'ts', 'tsx', 'html'],
}, function () {

    const path = Npm.require('path');
    const requireFromString = Npm.require('require-from-string');
    let webpack;
    try{
        webpack = Npm.require('webpack');
    }catch(e){
        console.log('You have to install webpack to use this package!')
    }
    const MemoryFS = Npm.require('memory-fs');
    const {
        JSDOM
    } = Npm.require('jsdom');
    const compilerCacheHashMap = {};
    return {

        constructNewCompilerForTarget(targetPlatform, targetFile) {

            let allWebpackConfigs = requireFromString(targetFile.getContentsAsString());
            if (!(allWebpackConfigs instanceof Array)) {
                allWebpackConfigs = [allWebpackConfigs];
            }

            let webpackConfig = allWebpackConfigs.find(webpackConfig => {
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
                return;
            }

            if (webpackConfig) {

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
                webpackConfig.mode = process.NODE_ENV == 'production' ? 'production' : 'development';
                webpackConfig.externals = webpackConfig.externals || [];
                webpackConfig.externals.push(resolveExternals);
                compilerCache[targetPlatform] = webpack(webpackConfig);
                compilerCache[targetPlatform].outputFileSystem = new MemoryFS();
            }
        },
        processFilesForTarget(inputFiles) {

            //Find Webpack Configuration File
            const targetFile = inputFiles.find(inputFile => inputFile.getPathInPackage().includes('webpack.config'));
            //Get source hash in order to check if configuration is changed.
            const sourceHash = targetFile.getSourceHash();
            //If source hash doesn't match the previous hash, clean the cache.

            compilerCacheHashMap[sourceHash] = compilerCacheHashMap[sourceHash] || {};

            const compilerCache = compilerCacheHashMap[sourceHash];

            const targetPlatform = targetFile.getArch().includes('web') ? 'web' : 'node';

            if (typeof compilerCache[targetPlatform] === 'undefined') {
                this.constructNewCompilerForTarget(targetPlatform, targetFile)
            }

            if (compilerCache[targetPlatform] == null) {
                return;
            } else {
                targetFile = inputFiles.find(inputFile => inputFile.getPathInPackage().includes('webpack.config.js'));
            }

            const compiler = compilerCache[targetPlatform];
            const stats = new Promise((resolve, reject) => compiler.run((err, stats) => {
                if (err) {
                    reject(err);
                }
                if (stats) {
                    console.log(stats.toString({
                        colors: true
                    }));
                }
                resolve(stats);
            })).await();
            const chunkOnlyConfig = {
                assets: false,
                cached: false,
                children: false,
                chunks: true,
                chunkModules: false,
                chunkOrigins: false,
                errorDetails: false,
                hash: true,
                modules: false,
                reasons: false,
                source: false,
                timings: false,
                version: false
            };
            const chunks = stats.toJson(chunkOnlyConfig).chunks;
            const outFs = compiler.outputFileSystem;

            if(targetPlatform !== 'node'){
                const indexPath = path.join(compiler.outputPath, "index.html");
                if (outFs.existsSync(indexPath)) {
                    let data = outFs.readFileSync(indexPath, 'utf8')
                    data = data.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ");
                    const {
                        window: {
                            document
                        }
                    } = new JSDOM(data);
                    targetFile.addHtml({
                        data: document.head.innerHTML,
                        section: 'head'
                    });
                    targetFile.addHtml({
                        data: document.body.innerHTML,
                        section: 'body'
                    });
                }
            }

            for (const chunk of chunks) {
                for (const filePath of chunk.files) {
                    const absoluteFilePath = path.join(compiler.outputPath, filePath);
                    let data = '';
                    if (targetPlatform == 'node') {
                        data = 'const require = Npm.require;'
                    }
                    data += outFs.readFileSync(absoluteFilePath, 'utf8');
                    if (chunk.initial && filePath.endsWith('.js')) {
                            targetFile.addJavaScript({
                                path: filePath,
                                hash: chunk.hash,
                                data,
                                bare: true
                            });
                    } else {                          
                            targetFile.addAsset({
                                path: filePath,
                                hash: chunk.hash,
                                data
                            });
                        }
                    }
                }


        }
    }
});