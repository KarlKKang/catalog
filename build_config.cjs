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
    compress: {
        passes: 5
    },
    module: true,
    safari10: true,
};

module.exports.terserDevOptions = {
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
    safari10: true,
};