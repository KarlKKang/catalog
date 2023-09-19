const { merge } = require('webpack-merge');
const common = require('./webpack.common.cjs');
const path = require('path');
const { DefinePlugin } = require('webpack');
const { addHTMLConfig, addFontLoader } = require('./webpack_helper.cjs');

const config = merge(common, {
    mode: 'development',
    devtool: 'source-map',
    output: {
        path: path.resolve(__dirname, 'dev'),
    }
});

config.plugins.push(
    new DefinePlugin({
        DEVELOPMENT: JSON.stringify(true),
    })
);

addHTMLConfig(config, true);
addFontLoader(config, true);

module.exports = config;