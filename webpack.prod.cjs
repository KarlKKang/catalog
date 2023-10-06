const config = require('./webpack.common.cjs');
const TerserPlugin = require('terser-webpack-plugin');
const path = require('path');
const { addHTMLConfig, addFontLoader, addDefinePlugin } = require('./webpack_helper.cjs');

config.mode = 'production';
config.output.path = path.resolve(__dirname, 'dist');
config.optimization.minimizer.push(
    new TerserPlugin({
        terserOptions: {
            ecma: 2015,
            parse: {},
            compress: {
                passes: 5
            },
            mangle: true, // Note `mangle.properties` is `false` by default.
            module: true,
            // Deprecated
            output: null,
            format: null,
            //toplevel: false,
            nameCache: null,
            ie8: false,
            keep_classnames: undefined,
            keep_fnames: false,
            safari10: true,
        },
    })
);
addDefinePlugin(config, false);
addHTMLConfig(config, false);
addFontLoader(config, false);

module.exports = config;