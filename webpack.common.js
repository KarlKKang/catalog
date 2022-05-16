module.exports = {
	target: 'browserslist',
	entry: {
		'404': {
			import: './src/script/404.js',
		},
		'account': {
			import: './src/script/account.js',
			dependOn: ['main', 'sha512'],
		},
		'bangumi-hls': {
			import: './src/script/bangumi-hls.js',
			dependOn: ['main', 'lazyload'],
		},
		'confirm_email': {
			import: './src/script/confirm_email.js',
			dependOn: ['main'],
		},
		'confirm_special_register': {
			import: './src/script/confirm_special_register.js',
			dependOn: ['main'],
		},
		'console': {
			import: './src/script/console.js',
			dependOn: ['main', 'sha512'],
		},
		'image': {
			import: './src/script/image.js',
			dependOn: ['main'],
		},
		'index': {
			import: './src/script/index.js',
			dependOn: ['main', 'lazyload'],
		},
		'info': {
			import: './src/script/info.js',
			dependOn: ['main'],
		},
		'login': {
			import: './src/script/login.js',
			dependOn: ['main', 'sha512'],
		},
		'message': {
			import: './src/script/message.js',
			dependOn: ['main'],
		},
		'new_email': {
			import: './src/script/new_email.js',
			dependOn: ['main'],
		},
		'password_reset': {
			import: './src/script/password_reset.js',
			dependOn: ['main', 'sha512'],
		},
		'policy': {
			import: './src/script/policy.js',
			dependOn: ['main'],
		},
		'register': {
			import: './src/script/register.js',
			dependOn: ['main', 'sha512'],
		},
		'request_password_reset': {
			import: './src/script/request_password_reset.js',
			dependOn: ['main'],
		},
		'special_register': {
			import: './src/script/special_register.js',
			dependOn: ['main', 'sha512'],
		},
		'lazyload': {
			import: './src/script/lazyload.js',
			dependOn: ['main'],
		},
		'main': ['./src/script/main.js'],
		'sha512': ['node-forge/lib/sha512'],
	},
	output: {
		filename: '[name].js',
		clean: true,
	},
	optimization: {
		runtimeChunk: 'single',
	},
	module: {
		rules: [
			// the 'transform-runtime' plugin tells Babel to
			// require the runtime instead of inlining it.
			{
				test: /\.m?js$/,
				exclude: /(node_modules|bower_components)/,
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['@babel/preset-env'],
						plugins: [
							["@babel/plugin-transform-runtime", {
								"regenerator": true,
								"corejs": 3
							}],
						]
					}
				}
			}
		]
	}
};