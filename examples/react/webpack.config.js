const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const meteorExternals = require('webpack-meteor-externals');

const clientConfig = {
  entry: './client/main.jsx',
  module: {
    rules: [{
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
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
  externals: [
    meteorExternals()
  ],
  devServer: {
    hot: true
  }
};

const serverConfig = {
  entry: [
    './server/main.js'
  ],
  target: 'node',
  devServer: {
    hot: true
  },
  externals: [
    meteorExternals()
  ]
};

module.exports = [clientConfig, serverConfig];