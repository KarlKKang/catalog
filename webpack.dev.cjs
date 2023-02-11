const { merge } = require('webpack-merge');
const common = require('./webpack.common.cjs');
const path = require('path');
const DOMAIN = require('./env').DOMAIN;;
const HtmlWebpackPlugin = require('html-webpack-plugin');
const htmlMinifyOptions = require('./build_config.cjs').htmlMinifyOptions;

const config = merge(common, {
    mode: 'development',
    devtool: 'source-map',
    output: {
        path: path.resolve(__dirname, 'dev/script'),
    }
});

for (const [page, _] of Object.entries(config.entry)) {
    config.plugins.push(
        new HtmlWebpackPlugin({
            minify: htmlMinifyOptions,
            chunks: [page],
            filename: '../' + page + '.html',
            template: 'src/html/' + page + '.ejs',
            templateParameters: {
                titleSuffix: DOMAIN + ' (alpha)',
                domain: DOMAIN,
                dev: true
            }
        })
    );
}

module.exports = config;