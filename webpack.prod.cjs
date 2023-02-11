const { merge } = require('webpack-merge');
const common = require('./webpack.common.cjs');
const TerserPlugin = require("terser-webpack-plugin");
const path = require('path');
const DOMAIN = require('./env').DOMAIN;;
const HtmlWebpackPlugin = require('html-webpack-plugin');
const htmlMinifyOptions = require('./build_config.cjs').htmlMinifyOptions;

const config = merge(common, {
    mode: 'production',
    output: {
        path: path.resolve(__dirname, 'dist/script'),
    },
    optimization: {
        minimize: true,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    ecma: 2015,
                    parse: {},
                    compress: {
                        passes: 5
                    },
                    mangle: true, // Note `mangle.properties` is `false` by default.
                    module: true,
                    // Deprecated
                    output: null,
                    format: null,
                    //toplevel: false,
                    nameCache: null,
                    ie8: false,
                    keep_classnames: undefined,
                    keep_fnames: false,
                    safari10: true,
                },
            }),
        ],
    },
});

for (const [page, _] of Object.entries(config.entry)) {
    config.plugins.push(
        new HtmlWebpackPlugin({
            minify: htmlMinifyOptions,
            chunks: [page],
            filename: '../' + page + '.html',
            template: 'src/html/' + page + '.ejs',
            templateParameters: {
                titleSuffix: DOMAIN,
                domain: DOMAIN,
                dev: false
            }
        })
    );
}

module.exports = config;