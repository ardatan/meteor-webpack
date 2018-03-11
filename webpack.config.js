module.exports = {
    entry: './app.js',
    output: {
        filename: 'bundle.js'
    },
    devServer: {
        compress: true,
        port: 9000
    }
};