// Note some browser launchers should be installed before using karma start.
// For example:
// npm install karma-firefox-launcher
// karma start --browsers=Firefox

const path = require('path');
const webpack = require('webpack');

module.exports = function(config) {
    config.set({
        basePath: './',
        frameworks: ['qunit'],

        // list of files / patterns to load in the browser
        files: [
            {pattern: 'test/vendor/qunit.css', watched: false},
            {pattern: 'node_modules/babel-polyfill/dist/polyfill.js', watched: false},
            {pattern: 'test/vendor/jquery.js', watched: false},
            {pattern: 'test/vendor/json2.js', watched: false},
            {pattern: 'test/vendor/underscore.js', watched: false},
            {pattern: 'dist/pagebone.js', watched: false},
            'test/setup/*.js',
            'test/*.js'
        ],

        plugins: [
            'karma-qunit',
            'karma-chrome-launcher',
            // 'karma-phantomjs-launcher',
            // 'karma-babel-preprocessor',
            'karma-webpack'
        ],

        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            'test/setup/*.js': ['webpack'],
            'test/*.js': ['webpack']
        },
        webpack: {
            module: {
                loaders: [{
                    'test':  /\.js$/,
                    'exclude': /node_modules/,
                    'loader': 'babel',
                    'query': {
                        cacheDirectory: true,
                        presets: ['es2015'],
                        "plugins": ["babel-plugin-add-module-exports"]
                     }
                }]
            },
            externals: {
                'Pagebone': 'Pagebone',
                'jquery': '$',
                'underscore': '_'
            }
        },



        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['progress'],

        // web server port
        port: 9877,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: false,

        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['Chrome'], // 'PhantomJS',

        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: true,

        // See http://stackoverflow.com/a/27873086/1517919
        customLaunchers: {
            Chrome_sandbox: {
                base: 'Chrome',
                flags: ['--no-sandbox']
            }
        }
    });
};
