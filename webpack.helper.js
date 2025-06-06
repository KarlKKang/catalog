import { htmlMinifyOptions } from './build_config.js';
import { TOP_DOMAIN, DESCRIPTION, WEBSITE_SUBDOMAIN_PREFIX, WEBSITE_PORT_SUFFIX, WEBSITE_NAME } from './env/index.js';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import webpack from 'webpack';
import { GenerateSW } from 'workbox-webpack-plugin';
import crypto from 'crypto';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { readSync } from './file_system.js';
import FaviconsWebpackPlugin from 'favicons-webpack-plugin';

function addFaviconPlugin(config, build) {
    const appName = WEBSITE_NAME(build !== 'production');
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
                developerName: TOP_DOMAIN,
                developerURL: 'https://' + TOP_DOMAIN,
                lang: "ja-JP",
                start_url: "/",
                display: 'browser',
                icons: {
                    appleStartup: false,
                    windows: false,
                }
            }
        })
    );
}

function addMiniCssExtractPlugin(config, build) {
    const filenameTemplate = build === 'alpha' ? 'style/[id].css' : 'style/[contenthash:6].css';
    config.plugins.push(
        new MiniCssExtractPlugin({
            filename: filenameTemplate,
            chunkFilename: filenameTemplate,
        }),
    );
}

function addHTMLConfig(config, build) {
    const dev = build !== 'production';
    const pageTitle = WEBSITE_NAME(dev);
    const domain = WEBSITE_SUBDOMAIN_PREFIX(dev) + TOP_DOMAIN + WEBSITE_PORT_SUFFIX(dev);

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

function addFontLoader(config, build) {
    config.module.rules.push({
        test: /\.woff2?$/i,
        type: 'asset/resource',
        generator: {
            filename: 'font/' + (build !== 'production' ? '[file]' : '[hash:5][ext]')
        }
    });
}

function addDefinePlugin(config, build) {
    const dev = build !== 'production';
    const pkg = JSON.parse(readSync('./package.json'));
    config.plugins.push(
        new webpack.DefinePlugin({
            ENABLE_DEBUG: JSON.stringify(build === 'alpha'),
            ENV_TOP_DOMAIN: JSON.stringify(TOP_DOMAIN),
            ENV_WEBSITE_SUBDOMAIN_PREFIX: JSON.stringify(WEBSITE_SUBDOMAIN_PREFIX(dev)),
            ENV_WEBSITE_PORT_SUFFIX: JSON.stringify(WEBSITE_PORT_SUFFIX(dev)),
            ENV_WEBSITE_NAME: JSON.stringify(WEBSITE_NAME(dev)),
            ENV_CLIENT_VERSION: JSON.stringify(pkg.version ?? '0.0.0'),
        })
    );
}

function addWorkboxPlugin(config, build) {
    config.plugins.push(
        new GenerateSW({
            inlineWorkboxRuntime: true,
            exclude: [/.*/],
            cleanupOutdatedCaches: true,
            clientsClaim: true,
            swDest: '../temp/sw_' + build + '.js',
            babelPresetEnvTargets: ['last 1 Chrome versions'], // Will be transpiled separately
            runtimeCaching: [
                {
                    urlPattern: () => {
                        return false;
                    },
                    handler: 'NetworkOnly',
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

function addCssLoader(config, build) {
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
                            getLocalIdent: build === 'alpha' ? undefined : getLocalIdent,
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

export function addPlugins(config, build) {
    addFaviconPlugin(config, build);
    addMiniCssExtractPlugin(config, build);
    addDefinePlugin(config, build);
    addHTMLConfig(config, build);
    addFontLoader(config, build);
    addWorkboxPlugin(config, build);
    addCssLoader(config, build);
}

export function getDirname() {
    const filename = fileURLToPath(import.meta.url);
    return dirname(filename);
}