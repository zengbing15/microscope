const fs = require('fs')
const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')
const HtmlPlugin = require('html-webpack-plugin')
const ExtractPlugin = require('extract-text-webpack-plugin')
const UglifyJSPlugin = require('uglifyjs-webpack-plugin')
const SWPrecachePlugin = require('sw-precache-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')

const baseConfig = require(path.resolve(__dirname, './webpack.config.base'))
const manifest = JSON.parse(
  fs.readFileSync(path.resolve(__dirname, '../lib/manifest.json')),
)
const prodConfig = {
  entry: {
    app: path.resolve(__dirname, '../src/index.tsx'),
  },
  // output: {
  //   path: path.resolve(__dirname, '../dist'),
  //   filename: 'scripts/[name]-[hash:5].js',
  //   chunkFilename: 'scripts/[name]-[hash:5].js',
  // },
  module: {
    rules: [
      {
        test: /\.s?css$/,
        use: ExtractPlugin.extract({
          fallback: 'style-loader',
          use: [
            {
              loader: 'css-loader',
              options: {
                modules: true,
                importLoaders: 3,
                localIdentName: '[local]__[name]--[hash:base64:5]',
                minimize: true,
              },
            },
            {
              loader: 'postcss-loader',
              options: {
                ident: 'postcss',
                sourceMap: false,
                plugins: () => [require('autoprefixer')],
              },
            },
            'resolve-url-loader',
            'sass-loader',
          ],
        }),
        include: /src/,
      },
    ],
  },
  plugins: [
    new ExtractPlugin('styles/style.[contenthash:base64:5].css'),
    new SWPrecachePlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('production'),
      },
    }),
    new UglifyJSPlugin(),
    new webpack.DllReferencePlugin({
      context: __dirname,
      manifest: require(path.resolve(__dirname, '../lib/react_manifest')),
    }),
    new webpack.DllReferencePlugin({
      context: __dirname,
      manifest: require(path.resolve(
        __dirname,
        '../lib/styledComponents_manifest',
      )),
    }),
    new CopyPlugin([
      {
        from: path.resolve(__dirname, '../lib'),
        to: path.resolve(__dirname, '../dist'),
      },
    ]),
    new HtmlPlugin({
      title: '生产',
      template: path.resolve(__dirname, '../src/templates/index.html'),
      react: `./lib/${manifest['react.js']}`,
      styledComponents: `./lib/${manifest['styledComponents.js']}`,
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      },
    }),
  ],
}

module.exports = merge(baseConfig, prodConfig)