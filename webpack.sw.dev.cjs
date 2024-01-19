const config = require('./webpack.sw.common.cjs');
const path = require('path');

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

module.exports = config;