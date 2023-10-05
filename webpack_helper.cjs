const htmlMinifyOptions = require('./build_config.cjs').htmlMinifyOptions;
const { DOMAIN } = require('./env/index.cjs');;
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { DefinePlugin } = require('webpack');

module.exports.addHTMLConfig = function (config, dev) {
    const pages = [
        'entry',
        'entry_no_index',
        'entry_no_theme_no_index',
    ];

    for (const page of pages) {
        config.plugins.push(
            new HtmlWebpackPlugin({
                minify: htmlMinifyOptions,
                filename: page + '.html',
                template: 'src/html/' + page + '.ejs',
                templateParameters: {
                    title: DOMAIN + (dev ? ' (alpha)' : ''),
                    dev: dev
                }
            })
        );
    }
};

module.exports.addFontLoader = function (config, dev) {
    config.module.rules.push({
        test: /\.woff2?$/i,
        type: 'asset/resource',
        generator: {
            filename: 'font/' + (dev ? '[file]' : '[hash][ext]')
        }
    });
}

module.exports.addDefinePlugin = function (config, dev) {
    config.plugins.push(
        new DefinePlugin({
            DEVELOPMENT: JSON.stringify(dev),
            ENV_DOMAIN: JSON.stringify(DOMAIN),
        })
    );
}