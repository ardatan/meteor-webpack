const HtmlWebpackPlugin = require('html-webpack-plugin');

const clientConfig = {
    entry: [
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
        })
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
      contentBase: './dist'
    }
  };

const serverConfig = {
    entry: [
        './server/main.js'
    ],
    target: 'node'
};

module.exports = [clientConfig, serverConfig];