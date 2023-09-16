const htmlMinifyOptions = require('./build_config.cjs').htmlMinifyOptions;
const { DOMAIN } = require('./env');;
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports.addHTMLConfig = function (config, dev) {
    const pages = [
        '404',
        'bangumi',
        'confirm_new_email',
        'console',
        'image',
        'index',
        'info',
        'login',
        'message',
        'my_account',
        'new_email',
        'news',
        'password_reset',
        'register',
        'request_password_reset',
        'special_register',
    ];

    for (const page of pages) {
        config.plugins.push(
            new HtmlWebpackPlugin({
                minify: htmlMinifyOptions,
                filename: '../' + page + '.html',
                template: 'src/html/' + page + '.ejs',
                templateParameters: {
                    titleSuffix: DOMAIN + (dev ? ' (alpha)' : ''),
                    domain: DOMAIN,
                    dev: dev
                }
            })
        );
    }
};