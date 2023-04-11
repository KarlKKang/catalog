const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const path = require('path');
const htmlMinifyOptions = require('./build_config.cjs').htmlMinifyOptions;

const config = {
    target: 'browserslist',
    entry: {},
    plugins: [],
    output: {
        filename: '[id].js',
        publicPath: '/script/',
        clean: true,
        chunkLoadingGlobal: 'loader'
    },
    optimization: {
        runtimeChunk: 'single',
        concatenateModules: true,
        flagIncludedChunks: true,
        removeAvailableModules: true,
        usedExports: true,
        splitChunks: {
            maxSize: 1000 * 1000,
            chunks: 'all'
        },
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json']
    },
    module: {
        rules: [
            {
                test: /\.(ts|js)x?$/,
                exclude: {
                    or: [
                        // Exclude libraries in node_modules ...
                        /node_modules/,
                    ],
                    not: [
                        // Except for a few of them that needs to be transpiled because they use modern syntax
                        /node_modules[\\\/]screenfull/,
                        /node_modules[\\\/]hls.js[\\\/]src/,
                    ]
                },
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [
                            [
                                "@babel/preset-env",
                                {
                                    "useBuiltIns": "entry",
                                    "corejs": "3.30",
                                    "modules": false
                                }
                            ],
                            "@babel/preset-typescript"
                        ],
                        plugins: ["@babel/plugin-transform-runtime"]
                    }
                }
            },
            {
                test: /\.ejs$/,
                include: [
                    path.resolve(__dirname, "src/html/module")
                ],
                loader: 'ejs-loader',
                options: {
                    variable: 'data',
                }
            },
            {
                test: /\.html$/i,
                loader: "html-loader",
                options: {
                    minimize: htmlMinifyOptions,
                },
            },
        ]
    }
};

const pages = [
    '404',
    'bangumi',
    'confirm_new_email',
    'console',
    'image',
    'index',
    'info',
    'login',
    'message',
    'my_account',
    'new_email',
    'news',
    'password_reset',
    'register',
    'request_password_reset',
    'special_register',
];

for (const page of pages) {
    config.entry[page] = {
        import: './src/script/' + page
    };
}

config.plugins.push(
    new BundleAnalyzerPlugin({
        analyzerMode: 'static',
        reportFilename: '../../webpack-bundle-analyzer-report.html'
    })
);

module.exports = config;