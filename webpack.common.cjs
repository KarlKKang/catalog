const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const path = require('path');
const htmlMinifyOptions = require('./build_config.cjs').htmlMinifyOptions;

const config = {
    target: 'browserslist',
    entry: './src/script/entry',
    plugins: [],
    output: {
        filename: '[id].js',
        publicPath: '/script/',
        clean: true,
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
                            "@babel/preset-typescript"
                        ],
                        plugins: [
                            [
                                "const-enum",
                                {
                                    "transform": "constObject"
                                }
                            ],
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
        ]
    }
};

config.plugins.push(
    new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        reportFilename: '../../webpack-bundle-analyzer-report.html'
    })
);

module.exports = config;