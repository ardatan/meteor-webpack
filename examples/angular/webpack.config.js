const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const {
    AngularCompilerPlugin
} = require('@ngtools/webpack');
const webpack = require('webpack');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const meteorExternals = require('webpack-meteor-externals');
const nodeExternals = require('webpack-node-externals');

const projectPath = path.resolve('.').split(path.sep + '.meteor')[0];

const clientConfig = {
    entry: './client/index.ts',
    devtool: 'nosources-source-map',
    devServer: {
        historyApiFallback: true
    },
    module: {
        rules: [{
                "test": /\.html$/,
                "loader": "raw-loader"
            },
            {
                test: /(?:\.ngfactory\.js|\.ngstyle\.js|\.ts)$/,
                loader: '@ngtools/webpack'
            }
        ]
    },
    plugins: [
        new AngularCompilerPlugin({
            tsConfigPath: path.join(projectPath, './tsconfig.json'),
            mainPath: path.join(projectPath, './client/index.ts'),
            entryModule: path.join(projectPath, './client/app/app.module#AppModule'),
            sourceMap: true,
            skipCodeGeneration: process.env.NODE_ENV !== 'production'
        }),
        new HtmlWebpackPlugin({
            template: './client/index.html'
        }),
        new webpack.ProgressPlugin()
    ],
    externals: [
        meteorExternals()
    ],
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    }
};
const serverConfig = {
    entry: './server/index.ts',
    target: 'node',
    module: {
        rules: [{
            test: /\.tsx?$/,
            loader: 'ts-loader',
            options: {
                transpileOnly: true,
                happyPackMode: true
            },
            exclude: /node_modules/
        }]
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    plugins: [
        new ForkTsCheckerWebpackPlugin(),
        new webpack.ProgressPlugin()
    ],
    externals: [
        meteorExternals(),
        nodeExternals()
    ],
    devServer: {
        hot: true
    }
}
module.exports = [clientConfig, serverConfig];