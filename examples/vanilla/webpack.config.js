const webpack = require('webpack');
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
            template: './client/index.html'
        })
    ]
};

const serverConfig = {
    target: 'node',
    entry: './server/main.js',
    devtool: 'inline-source-map'
};

module.exports = [clientConfig, serverConfig];