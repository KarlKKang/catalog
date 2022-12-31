const HtmlWebpackPlugin = require('html-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const path = require('path');
const htmlMinifyOptions = require('./build_config.cjs').htmlMinifyOptions;

module.exports = {
    target: 'browserslist',
    entry: {
        'bangumi': {
            import: './src/script/bangumi',
        },
        'confirm_new_email': {
            import: './src/script/confirm_new_email',
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
        'my_account': {
            import: './src/script/my_account',
        },
        'new_email': {
            import: './src/script/new_email',
        },
        'news': {
            import: './src/script/news',
        },
        'password_reset': {
            import: './src/script/password_reset',
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
    plugins: [
        new HtmlWebpackPlugin({
            minify: htmlMinifyOptions,
            chunks: ['bangumi'],
            filename: '../bangumi.html',
            template: 'src/html/bangumi.ejs',
            title: 'featherine.com',
            templateParameters: {
                index: false
            }
        }),
        new HtmlWebpackPlugin({
            minify: htmlMinifyOptions,
            chunks: ['confirm_new_email'],
            filename: '../confirm_new_email.html',
            template: 'src/html/confirm_new_email.ejs',
            title: 'メールアドレス変更 | featherine.com',
            templateParameters: {
                index: false
            }
        }),
        new HtmlWebpackPlugin({
            minify: htmlMinifyOptions,
            chunks: ['console'],
            filename: '../console.html',
            template: 'src/html/console.ejs',
            title: 'console | featherine.com',
            templateParameters: {
                index: false
            }
        }),
        new HtmlWebpackPlugin({
            minify: htmlMinifyOptions,
            chunks: ['image'],
            filename: '../image.html',
            template: 'src/html/image.ejs',
            title: 'featherine.com',
            templateParameters: {
                index: false
            }
        }),
        new HtmlWebpackPlugin({
            minify: htmlMinifyOptions,
            chunks: ['index'],
            filename: '../index.html',
            template: 'src/html/index.ejs',
            title: 'featherine.com',
            templateParameters: {
                index: true
            }
        }),
        new HtmlWebpackPlugin({
            minify: htmlMinifyOptions,
            chunks: ['info'],
            filename: '../info.html',
            template: 'src/html/info.ejs',
            title: 'ご利用ガイド | featherine.com',
            templateParameters: {
                index: false
            }
        }),
        new HtmlWebpackPlugin({
            minify: htmlMinifyOptions,
            chunks: ['login'],
            filename: '../login.html',
            template: 'src/html/login.ejs',
            title: 'ログイン | featherine.com',
            templateParameters: {
                index: false
            }
        }),
        new HtmlWebpackPlugin({
            minify: htmlMinifyOptions,
            chunks: ['message'],
            filename: '../message.html',
            template: 'src/html/message.ejs',
            title: 'featherine.com',
            templateParameters: {
                index: false
            }
        }),
        new HtmlWebpackPlugin({
            minify: htmlMinifyOptions,
            chunks: ['my_account'],
            filename: '../my_account.html',
            template: 'src/html/my_account.ejs',
            title: 'マイページ | featherine.com',
            templateParameters: {
                index: true
            }
        }),
        new HtmlWebpackPlugin({
            minify: htmlMinifyOptions,
            chunks: ['new_email'],
            filename: '../new_email.html',
            template: 'src/html/new_email.ejs',
            title: 'メールアドレス変更 | featherine.com',
            templateParameters: {
                index: false
            }
        }),
        new HtmlWebpackPlugin({
            minify: htmlMinifyOptions,
            chunks: ['news'],
            filename: '../news.html',
            template: 'src/html/news.ejs',
            title: 'お知らせ | featherine.com',
            templateParameters: {
                index: true
            }
        }),
        new HtmlWebpackPlugin({
            minify: htmlMinifyOptions,
            chunks: ['password_reset'],
            filename: '../password_reset.html',
            template: 'src/html/password_reset.ejs',
            title: 'パスワード再発行 | featherine.com',
            templateParameters: {
                index: false
            }
        }),
        new HtmlWebpackPlugin({
            minify: htmlMinifyOptions,
            chunks: ['register'],
            filename: '../register.html',
            template: 'src/html/register.ejs',
            title: '新規登録 | featherine.com',
            templateParameters: {
                index: false
            }
        }),
        new HtmlWebpackPlugin({
            minify: htmlMinifyOptions,
            chunks: ['request_password_reset'],
            filename: '../request_password_reset.html',
            template: 'src/html/request_password_reset.ejs',
            title: 'パスワード再発行 | featherine.com',
            templateParameters: {
                index: false
            }
        }),
        new HtmlWebpackPlugin({
            minify: htmlMinifyOptions,
            chunks: ['special_register'],
            filename: '../special_register.html',
            template: 'src/html/special_register.ejs',
            title: '新規登録 | featherine.com',
            templateParameters: {
                index: false
            }
        }),
        new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename: '../../webpack-bundle-analyzer-report.html'
        })
    ],
    output: {
        filename: '[id].js',
        publicPath: '/script/',
        clean: true,
        chunkLoadingGlobal: 'loader'
    },
    optimization: {
        runtimeChunk: 'single',
        concatenateModules: true,
        flagIncludedChunks: true,
        removeAvailableModules: true,
        usedExports: true,
        splitChunks: {
            maxSize: 1000 * 1000,
            chunks: 'all'
        },
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json']
    },
    module: {
        rules: [
            {
                test: /\.(ts|js)x?$/,
                exclude: {
                    or: [
                        // Exclude libraries in node_modules ...
                        /node_modules/,
                        /custom_modules/,
                    ],
                    not: [
                        // Except for a few of them that needs to be transpiled because they use modern syntax
                        /node_modules[\\\/]screenfull/,
                        /node_modules[\\\/]hls.js[\\\/]src/,
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
                                    "corejs": "3.27",
                                    "modules": false
                                }
                            ],
                            "@babel/preset-typescript"
                        ],
                        plugins: ["@babel/plugin-transform-runtime"]
                    }
                }
            },
            {
                test: /\.ejs$/,
                include: [
                    path.resolve(__dirname, "src/html/module")
                ],
                loader: 'ejs-loader',
                options: {
                    variable: 'data',
                }
            },
        ]
    }
};