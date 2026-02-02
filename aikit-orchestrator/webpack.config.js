const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    background: './src/background.ts',
    sidebar: './src/sidebar.ts',
    options: './src/options.ts'
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/
      }
    ]
  },
  resolve: {
    extensions: ['.ts', '.js']
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'sidebar.html', to: 'sidebar.html' },
        { from: 'sidebar.css', to: 'sidebar.css' },
        { from: 'options.html', to: 'options.html' },
        { from: 'options.css', to: 'options.css' },
        { from: 'icons', to: 'icons' }
      ]
    })
  ]
};
