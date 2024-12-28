import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import path from 'path';
import { htmlMinifyOptions, cssMinifyOptions } from './build_config.js';
import CssMinimizerPlugin from 'css-minimizer-webpack-plugin';
import FaviconsWebpackPlugin from 'favicons-webpack-plugin';
import { DOMAIN, DESCRIPTION } from './env/index.js';
import { readSync } from './file_system.js';
import { getDirname } from './webpack.helper.js';

const optimization = {
    concatenateModules: true,
    flagIncludedChunks: true,
    removeAvailableModules: true,
    usedExports: true,
};

const coreJSPkg = JSON.parse(readSync('node_modules/core-js/package.json'));

const configs = [
    {
        name: 'main',
        stats: 'minimal',
        target: 'browserslist',
        entry: './src/script/entry',
        plugins: [
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
                    theme_color: "%remove%",
                    icons: {
                        appleStartup: false,
                        windows: false,
                    }
                }
            })
        ],
        output: {
            publicPath: '/',
            clean: {
                keep: (filename) => {
                    return filename === 'style/unsupported_browser.css' ||
                        filename === 'script/browser.js' ||
                        /^sw\.js(\.map)?$/.test(filename) ||
                        filename === 'health_check' ||
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
                chunks: 'all',
                minSize: 2500,
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
                                        "corejs": coreJSPkg.version,
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
                        path.resolve(getDirname(), "src/html/module")
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
                                        "corejs": coreJSPkg.version,
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

export default configs;