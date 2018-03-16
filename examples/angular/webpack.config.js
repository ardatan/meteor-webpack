const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const clientConfig = {
    entry: './client/index.ts',
    devtool: 'inline-source-map',
    module: {
        rules: [{
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/
        }]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './client/index.html'
        })
    ],
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    output: {
        filename: 'bundle.js'
    }
};
const serverConfig = {
    entry: './server/index.ts',
    target: 'node',
    devtool: 'inline-source-map',
    module: {
        rules: [{
            test: /\.tsx?$/,
            use: 'ts-loader',
            exclude: /node_modules/
        }]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    output: {
        filename: 'bundle.js'
    }
}
module.exports = [clientConfig, serverConfig];