const path = require('path');

module.exports = {
	target: 'browserslist',
	entry: {
		'404': {
			import: './src/script/404',
		},
		'account': {
			import: './src/script/account',
			//dependOn: ['main'],
		},
		'bangumi-hls': {
			import: './src/script/bangumi-hls',
			//dependOn: ['main'],
		},
		'confirm_email': {
			import: './src/script/confirm_email',
			//dependOn: ['main'],
		},
		'confirm_special_register': {
			import: './src/script/confirm_special_register',
			//dependOn: ['main'],
		},
		'console': {
			import: './src/script/console',
			//dependOn: ['main'],
		},
		'image': {
			import: './src/script/image',
			//dependOn: ['main'],
		},
		'index': {
			import: './src/script/index',
			//dependOn: ['main'],
		},
		'info': {
			import: './src/script/info',
			//dependOn: ['main'],
		},
		'login': {
			import: './src/script/login',
			//dependOn: ['main'],
		},
		'message': {
			import: './src/script/message',
			//dependOn: ['main'],
		},
		'new_email': {
			import: './src/script/new_email',
			//dependOn: ['main'],
		},
		'password_reset': {
			import: './src/script/password_reset',
			//dependOn: ['main'],
		},
		'policy': {
			import: './src/script/policy',
			//dependOn: ['main'],
		},
		'register': {
			import: './src/script/register',
			//dependOn: ['main'],
		},
		'request_password_reset': {
			import: './src/script/request_password_reset',
			//dependOn: ['main'],
		},
		'special_register': {
			import: './src/script/special_register',
			//dependOn: ['main'],
		},

		//helpers
		//'main': ['./src/script/module/main'],
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