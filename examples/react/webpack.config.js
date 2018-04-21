const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const clientConfig = {
    entry: [
        'react-hot-loader/patch',
      './client/main.jsx'
    ],
    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: ['babel-loader']
        }
      ]
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './client/main.html'
        }),
        new webpack.HotModuleReplacementPlugin()
    ],
    resolve: {
      extensions: ['*', '.js', '.jsx']
    },
    output: {
      path: __dirname + '/dist',
      publicPath: '/',
      filename: 'bundle.js'
    },
    devServer: {
      contentBase: './dist',
      hot: true
    }
  };

const serverConfig = {
    entry: [
        './server/main.js'
    ],
    target: 'node'
};

module.exports = [clientConfig, serverConfig];