const { merge } = require('webpack-merge');
const common = require('./webpack.common.cjs');
const path = require('path');

module.exports = merge(common, {
    mode: 'development',
    devtool: 'source-map',
    output: {
        path: path.resolve(__dirname, 'dev/script'),
    }
});