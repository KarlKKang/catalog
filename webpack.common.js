const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

const html_minify_options = {
    collapseBooleanAttributes: true,
    collapseWhitespace: true,
    keepClosingSlash: false,
    quoteCharacter: '"',
    removeAttributeQuotes: true,
    removeComments: true,
    removeRedundantAttributes: true,
    useShortDoctype: true,
    sortAttributes: true,
    sortClassName: true
};

module.exports = {
    target: 'browserslist',
    entry: {
        '404': {
            import: './src/script/404',
        },
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
            minify: html_minify_options,
            chunks: ['404'],
            filename: '../404.html',
            template: 'src/html/404.ejs',
            title: '404 | featherine.com',
            templateParameters: {
                index: false
            }
        }),
        new HtmlWebpackPlugin({
            minify: html_minify_options,
            chunks: ['bangumi'],
            filename: '../bangumi.html',
            template: 'src/html/bangumi.ejs',
            title: 'featherine.com',
            templateParameters: {
                index: false
            }
        }),
        new HtmlWebpackPlugin({
            minify: html_minify_options,
            chunks: ['confirm_new_email'],
            filename: '../confirm_new_email.html',
            template: 'src/html/confirm_new_email.ejs',
            title: 'メールアドレス変更 | featherine.com',
            templateParameters: {
                index: false
            }
        }),
        new HtmlWebpackPlugin({
            minify: html_minify_options,
            chunks: ['console'],
            filename: '../console.html',
            template: 'src/html/console.ejs',
            title: 'console | featherine.com',
            templateParameters: {
                index: false
            }
        }),
        new HtmlWebpackPlugin({
            minify: html_minify_options,
            chunks: ['image'],
            filename: '../image.html',
            template: 'src/html/image.ejs',
            title: 'featherine.com',
            templateParameters: {
                index: false
            }
        }),
        new HtmlWebpackPlugin({
            minify: html_minify_options,
            chunks: ['index'],
            filename: '../index.html',
            template: 'src/html/index.ejs',
            title: 'featherine.com',
            templateParameters: {
                index: true
            }
        }),
        new HtmlWebpackPlugin({
            minify: html_minify_options,
            chunks: ['info'],
            filename: '../info.html',
            template: 'src/html/info.ejs',
            title: 'ご利用ガイド | featherine.com',
            templateParameters: {
                index: false
            }
        }),
        new HtmlWebpackPlugin({
            minify: html_minify_options,
            chunks: ['login'],
            filename: '../login.html',
            template: 'src/html/login.ejs',
            title: 'ログイン | featherine.com',
            templateParameters: {
                index: false
            }
        }),
        new HtmlWebpackPlugin({
            minify: html_minify_options,
            chunks: ['message'],
            filename: '../message.html',
            template: 'src/html/message.ejs',
            title: 'featherine.com',
            templateParameters: {
                index: false
            }
        }),
        new HtmlWebpackPlugin({
            minify: html_minify_options,
            chunks: ['my_account'],
            filename: '../my_account.html',
            template: 'src/html/my_account.ejs',
            title: 'マイページ | featherine.com',
            templateParameters: {
                index: true
            }
        }),
        new HtmlWebpackPlugin({
            minify: html_minify_options,
            chunks: ['new_email'],
            filename: '../new_email.html',
            template: 'src/html/new_email.ejs',
            title: 'メールアドレス変更 | featherine.com',
            templateParameters: {
                index: false
            }
        }),
        new HtmlWebpackPlugin({
            minify: html_minify_options,
            chunks: ['news'],
            filename: '../news.html',
            template: 'src/html/news.ejs',
            title: 'お知らせ | featherine.com',
            templateParameters: {
                index: true
            }
        }),
        new HtmlWebpackPlugin({
            minify: html_minify_options,
            chunks: ['password_reset'],
            filename: '../password_reset.html',
            template: 'src/html/password_reset.ejs',
            title: 'パスワード再発行 | featherine.com',
            templateParameters: {
                index: false
            }
        }),
        new HtmlWebpackPlugin({
            minify: html_minify_options,
            chunks: ['register'],
            filename: '../register.html',
            template: 'src/html/register.ejs',
            title: '新規登録 | featherine.com',
            templateParameters: {
                index: false
            }
        }),
        new HtmlWebpackPlugin({
            minify: html_minify_options,
            chunks: ['request_password_reset'],
            filename: '../request_password_reset.html',
            template: 'src/html/request_password_reset.ejs',
            title: 'パスワード再発行 | featherine.com',
            templateParameters: {
                index: false
            }
        }),
        new HtmlWebpackPlugin({
            minify: html_minify_options,
            chunks: ['special_register'],
            filename: '../special_register.html',
            template: 'src/html/special_register.ejs',
            title: '新規登録 | featherine.com',
            templateParameters: {
                index: false
            }
        }),
    ],
    output: {
        filename: '[id].js',
        publicPath: '/script/',
        clean: true,
    },
    optimization: {
        runtimeChunk: 'single',
        concatenateModules: true,
        flagIncludedChunks: true,
        removeAvailableModules: true,
        splitChunks: {
            maxSize: 1000 * 1000,
            chunks: 'all',
            /*cacheGroups: {
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
            }*/
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
                                    "corejs": "3.25"
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