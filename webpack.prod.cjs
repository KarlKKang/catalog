const configs = require('./webpack.common.cjs');
const TerserPlugin = require('terser-webpack-plugin');
const path = require('path');
const { addPlugins } = require('./webpack_helper.cjs');

for (const config of configs) {
    config.mode = 'production';
    config.output.path = path.resolve(__dirname, 'dist');
    config.optimization.minimizer.push(
        new TerserPlugin({
            terserOptions: {
                ecma: 2015,
                compress: {
                    passes: 5
                },
                module: true,
                safari10: true,
            },
        })
    );
}

addPlugins(configs[0], false);
configs[1].entry = './temp/sw.js';

module.exports = configs;