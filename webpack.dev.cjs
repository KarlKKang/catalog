const { merge } = require('webpack-merge');
const common = require('./webpack.common.cjs');
const path = require('path');
const { DefinePlugin } = require('webpack');

const config = merge(common, {
    mode: 'development',
    devtool: 'source-map',
    output: {
        path: path.resolve(__dirname, 'dev/script'),
    }
});

config.plugins.push(
    new DefinePlugin({
        DEVELOPMENT: JSON.stringify(true),
    })
);

require('./webpack_helper.cjs').addHTMLConfig(config, true);

module.exports = config;