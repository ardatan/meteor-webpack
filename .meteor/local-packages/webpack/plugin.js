const webpack = Npm.require('webpack');
const MemoryFS = Npm.require('memory-fs');
const path = Npm.require('path');
const requireFromString = Npm.require('require-from-string');
const { JSDOM } = Npm.require('jsdom');
Plugin.registerCompiler({
    extensions: ['js', 'jsx', 'html'],
}, function () {
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
                            if (process.env.NODE_ENV !== 'production' && webpackConfig.devServer) {
                                return false;
                            } else {
                                return true;
                            }
                        } else {
                            return false;
                        }
                    } else if (targetPlatform == 'web') {
                        if (process.env.NODE_ENV !== 'production' && webpackConfig.devServer) {
                            return false;
                        } else {
                            return true;
                        }
                    }
                })
            }
            if (!webpackConfig) {
                return;
            }
            webpackConfig.mode = process.env.NODE_ENV == 'production' ? 'production' : 'development';
            const compiler = webpack(webpackConfig);
            const outFs = new MemoryFS();
            compiler.outputFileSystem = outFs;
            new Promise((resolve, reject) => compiler.run((err, stats) => {
                if (err) {
                    reject(err);
                }
                if (stats) {
                    console.log(stats.toString({
                        colors: true
                    }));
                }
                resolve();
            })).await();
            const indexHtmlFilePath = path.join(compiler.outputPath, 'index.html');
            if (targetPlatform == 'web' && outFs.existsSync(indexHtmlFilePath)) {
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
                outFs.readdirSync(compiler.outputPath).forEach((outputFilePath, key) => {
                    const absoluteFilePath = path.join(compiler.outputPath, outputFilePath);
                    targetFile.addAsset({
                        path: outputFilePath,
                        data: outFs.readFileSync(absoluteFilePath, 'utf8')
                    });
                })
            } else {
                outFs.readdirSync(compiler.outputPath).forEach((outputFilePath, key) => {
                    if (outputFilePath.endsWith('.js')) {
                        const absoluteFilePath = path.join(compiler.outputPath, outputFilePath);
                        targetFile.addJavaScript({
                            path: outputFilePath,
                            data: outFs.readFileSync(absoluteFilePath, 'utf8')
                        });
                    }
                })
            }

        }
    }
});