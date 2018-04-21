const webpack = require('webpack');
const path = require('path');
const nodeExternals = require('webpack-node-externals');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const clientConfig = {
    target: 'web',
    entry: './client/main.js',
    devtool: 'inline-source-map',
    devServer: {
        hot: true
    },
    output: {
        publicPath: '/'
    },
    plugins: [
        new webpack.HotModuleReplacementPlugin(),
        new HtmlWebpackPlugin({
            template: './client/index.html',
            hash: true
        })
    ]
};

const serverConfig = {
    target: 'node', // in order to ignore built-in modules like path, fs, etc.
    externals: [nodeExternals()], // in order to ignore all modules in node_modules folder
    entry: './server/main.js',
    devServer: {
        hot: true
    },
};

module.exports = [clientConfig, serverConfig];