const htmlMinifyOptions = require('./build_config.cjs').htmlMinifyOptions;
const { DOMAIN, DESCRIPTION } = require('./env/index.cjs');;
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { DefinePlugin } = require('webpack');

module.exports.addHTMLConfig = function (config, dev) {
    const pageTitle = DOMAIN + (dev ? ' (alpha)' : '');

    config.plugins.push(
        new HtmlWebpackPlugin({
            minify: htmlMinifyOptions,
            filename: 'index.html',
            template: 'src/html/index.ejs',
            templateParameters: {
                title: pageTitle,
                description: DESCRIPTION,
            }
        })
    );

    config.plugins.push(
        new HtmlWebpackPlugin({
            minify: htmlMinifyOptions,
            filename: 'unsupported_browser.html',
            template: 'src/html/unsupported_browser.ejs',
            inject: false,
            templateParameters: {
                title: pageTitle,
                description: DESCRIPTION,
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