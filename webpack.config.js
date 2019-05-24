const webpack = require('webpack');
const path = require('path');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    library: 'ReactImmutableProptypes',
    libraryTarget: 'umd',
    umdNamedDefine: true,
    globalObject: "(typeof self !== 'undefined' ? self : this)",
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        loader: 'babel-loader',
      },
    ],
  },
};
