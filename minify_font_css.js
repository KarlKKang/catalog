import minifier from './css_minifier.js';

const srcDir = './src/font/';

const entries = [
    {
        dir: 'NotoSansJP',
        fonts: [
            'NotoSansJP-Light',
            'NotoSansJP-Regular',
            'NotoSansJP-Medium',
        ]
    },
    {
        dir: 'NotoSansTC',
        fonts: [
            'NotoSansTC-Light',
            'NotoSansTC-Regular',
            'NotoSansTC-Medium',
        ]
    },
    {
        dir: 'NotoSansSC',
        fonts: [
            'NotoSansSC-Light',
            'NotoSansSC-Regular',
            'NotoSansSC-Medium',
        ]
    },
    {
        dir: 'NotoSans',
        fonts: [
            'NotoSans-Light',
            'NotoSans-Regular',
            'NotoSans-Medium',
        ]
    },
    {
        dir: 'CourierNew',
        fonts: [
            'CourierNew-Regular',
        ]
    },
    {
        dir: 'Segoe',
        fonts: [
            'SegMDL2',
        ]
    }
];

for (const entry of entries) {
    for (const font of entry.fonts) {
        minifier(srcDir + entry.dir + '/', srcDir + 'dist/' + entry.dir + '/', font + '.css');
    }
}