const path = require('path');

module.exports = {
	target: 'browserslist',
	entry: {
		'404': {
			import: './src/script/404',
		},
		'account': {
			import: './src/script/account',
		},
		'bangumi-hls': {
			import: './src/script/bangumi-hls',
		},
		'confirm_email': {
			import: './src/script/confirm_email',
		},
		'confirm_special_register': {
			import: './src/script/confirm_special_register',
		},
		'console': {
			import: './src/script/console',
		},
		'image': {
			import: './src/script/image',
		},
		'index': {
			import: './src/script/index',
		},
		'info': {
			import: './src/script/info',
		},
		'login': {
			import: './src/script/login',
		},
		'message': {
			import: './src/script/message',
		},
		'new_email': {
			import: './src/script/new_email',
		},
		'password_reset': {
			import: './src/script/password_reset',
		},
		'policy': {
			import: './src/script/policy',
		},
		'register': {
			import: './src/script/register',
		},
		'request_password_reset': {
			import: './src/script/request_password_reset',
		},
		'special_register': {
			import: './src/script/special_register',
		},
	},
	output: {
		filename: '[name].js',
		clean: true,
	},
	optimization: {
		runtimeChunk: 'single',
		concatenateModules: true,
		flagIncludedChunks: true,
		removeAvailableModules: true,
		splitChunks: {
			cacheGroups: {
				polyfill: {
					test: /[\\/]node_modules[\\/](core-js|@babel)[\\/]/,
					name: 'polyfill',
					chunks: 'all',
					reuseExistingChunk: true
				}, 
				main: {
					test: /[\\/]src[\\/]script[\\/]module[\\/]main/,
					name: 'main',
					chunks: 'all',
					reuseExistingChunk: true
				}
			}
		},
		//usedExports: 'global',
	},
	node: {
		global: false // Fix __webpack_require__ is undefined in Chrome prior to version 71.
	},
	resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json']
    },
	module: {
		rules: [
			{
				test: /\.(ts|js)x?$/,
				exclude: {
					and: [/node_modules/], // Exclude libraries in node_modules ...
					not: [
						// Except for a few of them that needs to be transpiled because they use modern syntax
						/node_modules[\\\/]screenfull/,
					]
				},
				use: {
					loader: 'babel-loader',
					options: {
						presets: [
							[
								"@babel/preset-env",
								{
									"useBuiltIns": "entry",
									"corejs": "3.22"
								}
							],
							"@babel/preset-typescript"
						],
						plugins: ["@babel/plugin-transform-runtime"]
					}
				}
			}
		]
	}
};