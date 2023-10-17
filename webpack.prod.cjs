const config = require('./webpack.common.cjs');
const TerserPlugin = require('terser-webpack-plugin');
const path = require('path');
const { addHTMLConfig, addFontLoader, addDefinePlugin, addWorkboxPlugin } = require('./webpack_helper.cjs');
const { terserOptions } = require('./build_config.cjs');

config.mode = 'production';
config.output.path = path.resolve(__dirname, 'dist');
config.optimization.minimizer.push(
    new TerserPlugin({
        terserOptions: terserOptions,
    })
);
addDefinePlugin(config, false);
addHTMLConfig(config, false);
addFontLoader(config, false);
addWorkboxPlugin(config, false);

module.exports = config;