const htmlMinifyOptions = require('./build_config.cjs').htmlMinifyOptions;
const { DOMAIN, DESCRIPTION } = require('./env/index.cjs');;
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { DefinePlugin } = require('webpack');

module.exports.addHTMLConfig = function (config, dev) {
    const pages = [
        'entry',
        'entry_no_index',
    ];
    const pageTitle = DOMAIN + (dev ? ' (alpha)' : '');

    for (const page of pages) {
        config.plugins.push(
            new HtmlWebpackPlugin({
                minify: htmlMinifyOptions,
                filename: page + '.html',
                template: 'src/html/' + page + '.ejs',
                templateParameters: {
                    title: pageTitle,
                    description: DESCRIPTION,
                    dev: dev
                }
            })
        );
    }

    config.plugins.push(
        new HtmlWebpackPlugin({
            minify: htmlMinifyOptions,
            filename: 'unsupported_browser.html',
            template: 'src/html/unsupported_browser.ejs',
            inject: false,
            templateParameters: {
                title: pageTitle,
                description: DESCRIPTION,
                dev: dev
            }
        })
    );
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