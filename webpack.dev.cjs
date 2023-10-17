const config = require('./webpack.common.cjs');
const path = require('path');
const { addHTMLConfig, addFontLoader, addDefinePlugin, addWorkboxPlugin } = require('./webpack_helper.cjs');

config.mode = 'development';
config.output.path = path.resolve(__dirname, 'dev');
config.devtool = 'source-map';
addDefinePlugin(config, true);
addHTMLConfig(config, true);
addFontLoader(config, true);
addWorkboxPlugin(config, true);

module.exports = config;