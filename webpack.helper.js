import { htmlMinifyOptions } from './build_config.js';
import { DOMAIN, DESCRIPTION } from './env/index.js';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack from 'webpack';
import { GenerateSW } from 'workbox-webpack-plugin';
import crypto from 'crypto';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readSync } from './file_system.js';
import FaviconsWebpackPlugin from 'favicons-webpack-plugin';

function getWebsiteName(dev) {
    return DOMAIN + (dev ? ' (alpha)' : '');
}

function addFaviconPlugin(config, dev) {
    const appName = getWebsiteName(dev);
    config.plugins.push(
        new FaviconsWebpackPlugin({
            logo: './src/icon/icon.png',
            logoMaskable: './src/icon/icon_maskable.png',
            prefix: '/icon/',
            mode: 'webapp',
            devMode: 'webapp',
            favicons: {
                appName: appName,
                appShortName: appName,
                appDescription: DESCRIPTION,
                developerName: DOMAIN,
                developerURL: 'https://' + DOMAIN,
                lang: "ja-JP",
                start_url: "/",
                theme_color: "%remove%",
                icons: {
                    appleStartup: false,
                    windows: false,
                }
            }
        })
    );
}

function addMiniCssExtractPlugin(config, dev) {
    const filenameTemplate = dev ? 'style/[id].css' : 'style/[contenthash:6].css';
    config.plugins.push(
        new MiniCssExtractPlugin({
            filename: filenameTemplate,
            chunkFilename: filenameTemplate,
        }),
    );
}

function addHTMLConfig(config, dev) {
    const pageTitle = getWebsiteName(dev);
    const domain = (dev ? 'alpha.' : '') + DOMAIN;

    config.plugins.push(
        new HtmlWebpackPlugin({
            minify: htmlMinifyOptions,
            filename: 'index.html',
            template: 'src/html/index.ejs',
            templateParameters: {
                title: pageTitle,
                description: DESCRIPTION,
                domain: domain,
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
                domain: domain,
            }
        })
    );
};

function addFontLoader(config, dev) {
    config.module.rules.push({
        test: /\.woff2?$/i,
        type: 'asset/resource',
        generator: {
            filename: 'font/' + (dev ? '[file]' : '[hash:5][ext]')
        }
    });
}

function addDefinePlugin(config, dev) {
    config.plugins.push(
        new webpack.DefinePlugin({
            DEVELOPMENT: JSON.stringify(dev),
            ENV_DOMAIN: JSON.stringify(DOMAIN),
        })
    );
}

function addWorkboxPlugin(config, dev) {
    const destDir = dev ? 'dev/' : 'dist/';
    const browserScript = destDir + 'script/browser.js';
    const buffer = readSync(browserScript);
    const hash = crypto.createHash('md5');
    hash.update(buffer);
    const browserScriptRevision = hash.digest('hex');

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
                    urlPattern: ({ url }) => {
                        return url.pathname.endsWith('.woff2');
                    },
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
                    urlPattern: ({ url }) => {
                        return url.pathname.startsWith('/icon/');
                    },
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

const localIdentCache = new Map();
const localIdentLookup = new Map();
function getLocalIdent(context, _, localName) {
    const key = context.resourcePath + '/' + localName;
    const cached = localIdentCache.get(key);
    if (cached !== undefined) {
        return cached;
    }

    const hash = crypto.createHash('md5');
    hash.update(key);
    let ident = hash.digest('base64');
    ident = ident.replaceAll(/[+/=]/g, '_');
    const nonNumIndex = ident.search(/[^0-9]/);
    if (nonNumIndex === -1) {
        ident = '_' + ident;
    } else {
        ident = ident.slice(nonNumIndex);
    }
    ident = ident.slice(0, 3);

    const existing = localIdentLookup.get(ident);
    if (existing !== undefined) {
        throw new Error('CSS class name collision: ' + ident + ' (' + key + ' and ' + existing + ')');
    }
    localIdentCache.set(key, ident);
    localIdentLookup.set(ident, key);

    return ident;
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
                            exportLocalsConvention: 'camel-case-only',
                            localIdentName: '[path][name]__[local]',
                            getLocalIdent: dev ? undefined : getLocalIdent,
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

export function addPlugins(config, dev) {
    addFaviconPlugin(config, dev);
    addMiniCssExtractPlugin(config, dev);
    addDefinePlugin(config, dev);
    addHTMLConfig(config, dev);
    addFontLoader(config, dev);
    addWorkboxPlugin(config, dev);
    addCssLoader(config, dev);
}

export function getDirname() {
    const filename = fileURLToPath(import.meta.url);
    return dirname(filename);
}