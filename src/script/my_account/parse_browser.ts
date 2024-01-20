import { UAParser } from 'ua-parser-js';

export default function (userAgent: string) {
    const ua = UAParser(userAgent);
    const UNKNOWN = '不明';
    let browser = ua.browser.name;
    if (browser === undefined) {
        browser = UNKNOWN;
    } else {
        const browserVer = ua.browser.version;
        if (browserVer !== undefined) {
            browser += ' ' + browserVer;
        }
    }
    let os = ua.os.name;
    if (os === undefined) {
        os = UNKNOWN;
    } else {
        const osVer = ua.os.version;
        if (osVer !== undefined) {
            os += ' ' + osVer;
        }
    }

    return [browser, os] as const;
}