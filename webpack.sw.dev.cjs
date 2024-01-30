const config = require('./webpack.sw.common.cjs');
const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');
const { terserDevOptions } = require('./build_config.cjs');

config.entry = './temp/sw_alpha.js';
config.mode = 'development';
config.output.path = path.resolve(__dirname, 'dev');
config.devtool = 'source-map';
config.module.rules.push(
    {
        test: /\.js$/i,
        use: ['source-map-loader'],
        enforce: 'pre',
    }
);
config.optimization.minimizer = [
    new TerserPlugin({
        terserOptions: terserDevOptions,
    })
];

module.exports = config;