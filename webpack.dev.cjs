const { merge } = require('webpack-merge');
const common = require('./webpack.common.cjs');
const path = require('path');
const { addHTMLConfig, addFontLoader, addDefinePlugin } = require('./webpack_helper.cjs');

const config = merge(common, {
    mode: 'development',
    devtool: 'source-map',
    output: {
        path: path.resolve(__dirname, 'dev'),
    }
});

addDefinePlugin(config, true);
addHTMLConfig(config, true);
addFontLoader(config, true);

module.exports = config;