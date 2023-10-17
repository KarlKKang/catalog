const htmlMinifyOptions = require('./build_config.cjs').htmlMinifyOptions;
const { DOMAIN, DESCRIPTION } = require('./env/index.cjs');;
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { DefinePlugin } = require('webpack');
const { GenerateSW } = require('workbox-webpack-plugin');

module.exports.addHTMLConfig = function (config, dev) {
    const pageTitle = DOMAIN + (dev ? ' (alpha)' : '');

    config.plugins.push(
        new HtmlWebpackPlugin({
            minify: htmlMinifyOptions,
            filename: 'index.html',
            template: 'src/html/index.ejs',
            templateParameters: {
                title: pageTitle,
                description: DESCRIPTION,
            }
        })
    );

    config.plugins.push(
        new HtmlWebpackPlugin({
            minify: htmlMinifyOptions,
            filename: 'unsupported_browser.html',
            template: 'src/html/unsupported_browser.ejs',
            inject: false,
            templateParameters: {
                title: pageTitle,
                description: DESCRIPTION,
            }
        })
    );
};

module.exports.addFontLoader = function (config, dev) {
    config.module.rules.push({
        test: /\.woff2?$/i,
        type: 'asset/resource',
        generator: {
            filename: 'font/' + (dev ? '[file]' : '[hash][ext]')
        }
    });
}

module.exports.addDefinePlugin = function (config, dev) {
    config.plugins.push(
        new DefinePlugin({
            DEVELOPMENT: JSON.stringify(dev),
            ENV_DOMAIN: JSON.stringify(DOMAIN),
        })
    );
}

module.exports.addWorkboxPlugin = function (config, dev) {
    const domain = (dev ? 'alpha.' : '') + DOMAIN;
    const domainEscaped = domain.replace(/\./g, '\\.');
    config.plugins.push(
        new GenerateSW({
            include: [/\.js$/i, /\.css$/i, /index\.html$/i],
            ignoreURLParametersMatching: [/.*/],
            cleanupOutdatedCaches: true,
            clientsClaim: true,
            directoryIndex: null,
            swDest: '../temp/sw.js',
            navigateFallback: '/',
            navigateFallbackDenylist: [/^\/unsupported_browser$/],
            babelPresetEnvTargets: ['last 1 Chrome versions'], // Will be transpiled separately
            manifestTransforms: [
                (manifestEntries, _) => {
                    return {
                        manifest: manifestEntries.map((entry) => {
                            if (entry.url === '/index.html') {
                                entry.url = '/';
                            }
                            return entry;
                        })
                    };
                }
            ],
            runtimeCaching: [
                {
                    urlPattern: /\.woff2?$/,
                    handler: 'CacheFirst',
                    options: {
                        cacheName: 'font',
                        cacheableResponse: {
                            statuses: [200],
                        },
                        matchOptions: {
                            ignoreSearch: true,
                            ignoreVary: true,
                        },
                        expiration: {
                            maxEntries: 3000,
                            maxAgeSeconds: 60 * 60 * 24 * 365,
                            purgeOnQuotaError: true,
                            matchOptions: {
                                ignoreSearch: true,
                                ignoreVary: true,
                            },
                        },
                        backgroundSync: {
                            name: 'font',
                            options: {
                                maxRetentionTime: 24 * 60, // In minutes
                            },
                        },
                    },
                },
                {
                    urlPattern: new RegExp('^https://' + domainEscaped + '/icon/'),
                    handler: 'CacheFirst',
                    options: {
                        cacheName: 'icon',
                        cacheableResponse: {
                            statuses: [200],
                        },
                        matchOptions: {
                            ignoreSearch: true,
                            ignoreVary: true,
                        },
                        expiration: {
                            maxEntries: 100,
                            maxAgeSeconds: 60 * 60 * 24 * 365,
                            purgeOnQuotaError: true,
                            matchOptions: {
                                ignoreSearch: true,
                                ignoreVary: true,
                            },
                        },
                        backgroundSync: {
                            name: 'icon',
                            options: {
                                maxRetentionTime: 24 * 60,
                            },
                        },
                    },
                },
            ]
        }),
    );
}