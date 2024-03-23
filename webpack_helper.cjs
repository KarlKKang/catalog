const htmlMinifyOptions = require('./build_config.cjs').htmlMinifyOptions;
const { DOMAIN, DESCRIPTION } = require('./env/index.cjs');;
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { DefinePlugin } = require('webpack');
const { GenerateSW } = require('workbox-webpack-plugin');
const fs = require('fs');
const crypto = require('crypto');
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

function addHTMLConfig(config, dev) {
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

function addFontLoader(config, dev) {
    config.module.rules.push({
        test: /\.woff2?$/i,
        type: 'asset/resource',
        generator: {
            filename: 'font/' + (dev ? '[file]' : '[hash][ext]')
        }
    });
}

function addDefinePlugin(config, dev) {
    config.plugins.push(
        new DefinePlugin({
            DEVELOPMENT: JSON.stringify(dev),
            ENV_DOMAIN: JSON.stringify(DOMAIN),
        })
    );
}

function addWorkboxPlugin(config, dev) {
    const destDir = dev ? 'dev/' : 'dist/';
    const browserScript = destDir + 'script/browser.js';
    const buffer = fs.readFileSync(browserScript);
    const hash = crypto.createHash('md5');
    hash.update(buffer);
    const browserScriptRevision = hash.digest('hex');

    const domain = (dev ? 'alpha.' : '') + DOMAIN;
    const domainEscaped = domain.replace(/\./g, '\\.');
    config.plugins.push(
        new GenerateSW({
            inlineWorkboxRuntime: true,
            include: [/\.js$/i, /\.css$/i, /index\.html$/i],
            ignoreURLParametersMatching: [/.*/],
            cleanupOutdatedCaches: true,
            clientsClaim: true,
            directoryIndex: null,
            swDest: '../temp/' + (dev ? 'sw_alpha.js' : 'sw.js'),
            navigateFallback: '/',
            navigateFallbackDenylist: [/^\/unsupported_browser$/],
            babelPresetEnvTargets: ['last 1 Chrome versions'], // Will be transpiled separately
            additionalManifestEntries: [
                {
                    url: '/script/browser.js',
                    revision: browserScriptRevision,
                }
            ],
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

function addCssLoader(config, dev) {
    config.module.rules.push(
        {
            test: /(?<!\.module)\.s?css$/i,
            use: [
                MiniCssExtractPlugin.loader,
                'css-loader'
            ],
            sideEffects: true,
        },
        {
            test: /\.module\.s?css$/i,
            use: [
                MiniCssExtractPlugin.loader,
                {
                    loader: 'css-loader',
                    options: {
                        modules: {
                            namedExport: true,
                            localIdentName: dev ? '[path][name]__[local]' : '[hash:base64]',
                        }
                    }
                }
            ],
        },
        {
            test: /\.scss$/i,
            use: [
                'sass-loader',
            ],
        }
    );
}

module.exports.addPlugins = function (config, dev) {
    addDefinePlugin(config, dev);
    addHTMLConfig(config, dev);
    addFontLoader(config, dev);
    addWorkboxPlugin(config, dev);
    addCssLoader(config, dev);
}

module.exports.getCoreJSVersion = function () {
    const pkg = require('core-js/package.json');
    return pkg.version;
}