const { getCoreJSVersion } = require('./webpack_helper.cjs');
const { webpackOptimization } = require('./build_config.cjs');

const config = {
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
        ...webpackOptimization,
        minimize: true,
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
};

module.exports = config;