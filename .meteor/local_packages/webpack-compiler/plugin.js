const webpack = Npm.require('webpack');
const MemoryFS = Npm.require('memory-fs');
Plugin.registerCompiler({
    extensions: ['js']
}, () => { return { processFilesForTarget() { } } });
Plugin.registerCompiler({
    filenames: ['webpack.config.js']
}, () => {
    return {
        processFilesForTarget(inputFiles) {
            const compiler = webpack({
                context: process.cwd(),
                entry: './app.js',
                output: {
                    path: '/dist',
                    filename: 'bundle.js'
                }
            });
            const fs = new MemoryFS();
            compiler.outputFileSystem = fs;
            new Promise((resolve, reject) => {
                compiler.run((err, stats) => {
                    // Read the output later:
                    resolve();
                });
            }).await()
            inputFiles[0].addJavaScript({
                path: '/dist/bundle.js',
                data: fs.readFileSync('/dist/bundle.js').toString()
            });
        }
    };
});
