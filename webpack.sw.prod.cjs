const config = require('./webpack.sw.common.cjs');
const TerserPlugin = require('terser-webpack-plugin');
const path = require('path');
const { terserOptions } = require('./build_config.cjs');

config.mode = 'production';
config.output.path = path.resolve(__dirname, 'dist');
config.optimization.minimizer.push(
    new TerserPlugin({
        terserOptions: terserOptions,
    })
);

module.exports = config;