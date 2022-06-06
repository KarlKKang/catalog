const path = require('path');

module.exports = {
	target: 'browserslist',
	entry: {
		'404': {
			import: './src/script/404.js',
		},
		'account': {
			import: './src/script/account.js',
			dependOn: ['main', 'core-js', 'css-vars-ponyfill'],
		},
		'bangumi-hls': {
			import: './src/script/bangumi-hls.js',
			dependOn: ['main', 'core-js', 'css-vars-ponyfill'],
		},
		'confirm_email': {
			import: './src/script/confirm_email.js',
			dependOn: ['main', 'core-js'],
		},
		'confirm_special_register': {
			import: './src/script/confirm_special_register.js',
			dependOn: ['main', 'core-js'],
		},
		'console': {
			import: './src/script/console.js',
			dependOn: ['main', 'core-js'],
		},
		'image': {
			import: './src/script/image.js',
			dependOn: ['main', 'core-js'],
		},
		'index': {
			import: './src/script/index.js',
			dependOn: ['main', 'core-js', 'css-vars-ponyfill'],
		},
		'info': {
			import: './src/script/info.js',
			dependOn: ['main', 'core-js', 'css-vars-ponyfill'],
		},
		'login': {
			import: './src/script/login.js',
			dependOn: ['main', 'core-js', 'css-vars-ponyfill'],
		},
		'message': {
			import: './src/script/message.js',
			dependOn: ['main', 'core-js', 'css-vars-ponyfill'],
		},
		'new_email': {
			import: './src/script/new_email.js',
			dependOn: ['main', 'core-js', 'css-vars-ponyfill'],
		},
		'password_reset': {
			import: './src/script/password_reset.js',
			dependOn: ['main', 'core-js', 'css-vars-ponyfill'],
		},
		'policy': {
			import: './src/script/policy.js',
			dependOn: ['main', 'core-js', 'css-vars-ponyfill'],
		},
		'register': {
			import: './src/script/register.js',
			dependOn: ['main', 'core-js', 'css-vars-ponyfill'],
		},
		'request_password_reset': {
			import: './src/script/request_password_reset.js',
			dependOn: ['main', 'core-js', 'css-vars-ponyfill'],
		},
		'special_register': {
			import: './src/script/special_register.js',
			dependOn: ['main', 'core-js', 'css-vars-ponyfill'],
		},

		//helpers
		'main': ['./src/script/helper/main.js'],
		'core-js': ['core-js'],
		'css-vars-ponyfill': ['css-vars-ponyfill']
	},
	output: {
		filename: '[name].js',
		clean: true,
	},
	optimization: {
		runtimeChunk: 'single',
		//moduleIds: 'named',
		//splitChunks: {
		//	chunks: 'all',
		//},
	},
	module: {
		rules: [
			{
				test: /\.m?js$/,
				exclude: {
					and: [/node_modules/], // Exclude libraries in node_modules ...
					not: [
						// Except for a few of them that needs to be transpiled because they use modern syntax
						// /node_modules[\\\/]@babel[\\\/]runtime/,
					]
				},
				use: {
					loader: 'babel-loader',
					options: {
						presets: [['@babel/preset-env',
						  {
							"useBuiltIns": "entry",
							"corejs": "3.22"
						  }
						]],
						plugins: ['@babel/plugin-transform-runtime']
					}
				}
			}
		]
	}
};