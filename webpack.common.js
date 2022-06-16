const path = require('path');

module.exports = {
	target: 'browserslist',
	entry: {
		'404': {
			import: './src/script/404',
		},
		'account': {
			import: './src/script/account',
			dependOn: ['main', 'core-js'],
		},
		'bangumi-hls': {
			import: './src/script/bangumi-hls',
			dependOn: ['main', 'core-js'],
		},
		'confirm_email': {
			import: './src/script/confirm_email',
			dependOn: ['main', 'core-js'],
		},
		'confirm_special_register': {
			import: './src/script/confirm_special_register',
			dependOn: ['main', 'core-js'],
		},
		'console': {
			import: './src/script/console',
			dependOn: ['main', 'core-js'],
		},
		'image': {
			import: './src/script/image',
			dependOn: ['main', 'core-js'],
		},
		'index': {
			import: './src/script/index',
			dependOn: ['main', 'core-js'],
		},
		'info': {
			import: './src/script/info',
			dependOn: ['main', 'core-js'],
		},
		'login': {
			import: './src/script/login',
			dependOn: ['main', 'core-js'],
		},
		'message': {
			import: './src/script/message',
			dependOn: ['main', 'core-js'],
		},
		'new_email': {
			import: './src/script/new_email',
			dependOn: ['main', 'core-js'],
		},
		'password_reset': {
			import: './src/script/password_reset',
			dependOn: ['main', 'core-js'],
		},
		'policy': {
			import: './src/script/policy',
			dependOn: ['main', 'core-js'],
		},
		'register': {
			import: './src/script/register',
			dependOn: ['main', 'core-js'],
		},
		'request_password_reset': {
			import: './src/script/request_password_reset',
			dependOn: ['main', 'core-js'],
		},
		'special_register': {
			import: './src/script/special_register',
			dependOn: ['main', 'core-js'],
		},

		//helpers
		'main': ['./src/script/module/main'],
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