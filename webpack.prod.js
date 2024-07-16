import configs from './webpack.common.js';
import TerserPlugin from 'terser-webpack-plugin';
import path from 'path';
import { addPlugins, getDirname } from './webpack.helper.js';

for (const config of configs) {
    config.mode = 'production';
    config.output.path = path.resolve(getDirname(), 'dist');
    config.optimization.minimizer.push(
        new TerserPlugin({
            terserOptions: {
                ecma: 2015,
                compress: {
                    passes: 5
                },
                module: true,
            },
        })
    );
}

addPlugins(configs[0], false);
const filenameTemplate = 'script/[contenthash:5].js';
configs[0].output.filename = filenameTemplate;
configs[0].output.chunkFilename = filenameTemplate;
configs[1].entry = './temp/sw.js';

export default configs;