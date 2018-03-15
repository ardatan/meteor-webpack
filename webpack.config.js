const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const clientConfig = {
    target: 'web',
    entry: ['./client/main.js', 'webpack-hot-middleware/client'],
    devtool: 'inline-source-map',
    devServer: {
        hot: true
    },
    output: {
        publicPath: '/'
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new HtmlWebpackPlugin()
    ],
    externals: [
        resolveExternals
    ]
};

const serverConfig = {
    target: 'node',
    entry: ['./server/main.js'],
    devtool: 'inline-source-map',
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