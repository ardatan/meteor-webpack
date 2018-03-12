const webpack = Npm.require('webpack');
const MemoryFS = Npm.require('memory-fs');
const path = Npm.require('path');
const requireFromString = Npm.require('require-from-string');
Plugin.registerCompiler({
    extensions: ['js', 'jsx'],
}, function () {
    return {
        processFilesForTarget(inputFiles) {
            let targetFile;
            let webpackConfig;
            for (const inputFile of inputFiles) {
                if (inputFile.getPathInPackage().includes('webpack.config.js')) {
                    webpackConfig = requireFromString(inputFile.getContentsAsString());
                    if (webpackConfig instanceof Array) {
                        const [clientConfig, serverConfig] = webpackConfig
                        if (inputFile.getArch().includes('web')) {
                            webpackConfig = clientConfig;
                            if (process.env.NODE_ENV !== 'production' && webpackConfig.devServer) {
                                return;
                            }
                        } else {
                            webpackConfig = serverConfig;
                        }
                    }
                    //webpackConfig.mode = process.env.NODE_ENV;
                    targetFile = inputFile;
                    break;
                }
            }
            const compiler = webpack(webpackConfig);
            const outFs = new MemoryFS();
            compiler.outputFileSystem = outFs;
            new Promise((resolve, reject) => compiler.run((err, stats) => {
                if (err) {
                    reject(err);
                }
                if (stats) {
                    console.log(stats.toString())
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