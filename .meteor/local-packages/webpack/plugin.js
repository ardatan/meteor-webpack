const webpack = Npm.require('webpack');
const MemoryFS = Npm.require('memory-fs');
const path = Npm.require('path');
const requireFromString = Npm.require('require-from-string');
Plugin.registerCompiler({
    extensions: ['js', 'jsx', 'html'],
}, function () {
    return {
        processFilesForTarget(inputFiles) {
            const targetFile = inputFiles.find(inputFile => inputFile.getPathInPackage().endsWith('webpack.config.js'));
            const allWebpackConfigs = requireFromString(targetFile.getContentsAsString());
            let webpackConfig;
            if (allWebpackConfigs instanceof Array) {
                const target = targetFile.getArch().includes('web') ? 'web' : 'node';
                webpackConfig = allWebpackConfigs.find(webpackConfig => {
                    if (webpackConfig.target) {
                        if (webpackConfig.target == target) {
                            if (process.env.NODE_ENV !== 'production' && webpackConfig.devServer) {
                                return false;
                            } else {
                                return true;
                            }
                        } else {
                            return false;
                        }
                    } else if (target == 'web') {
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
            outFs.readdirSync(compiler.outputPath).forEach((outputFilePath, key) => {
                if (outputFilePath.endsWith('.js')) {
                    const absoluteFilePath = path.join(compiler.outputPath, outputFilePath);
                    targetFile.addJavaScript({
                        path: outputFilePath,
                        data: outFs.readFileSync(absoluteFilePath, 'utf8')
                    })
                    const absoluteSourceMapFilePath = path.join(compiler.outputPath, outputFilePath + '.map');
                    if (outFs.existsSync(absoluteSourceMapFilePath)) {
                        targetFile.addAsset({
                            path: outputFilePath + '.map',
                            data: outFs.readFileSync(absoluteSourceMapFilePath, 'utf8')
                        })
                    }
                }
            })
        }
    }
});