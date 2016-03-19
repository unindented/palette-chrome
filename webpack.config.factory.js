'use strict'

var path = require('path')
var webpack = require('webpack')
var autoprefixer = require('autoprefixer')
var ExtractTextPlugin = require('extract-text-webpack-plugin')

module.exports = function (options) {
  options = options || {}

  var platform = options.platform
  var optimize = (options.environment === 'production' && platform === 'chrome')

  return {
    entry: {
      'background': './src/background',
      'foreground': './src/foreground',
      'options': './src/options'
    },

    output: {
      path: './dist/' + platform,
      pathinfo: !optimize,
      filename: '[name].js'
    },

    debug: !!options.test,
    devtool: options.test ? 'eval' : null,

    resolve: {
      root: [
        path.resolve(__dirname, './'),
        path.resolve(__dirname, './src'),
        path.resolve(__dirname, './src/platform/', platform)
      ],

      modulesDirectories: [
        'bower_components',
        'node_modules'
      ],

      alias: {
        'cpa': 'chrome-platform-analytics/google-analytics-bundle',
        'mdi': 'material-design-icons',
        'mdl': 'material-design-lite'
      }
    },

    resolveLoader: {
      modulesDirectories: [
        'loaders',
        'node_modules'
      ]
    },

    module: {
      loaders: [
        {
          test: /\.(eot|png|svg|ttf|woff\d?)$/,
          exclude: /(assets|platform)\//,
          loader: 'file?name=[name].[ext]'
        },
        {
          test: /\.(eot|png|svg|ttf|woff\d?)$/,
          include: /(assets|platform)\//,
          loader: 'file?context=src&name=[path][name].[ext]'
        },
        {
          test: /\.json$/,
          exclude: /(_locales|platform)\//,
          loader: 'json'
        },
        {
          test: /\.json$/,
          include: /_locales\//,
          loader: 'file?context=src&name=[path][name].[ext]'
        },
        {
          test: /\.json$/,
          include: /platform\//,
          loader: [
            'file?name=[name].[ext]',
            'template'
          ].join('!')
        },
        {
          test: /\.html$/,
          loader: [
            'file?name=[name].[ext]',
            'template'
          ].join('!')
        },
        {
          test: /\.css$/,
          loader: ExtractTextPlugin.extract('style', [
            'css?sourceMap',
            'postcss?sourceMap'
          ])
        },
        {
          test: /\.scss$/,
          loader: ExtractTextPlugin.extract('style', [
            'css?sourceMap',
            'postcss?sourceMap',
            'sass?sourceMap',
            'wrap?scss'
          ])
        },
        {
          test: /\.js$/,
          exclude: /(bower_components|node_modules)\//,
          loader: options.coverage ? 'isparta' : 'babel'
        },
        {
          test: /worker\.js$/,
          exclude: /(bower_components|node_modules)\//,
          loader: [
            'worker?name=[name].js',
            options.coverage ? 'isparta' : 'babel'
          ].join('!')
        },
        // Third-party libraries.
        {
          test: /chrome-platform-analytics\//,
          loader: [
            'exports?window.analytics',
            'disclosure'
          ].join('!')
        },
        {
          test: require.resolve('dialog-polyfill'),
          loader: 'imports?styles=dialog-polyfill/dialog-polyfill.css'
        },
        {
          test: require.resolve('material-design-lite'),
          loader: 'exports?componentHandler'
        },
        {
          test: require.resolve('react-mdl'),
          loader: 'imports?componentHandler=material-design-lite'
        },
        {
          test: require.resolve('react'),
          loader: 'expose?React'
        }
      ]
    },

    plugins: [
      new ExtractTextPlugin('[name].css'),
      new webpack.DefinePlugin({
        'process.env': {
          'NODE_ENV': JSON.stringify(options.environment)
        }
      })
    ].concat(optimize ? [
      new webpack.optimize.OccurenceOrderPlugin(),
      new webpack.optimize.UglifyJsPlugin({
        compressor: {
          screw_ie8: true,
          warnings: false
        }
      })
    ] : []),

    postcss: [
      autoprefixer({browsers: 'Chrome >= 43'})
    ],

    wrap: {
      scss: {
        before: '@import "~global.scss";'
      }
    }
  }
}
