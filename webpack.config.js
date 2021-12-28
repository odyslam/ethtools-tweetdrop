const path = require('path')

module.exports = {
  entry: './src/index.ts',
  output: {
    filename: 'worker.js',
    path: path.join(__dirname, 'dist'),
  },
  devtool: 'cheap-module-source-map',
  mode: 'development',
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
    alias: {
      'https': 'https-browserify',
      'http': 'http-browserify',
      'zlib': 'zlib-browserify'
    }
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
        },
      },
    ],
  },
}
