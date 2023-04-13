import { getMediaSource, isSupported } from './hls_helper';
import { UAParser } from 'ua-parser-js';

import { w, createElement } from '../dom';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
    interface Window {
        chrome: any;
    }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

const ua: UAParser.IResult | null = function () {
    try {
        return UAParser(typeof navigator !== 'undefined' ? navigator.userAgent.toLowerCase() : '');
    }
    catch (e) {
        return null;
    }
}();

let IS_IOS = false;
let IS_SAFARI = false;
const IS_CHROMIUM = !!w.chrome;
let IS_FIREFOX = false;
let IS_EDGE = false;
let IS_WINDOWS = false;
let IS_MACOS = false;
let UNRECOMMENDED_BROWSER = false;

if (ua !== null) {
    const browserName = ua.browser.name ? ua.browser.name.toLowerCase() : '';
    const osName = ua.os.name ? ua.os.name.toLowerCase() : '';
    const engineName = ua.engine.name ? ua.engine.name.toLowerCase() : '';
    const engineVersion = ua.engine.version ? parseFloat(ua.engine.version) : NaN;

    IS_IOS = browserName === 'mobile safari' || osName === 'ios' || (browserName === 'safari' && 'ontouchend' in document);
    IS_SAFARI = IS_IOS || browserName === 'safari';
    IS_FIREFOX = browserName.includes('firefox') && !IS_IOS;
    IS_EDGE = browserName === 'edge';
    IS_WINDOWS = osName === 'windows';
    IS_MACOS = osName === 'mac os';

    const SUPPORTED_BLINK = engineName === 'blink' && engineVersion >= 62;
    UNRECOMMENDED_BROWSER = (!SUPPORTED_BLINK && !IS_SAFARI) || browserName.includes('wechat') || browserName === 'ucbrowser';
}

const audioElem = createElement('audio') as HTMLAudioElement;
const videoElem = createElement('video') as HTMLVideoElement;

const NATIVE_HLS = (videoElem.canPlayType('application/vnd.apple.mpegurl') != '') && (audioElem.canPlayType('application/vnd.apple.mpegurl') != '') && IS_IOS;
const USE_MSE = isSupported() && !NATIVE_HLS;

const CAN_PLAY_ALAC = audioCanPlay('alac');
const CAN_PLAY_FLAC = audioCanPlay('flac') || audioCanPlay('fLaC');
const CAN_PLAY_MP3 = audioCanPlay('mp3') || canPlay('audio', 'mpeg', ''); // mp3: Firefox; mpeg: Safari and Chrome
const CAN_PLAY_AVC = videoCanPlay('avc1.640032');
const CAN_PLAY_HEVC41 = videoCanPlay('hvc1.2.4.H123.90') && !(IS_WINDOWS && IS_EDGE);
const CAN_PLAY_AAC = audioCanPlay('mp4a.40.2');
const CAN_PLAY_AC3 = audioCanPlay('ac-3');

UNRECOMMENDED_BROWSER = UNRECOMMENDED_BROWSER || !(CAN_PLAY_AVC && CAN_PLAY_AAC) || !(CAN_PLAY_FLAC || CAN_PLAY_ALAC);

export { IS_CHROMIUM };
export { IS_IOS };
export { IS_FIREFOX };
export { IS_WINDOWS };
export { IS_MACOS };
export { UNRECOMMENDED_BROWSER };

export { NATIVE_HLS };
export { USE_MSE };
export { CAN_PLAY_ALAC };
export { CAN_PLAY_FLAC };
export { CAN_PLAY_MP3 };
export { CAN_PLAY_AVC };
export { CAN_PLAY_HEVC41 };
export { CAN_PLAY_AAC };
export { CAN_PLAY_AC3 };

export function videoCanPlay(codecs: string): boolean {
    return canPlay('video', 'mp4', codecs);
}

export function audioCanPlay(codecs: string): boolean {
    return canPlay('audio', 'mp4', codecs);
}

function canPlay(type: 'video' | 'audio', container: string, codecs: string): boolean {
    if (codecs !== '') {
        codecs = `; codecs="${codecs}"`;
    }
    if (USE_MSE) {
        const mediaSource = getMediaSource();
        if (mediaSource === undefined) {
            return false; // Shouldn't be reached.
        }
        return mediaSource.isTypeSupported(`${type}/${container}${codecs}`);
    } else {
        let mediaElement: HTMLMediaElement;
        if (type === 'video') {
            mediaElement = videoElem;
        } else {
            mediaElement = audioElem;
        }
        return mediaElement.canPlayType(`${type}/${container}${codecs}`) != '';
    }
}