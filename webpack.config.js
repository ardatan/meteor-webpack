const webpack = require('webpack');
const clientConfig = {
    target: 'web',
    entry: ['./client/main.js', 'webpack-hot-middleware/client'],
    devtool: 'inline-source-map',
    devServer: {
        hot: true
    },
    output: {
        filename: 'main.js',
        publicPath: '/'
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin()
    ],
    externals: [
        resolveExternals
    ]
};

const serverConfig = {
    target: 'node',
    entry: ['./server/main.js', './server/dev-server.js'],
    devtool: 'inline-source-map',
    output: {
        filename: 'bundle.js'
    },
    externals: [
        resolveExternals
    ]
};

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

module.exports = [clientConfig, serverConfig];