const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CircularDependencyPlugin = require('circular-dependency-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require('path');
const htmlMinifyOptions = require('./build_config.cjs').htmlMinifyOptions;
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { cssMinifyOptions } = require('./build_config.cjs');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const { DOMAIN, DESCRIPTION } = require('./env/index.cjs');

const config = {
    target: 'browserslist',
    entry: './src/script/entry',
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'style/[id].css',
        }),
        new CircularDependencyPlugin({
            exclude: /node_modules|hls\.js/,
            failOnError: true,
            allowAsyncCycles: false,
            cwd: process.cwd(),
        }),
        new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename: '../webpack-bundle-analyzer-report.html'
        }),
        new FaviconsWebpackPlugin({
            logo: './src/icon/icon.png',
            logoMaskable: './src/icon/icon_maskable.png',
            prefix: '/icon/',
            mode: 'webapp',
            devMode: 'webapp',
            favicons: {
                appName: DOMAIN,
                appShortName: DOMAIN,
                appDescription: DESCRIPTION,
                developerName: DOMAIN,
                developerURL: 'https://' + DOMAIN,
                lang: "ja-JP",
                start_url: "/",
                icons: {
                    appleStartup: { offset: 20 },
                }
            }
        })
    ],
    output: {
        filename: 'script/[id].js',
        publicPath: '/',
        clean: {
            keep: (filename) => {
                return filename === 'style/unsupported_browser.css' ||
                    filename === 'script/browser.js' ||
                    /^sw\.js(\.map)?$/.test(filename) ||
                    /^workbox-.*\.js(\.map)?$/.test(filename) ||
                    filename === 'icon' ||
                    filename === 'google688e01234602d07d.html' ||
                    filename === 'IndexNowb922f0d0-3cbe-42b9-b913-accbbf92100f.txt' ||
                    filename === 'robots.txt' ||
                    filename === 'sitemap.xml';
            }
        },
        chunkLoadingGlobal: 'loader'
    },
    optimization: {
        concatenateModules: true,
        flagIncludedChunks: true,
        removeAvailableModules: true,
        runtimeChunk: 'single',
        splitChunks: {
            maxSize: 1000 * 1000,
            chunks: 'all'
        },
        minimize: true,
        minimizer: [
            new CssMinimizerPlugin({
                minimizerOptions: cssMinifyOptions,
            }),
        ]
    },
    node: { global: false },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json']
    },
    module: {
        rules: [
            {
                test: /\.(ts|js)x?$/i,
                exclude: {
                    or: [
                        // Exclude libraries in node_modules ...
                        /node_modules/,
                        /hls\.js/,
                    ],
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
                                    "corejs": "3.35",
                                }
                            ],
                            [
                                "@babel/preset-typescript",
                                {
                                    optimizeConstEnums: true,
                                }
                            ]
                        ],
                        plugins: [
                            "@babel/plugin-transform-runtime"
                        ]
                    }
                }
            },
            {
                test: /\.ejs$/i,
                include: [
                    path.resolve(__dirname, "src/html/module")
                ],
                loader: 'ejs-loader',
                options: {
                    variable: 'data',
                }
            },
            {
                test: /\.html$/i,
                loader: "html-loader",
                options: {
                    minimize: htmlMinifyOptions,
                },
            },
            {
                test: /\.css$/i,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader'
                ],
                sideEffects: true,
            },
            {
                test: /\.scss$/i,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'sass-loader',
                ],
                sideEffects: true,
            },
        ]
    }
};

module.exports = config;