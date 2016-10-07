const package = require('./package');
const webpack = require('webpack');
const libraryName = "Pagebone";

module.exports = {
    context: __dirname + '/src',
    entry: {
	    "pagebone": "./pagebone.js",
	    "pagebone.min": "./pagebone.js",
	},
    output: {
        path: __dirname + '/dist',
        filename: "[name].js",
        library: libraryName,
        libraryTarget: 'umd',
        umdNamedDefine: true
    },
    module: {
        loaders: [{
            'test': /\.js$/,
            'exclude': /node_modules/,
            'loader': 'babel',
	 		'query': {
                cacheDirectory: true,
                presets: ['es2015'],
                "plugins": ["babel-plugin-add-module-exports"]
	         }
        }]
    },
	plugins: [
		new webpack.optimize.UglifyJsPlugin({
		  include: /\.min\.js$/,
		  compress: {
		  	warnings: false
		  }
		}),
	],
    externals: {
    	'jquery': '$',
    	'underscore': '_'
    }
};