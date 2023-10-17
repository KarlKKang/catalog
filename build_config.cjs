module.exports.htmlMinifyOptions = {
    collapseBooleanAttributes: true,
    collapseWhitespace: true,
    keepClosingSlash: false,
    quoteCharacter: '"',
    removeAttributeQuotes: true,
    removeComments: true,
    removeRedundantAttributes: true,
    useShortDoctype: true,
    sortAttributes: true,
    sortClassName: true
};

module.exports.cssMinifyOptions = {
    preset: [
        'cssnano-preset-advanced',
        {
            autoprefixer: {
                add: true,
                remove: true,
                supports: true,
                flexbox: true,
            },
            cssDeclarationSorter: {
                order: "smacss"
            },
            zindex: false,
            discardUnused: false,
            reduceIdents: false
        }
    ]
};

module.exports.terserOptions = {
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
};