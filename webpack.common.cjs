const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const CircularDependencyPlugin = require('circular-dependency-plugin');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const path = require('path');
const htmlMinifyOptions = require('./build_config.cjs').htmlMinifyOptions;
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { cssMinifyOptions } = require('./build_config.cjs');

const config = {
    target: 'browserslist',
    entry: './src/script/entry',
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'style/[id].css',
        }),
        new CircularDependencyPlugin({
            exclude: /node_modules/,
            failOnError: true,
            allowAsyncCycles: false,
            cwd: process.cwd(),
        }),
        new BundleAnalyzerPlugin({
            analyzerMode: 'static',
            reportFilename: '../../webpack-bundle-analyzer-report.html'
        })
    ],
    output: {
        filename: 'script/[id].js',
        publicPath: '/',
        clean: {
            keep: (filename) => {
                return filename === 'unsupported_browser.html' ||
                    filename === 'style/unsupported_browser.css' ||
                    filename === 'script_legacy' ||
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
        usedExports: true,
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
                test: /\.(ts|js)x?$/,
                exclude: {
                    or: [
                        // Exclude libraries in node_modules ...
                        /node_modules/,
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
                                    "corejs": "3.31",
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
                test: /\.ejs$/,
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