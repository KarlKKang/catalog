const { merge } = require('webpack-merge');
const common = require('./webpack.common.cjs');
const path = require('path');

const config = merge(common, {
    mode: 'development',
    devtool: 'source-map',
    output: {
        path: path.resolve(__dirname, 'dev/script'),
    }
});
require('./webpack_helper.cjs').addHTMLConfig(config, true);

module.exports = config;