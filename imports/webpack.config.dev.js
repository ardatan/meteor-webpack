const path = require('path');

const CleanWebpackPlugin = require('clean-webpack-plugin');
const webpack = require('webpack');

const projectPath = path.resolve('.').split(path.sep + '.meteor')[0];

const clientConfig = {
    context: projectPath,
    entry: ['./imports/client/index.js', 'webpack-hot-middleware/client'],
    externals: [
        resolveExternals
    ],
    devtool: 'inline-source-map',
    devServer: {
        contentBase: './client',
        hot: true,
        host: 'localhost'
    },
    plugins: [
        // OccurenceOrderPlugin is needed for webpack 1.x only
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.NamedModulesPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        // Use NoErrorsPlugin for webpack 1.x
        new webpack.NoEmitOnErrorsPlugin()
    ],
    output: {
        path: path.resolve(projectPath, 'client/build'),
        chunkFilename: '../../public/build/[name].lib.js',
        filename: 'lib.js',
        publicPath: '/'
    }
};

const serverConfig = {
    target: 'node',
    context: projectPath,
    entry: ['./imports/server/index.js'],
    externals: [
        resolveExternals
    ],
    plugins: [
        new CleanWebpackPlugin(['server/build']),
    ],
    devtool: 'inline-source-map',
    output: {
        path: path.resolve(projectPath, 'server/build'),
        filename: 'lib.node.js'
    }
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