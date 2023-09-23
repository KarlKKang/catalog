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