const { merge } = require('webpack-merge');
const common = require('./webpack.common.cjs');
const TerserPlugin = require('terser-webpack-plugin');
const path = require('path');
const { addHTMLConfig, addFontLoader, addDefinePlugin } = require('./webpack_helper.cjs');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const { cssMinifyOptions } = require('./build_config.cjs');

const config = merge(common, {
    mode: 'production',
    output: {
        path: path.resolve(__dirname, 'dist'),
    },
    optimization: {
        minimize: true,
        minimizer: [
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
            }),
            new CssMinimizerPlugin({
                minimizerOptions: cssMinifyOptions,
            }),
        ],
    },
});

addDefinePlugin(config, false);
addHTMLConfig(config, false);
addFontLoader(config, false);

module.exports = config;