Plugin.registerCompiler({
    extensions: ['js', 'jsx', 'html'],
}, function () {
    const path = Npm.require('path');
    const requireFromString = Npm.require('require-from-string');
    const webpack = Npm.require('webpack');
    const MemoryFS = Npm.require('memory-fs');
    const { JSDOM } = Npm.require('jsdom');
    return {
        processFilesForTarget(inputFiles) {
            const targetFile = inputFiles.find(inputFile => inputFile.getPathInPackage().endsWith('webpack.config.js'));
            const targetPlatform = targetFile.getArch().includes('web') ? 'web' : 'node';

            const allWebpackConfigs = requireFromString(targetFile.getContentsAsString());
            let webpackConfig;
            if (allWebpackConfigs instanceof Array) {
                webpackConfig = allWebpackConfigs.find(webpackConfig => {
                    if (webpackConfig.target) {
                        if (webpackConfig.target == targetPlatform) {
                            return true
                        } else {
                            return false;
                        }
                    } else if (targetPlatform == 'web') {
                        return true;
                    }
                })
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
            webpackConfig.mode = process.env.NODE_ENV == 'production' ? 'production' : 'development';
            webpackConfig.externals = webpackConfig.externals || [];
            webpackConfig.externals.push(resolveExternals);
            const compiler = webpack(webpackConfig);
            if (!(webpackConfig.target == 'web' && webpackConfig.mode !== 'production' && webpackConfig.devServer)) {
                const outFs = new MemoryFS();
                compiler.outputFileSystem = outFs;
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
                    hash: false,
                    modules: false,
                    reasons: false,
                    source: false,
                    timings: false,
                    version: false
                };
                const chunks = stats.toJson(chunkOnlyConfig).chunks;
                const indexHtmlFilePath = path.join(compiler.outputPath, 'index.html');
                if (webpackConfig.target == 'web' && outFs.existsSync(indexHtmlFilePath)) {
                    let indexHtmlFileContent = outFs.readFileSync(indexHtmlFilePath, 'utf8');
                    // Load every JavaScript file after Meteor's Client Bundle load
                    indexHtmlFileContent = indexHtmlFileContent.replace('src', 'async src');
                    const { window: { document } } = new JSDOM(indexHtmlFileContent);
                    targetFile.addHtml({
                        data: document.head.innerHTML,
                        section: 'head'
                    });
                    targetFile.addHtml({
                        data: document.body.innerHTML,
                        section: 'body'
                    });
                    //serve all files without adding Meteor's Bundler
                    for (const chunk of chunks) {
                        for (const filePath of chunk.files) {
                            const absoluteFilePath = path.join(compiler.outputPath, filePath);
                            const data = outFs.readFileSync(absoluteFilePath, 'utf8');
                            targetFile.addAsset({
                                path: filePath,
                                hash: chunk.hash,
                                data
                            });
                        }
                    }
                } else {
                    for (const chunk of chunks) {
                        for (const filePath of chunk.files) {
                            const absoluteFilePath = path.join(compiler.outputPath, filePath);
                            const data = outFs.readFileSync(absoluteFilePath, 'utf8');
                            if (chunk.initial) {
                                targetFile.addJavaScript({
                                    path: filePath,
                                    hash: chunk.hash,
                                    data
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
    }
});