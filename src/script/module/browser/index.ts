import { getMediaSource } from 'hls.js/src/utils/mediasource-helper';
import { isSupported } from 'hls.js/src/is-supported';
import { UAParser } from 'ua-parser-js';

import { w, createElement } from '../DOM';

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
    IS_WINDOWS = osName === 'windows';
    IS_MACOS = osName === 'mac os';

    const SUPPORTED_BLINK = engineName === 'blink' && engineVersion >= 62;
    UNRECOMMENDED_BROWSER = (!SUPPORTED_BLINK && !IS_SAFARI) || browserName.includes('wechat') || browserName === 'ucbrowser';
}

const audioElem = createElement('audio') as HTMLAudioElement;
const videoElem = createElement('video') as HTMLVideoElement;

const NATIVE_HLS = (videoElem.canPlayType('application/vnd.apple.mpegurl') != '') && (audioElem.canPlayType('application/vnd.apple.mpegurl') != '') && IS_IOS;
const USE_MSE = isSupported() && !NATIVE_HLS;


let CAN_PLAY_ALAC = false;
let CAN_PLAY_FLAC = false;
const CAN_PLAY_MP3 = audioElem.canPlayType('audio/mpeg') != '';
let CAN_PLAY_AVC_AAC = false;

if (USE_MSE) {
    const mediaSource = getMediaSource();
    if (mediaSource !== undefined) {
        CAN_PLAY_ALAC = mediaSource.isTypeSupported('audio/mp4; codecs="alac"');
        CAN_PLAY_FLAC = mediaSource.isTypeSupported('audio/mp4; codecs="flac"') || mediaSource.isTypeSupported('audio/mp4; codecs="fLaC"');
        CAN_PLAY_AVC_AAC = mediaSource.isTypeSupported('video/mp4; codecs="avc1.640032,mp4a.40.2"');
    }
    //CAN_PLAY_MP3 = mediaSource.isTypeSupported('audio/mpeg'); //Firefox fails this test, but can still play mp3 in MSE.
} else if (NATIVE_HLS) {
    CAN_PLAY_ALAC = audioElem.canPlayType('audio/mp4; codecs="alac"') != '';
    CAN_PLAY_FLAC = audioElem.canPlayType('audio/mp4; codecs="flac"') != '';
    CAN_PLAY_AVC_AAC = audioElem.canPlayType('video/mp4; codecs="avc1.640032,mp4a.40.2"') != '';
    //CAN_PLAY_MP3 = audioElem.canPlayType('audio/mpeg') != "";
}

UNRECOMMENDED_BROWSER = UNRECOMMENDED_BROWSER || !CAN_PLAY_AVC_AAC || !(CAN_PLAY_FLAC || CAN_PLAY_ALAC);

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
export { CAN_PLAY_AVC_AAC };