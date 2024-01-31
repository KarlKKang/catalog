const config = require('./webpack.common.cjs');
const path = require('path');
const { addPlugins } = require('./webpack_helper.cjs');
const TerserPlugin = require('terser-webpack-plugin');
const { terserDevOptions } = require('./build_config.cjs');

config.mode = 'development';
config.output.path = path.resolve(__dirname, 'dev');
config.devtool = 'source-map';
config.optimization.minimizer.push(
    new TerserPlugin({
        extractComments: false,
        terserOptions: terserDevOptions,
    })
);
addPlugins(config, true);

module.exports = config;