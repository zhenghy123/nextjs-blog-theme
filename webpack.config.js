// const merge = require('webpack-merge')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
// const TerserPlugin = require('terser-webpack-plugin')

const path = require('path')
// const UglifyESPlugin = require('uglifyjs-webpack-plugin')

module.exports = {
  mode: 'development',
  // 入口
  // entry: {
  //   kplayer: [path.resolve(__dirname, './src/index.js')],
  // },
  // // 出口
  // output: {
  //   path: path.resolve(__dirname, 'dist'),
  //   filename: '[name].js',
  // },
  devServer: {
    open: true,
    port: 8001,
  },
  // build: {
  //   assetsPublicpath: '/',
  //   assetsSubDirectory: 'static',
  // },
  resolve: {
    fallback: { path: require.resolve('path-browserify') },
  },
  // devtool: 'cheap-module-eval-source-map', // 'inline-source-map',
  // 'cheap-module-eval-source-map',
  // 'eval-source-map',
  // 'source-map',
  // devtool: 'eval-source-map',
  // autoOpenBrowser: true,

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      // {
      //   test: /\.html$/,
      //   use: ['raw-loader'],
      // },
      {
        test: /\.(jpg|jpeg|png)$/,
        use: ['url-loader'],
      },
      {
        test: /\.xml$/,
        use: 'xml-loader',
      },
      {
        test: /\.less$/,
        use: ['style-loader', 'css-loader', 'less-loader'],
      },
    ],
  },
  // optimization: {
  //   minimize: true,
  //   minimizer: [
  //     // devtool要注释掉！！！
  //     // new TerserPlugin({
  //     //   sourceMap: true,
  //     //   terserOptions: {
  //     //     compress: {
  //     //       drop_console: true,
  //     //     },
  //     //   },
  //     // }),
  //   ],
  // },

  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      title: 'kplayer',
      template: 'src/index.html',
      filename: 'index.html',
      inject: 'head',
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          to({ context, absoluteFilename }) {
            return `${path.relative(context, absoluteFilename)}`
          },
          from: 'public',
        },
      ],
    }),
  ],
}
