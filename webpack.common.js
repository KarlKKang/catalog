const path = require('path');

module.exports = {
	target: 'browserslist',
	entry: {
		'404': {
			import: './src/script/404.js',
		},
		'account': {
			import: './src/script/account.js',
			dependOn: ['main', 'core-js', 'sha512'],
		},
		'bangumi-hls': {
			import: './src/script/bangumi-hls.js',
			dependOn: ['main', 'core-js'],
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
			dependOn: ['main', 'core-js', 'sha512'],
		},
		'image': {
			import: './src/script/image.js',
			dependOn: ['main', 'core-js'],
		},
		'index': {
			import: './src/script/index.js',
			dependOn: ['main', 'core-js'],
		},
		'info': {
			import: './src/script/info.js',
			dependOn: ['main', 'core-js'],
		},
		'login': {
			import: './src/script/login.js',
			dependOn: ['main', 'core-js', 'sha512'],
		},
		'message': {
			import: './src/script/message.js',
			dependOn: ['main', 'core-js'],
		},
		'new_email': {
			import: './src/script/new_email.js',
			dependOn: ['main', 'core-js'],
		},
		'password_reset': {
			import: './src/script/password_reset.js',
			dependOn: ['main', 'core-js', 'sha512'],
		},
		'policy': {
			import: './src/script/policy.js',
			dependOn: ['main', 'core-js'],
		},
		'register': {
			import: './src/script/register.js',
			dependOn: ['main', 'core-js', 'sha512'],
		},
		'request_password_reset': {
			import: './src/script/request_password_reset.js',
			dependOn: ['main', 'core-js'],
		},
		'special_register': {
			import: './src/script/special_register.js',
			dependOn: ['main', 'core-js', 'sha512'],
		},

		//helpers
		'main': ['./src/script/helper/main.js'],
		'sha512': ['node-forge/lib/sha512'],
		'core-js': ['core-js'],
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
						/node_modules[\\\/]@babel[\\\/]runtime/,
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