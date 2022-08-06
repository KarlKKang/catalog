const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const TerserPlugin = require("terser-webpack-plugin");
const path = require('path');

module.exports = merge(common, {
    mode: 'production',
    output: {
        path: path.resolve(__dirname, 'dist/script'),
    },
    optimization: {
        mangleExports: 'size',
        minimize: true,
        minimizer: [
            new TerserPlugin({
                terserOptions: {
                    ecma: 5,
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
        ],
    },
});