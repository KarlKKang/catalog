const configs = require('./webpack.common.cjs');
const TerserPlugin = require('terser-webpack-plugin');
const path = require('path');
const { addPlugins } = require('./webpack_helper.cjs');

for (const config of configs) {
    config.mode = 'development';
    config.output.path = path.resolve(__dirname, 'dev');
    config.devtool = 'source-map';
    config.optimization.minimizer.push(
        new TerserPlugin({
            extractComments: false,
            terserOptions: {
                ecma: 2015,
                compress: {
                    defaults: false,
                    dead_code: true,
                    unused: true,
                },
                mangle: false,
                module: true,
                format: {
                    comments: 'all',
                },
                sourceMap: true,
            },
        })
    );
}

addPlugins(configs[0], true);
configs[1].entry = './temp/sw_alpha.js';
configs[1].module.rules.push(
    {
        test: /\.js$/i,
        use: ['source-map-loader'],
        enforce: 'pre',
    }
);

module.exports = configs;