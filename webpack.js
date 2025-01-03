import configs from './webpack.common.js';
import TerserPlugin from 'terser-webpack-plugin';
import path from 'path';
import { addPlugins, getDirname } from './webpack.helper.js';

const BUILD = process.env.BUILD;

let configMode = 'development';
let outputPath = path.resolve(getDirname(), 'dev');
let terserOptions = {
    extractComments: false,
    terserOptions: {
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
        sourceMap: true,
    },
};
let devtool = 'source-map';

if (BUILD === 'production') {
    outputPath = path.resolve(getDirname(), 'dist');
}

if (BUILD !== 'alpha') {
    configMode = 'production';
    terserOptions = {
        terserOptions: {
            ecma: 2015,
            compress: {
                passes: 5
            },
            module: true,
        },
    };
    devtool = false;
}

for (const config of configs) {
    config.mode = configMode;
    config.output.path = outputPath;
    config.optimization.minimizer.push(
        new TerserPlugin(terserOptions)
    );
    config.devtool = devtool;
}

const mainConfig = configs[0];
addPlugins(mainConfig, BUILD);
if (BUILD === 'alpha') {
    mainConfig.output.filename = 'script/[id].js';
} else {
    const filenameTemplate = 'script/[contenthash:6].js';
    mainConfig.output.filename = filenameTemplate;
    mainConfig.output.chunkFilename = filenameTemplate;
}

const swConfig = configs[1];
swConfig.entry = './temp/sw_' + BUILD + '.js';
if (BUILD === 'alpha') {
    swConfig.module.rules.push(
        {
            test: /\.js$/i,
            use: ['source-map-loader'],
            enforce: 'pre',
        }
    );
}

export default configs;