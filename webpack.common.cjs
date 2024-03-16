const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CircularDependencyPlugin = require('circular-dependency-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require('path');
const { htmlMinifyOptions } = require('./build_config.cjs');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { cssMinifyOptions } = require('./build_config.cjs');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');
const { DOMAIN, DESCRIPTION } = require('./env/index.cjs');
const { getCoreJSVersion } = require('./webpack_helper.cjs');

const optimization = {
    concatenateModules: true,
    flagIncludedChunks: true,
    removeAvailableModules: true,
    usedExports: true,
};

const configs = [
    {
        name: 'main',
        stats: 'minimal',
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
                        filename === 'IndexNowb922f0d0-3cbe-42b9-b913-accbbf92100f.txt' ||
                        filename === 'robots.txt' ||
                        filename === 'sitemap.xml';
                }
            },
            chunkLoadingGlobal: 'loader'
        },
        optimization: {
            ...optimization,
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
            extensions: ['.ts', '.tsx', '.js', '.json'],
        },
        module: {
            rules: [
                {
                    test: /\.(tsx?|m?js|jsx?)$/i,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                [
                                    "@babel/preset-env",
                                    {
                                        "useBuiltIns": "entry",
                                        "corejs": getCoreJSVersion(),
                                    }
                                ]
                            ],
                            plugins: [
                                "@babel/plugin-transform-runtime"
                            ],
                            compact: true,
                        }
                    }
                },
                {
                    test: /\.tsx?$/i,
                    use: [
                        {
                            loader: 'ts-loader',
                        }
                    ]
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
    },
    {
        name: 'sw',
        stats: 'minimal',
        target: 'webworker',
        output: {
            filename: 'sw.js',
            publicPath: '/',
            clean: {
                keep: (filename) => {
                    return filename !== 'sw.js';
                }
            },
        },
        optimization: {
            ...optimization,
            minimize: true,
            minimizer: [],
        },
        node: { global: false },
        resolve: {
            extensions: ['.js']
        },
        module: {
            rules: [
                {
                    test: /\.js$/i,
                    exclude: {
                        or: [
                            /node_modules/,
                        ]
                    },
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: [
                                [
                                    "@babel/preset-env",
                                    {
                                        "useBuiltIns": "usage",
                                        "corejs": getCoreJSVersion(),
                                    }
                                ]
                            ]
                        }
                    }
                },
            ]
        }
    }
];

module.exports = configs;