const WEBPACK_CONFIG_FILE = process.env.WEBPACK_CONFIG_FILE || 'webpack.config.js';
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
    const mfs = new MemoryFS();
    const {
        JSDOM
    } = Npm.require('jsdom');
    const compilerCache = {};
    return {

        constructNewCompilerForTarget(compilerCache, targetPlatform, targetFile) {

            let allWebpackConfigs = requireFromString(targetFile.getContentsAsString());
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

                function resolveExternals(context, request, callback) {
                    return resolveMeteor(request, callback) ||
                        callback();
                }

                function resolveMeteor(request, callback) {
                    //fix for typescript
                    request = request.replace('@types/', '');
                    var match = request.match(/^meteor\/(.+)$/);
                    var package = match && match[1];
                    if (package) {
                        callback(null, `Package['${package}']`);
                        return true;
                    }
                };
                const webpackPackageJson = Npm.require('webpack/package.json');
                if (webpackPackageJson.version.split('.')[0] > 3){
                    webpackConfig.mode = process.NODE_ENV == 'production' ? 'production' : 'development';
                }
                webpackConfig.externals = webpackConfig.externals || [];
                webpackConfig.externals.push(resolveExternals);
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

            //If source hash doesn't match the previous hash, clean the cache.
            if(compilerCache.hash !== sourceHash){
                compilerCache.hash = sourceHash;
                delete compilerCache['web'];
                delete compilerCache['node'];
            }

            const targetPlatform = targetFile.getArch().includes('web') ? 'web' : 'node';

            if (typeof compilerCache[targetPlatform] === 'undefined'
                && !this.constructNewCompilerForTarget(compilerCache, targetPlatform, targetFile)) {
                return;
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
                assets: true,
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
            const { assets, chunks } = stats.toJson(chunkOnlyConfig);
            const outFs = compiler.outputFileSystem;

            if(targetPlatform !== 'node'){
                const indexPath = path.join(compiler.outputPath, "index.html");
                let existsIndexHtml = outFs.existsSync(indexPath);
                for(const asset of assets){
                    const filePath = asset.name;
                    const absoluteFilePath = path.join(compiler.outputPath, filePath);
                    const data = outFs.readFileSync(absoluteFilePath, 'utf8');
                    const hash = asset.chunks[0] && chunks[asset.chunks[0]] && chunks[asset.chunks[0]].hash;
                    if(filePath.endsWith('index.html')){
                        const {
                            window: {
                                document
                            }
                        } = new JSDOM(data.split('<script').join('<script async'));
                        targetFile.addHtml({
                            data: document.head.innerHTML,
                            section: 'head'
                        });
                        targetFile.addHtml({
                            data: document.body.innerHTML,
                            section: 'body'
                        });
                    }else if(!existsIndexHtml && filePath.endsWith('.js')){
                        targetFile.addJavaScript({
                            path: filePath,
                            hash,
                            data,
                            bare: true
                        });
                    }else if(!existsIndexHtml && filePath.endsWith('.css')){
                        targetFile.addStylesheet({
                            path: filePath,
                            hash,
                            data
                        })
                    }else{                
                        targetFile.addAsset({
                            path: filePath,
                            hash,
                            data
                        });
                    }
                }
            }else{
                for (const chunk of chunks) {
                    for (const filePath of chunk.files) {
                        const absoluteFilePath = path.join(compiler.outputPath, filePath);
                        let data = 'const require = Npm.require;';
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
    }
});