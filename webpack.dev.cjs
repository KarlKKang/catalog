const config = require('./webpack.common.cjs');
const path = require('path');
const { addPlugins } = require('./webpack_helper.cjs');

config.mode = 'development';
config.output.path = path.resolve(__dirname, 'dev');
config.devtool = 'source-map';
addPlugins(config, true);

module.exports = config;