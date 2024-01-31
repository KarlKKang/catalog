import { getManagedMediaSource, getMediaSource, isSupported } from './hls_helper';
import { UAParser } from 'ua-parser-js';

import { createAudioElement, createVideoElement, w } from '../dom';

declare global {
    interface Window {
        chrome: any;
    }
}

let IS_IOS = false;
let IS_SAFARI = false;
const IS_CHROMIUM = !!w.chrome;
let IS_FIREFOX = false;
let IS_WINDOWS = false;
let IS_MACOS = false;
let UNRECOMMENDED_BROWSER = false;
const MIN_MSE_BUFFER_SIZE = 95; // The minimum buffer size for MSE in order for the videos to play properly. Browsers with smaller buffer size will be considered as unsupported.
let MSE_BUFFER_SIZE = MIN_MSE_BUFFER_SIZE;

(function () {
    if (typeof navigator === 'undefined') {
        return;
    }

    const ua = UAParser();

    const browserName = ua.browser.name ? ua.browser.name.toLowerCase() : '';
    const osName = ua.os.name ? ua.os.name.toLowerCase() : '';
    const engineName = ua.engine.name ? ua.engine.name.toLowerCase() : '';
    const engineVersion = ua.engine.version ? parseFloat(ua.engine.version) : NaN;

    IS_IOS = browserName === 'mobile safari' || osName === 'ios' || (browserName === 'safari' && 'ontouchend' in document);
    IS_SAFARI = IS_IOS || browserName === 'safari';
    IS_FIREFOX = browserName.includes('firefox') && !IS_IOS;
    IS_WINDOWS = osName === 'windows';
    IS_MACOS = osName === 'mac os';

    if (IS_SAFARI) {
        if (getManagedMediaSource() === undefined) {
            MSE_BUFFER_SIZE = 300;
        } else { // Safari 17 and up
            if (!IS_IOS) {
                MSE_BUFFER_SIZE = 275;
            }
        }
    } else if (IS_CHROMIUM) {
        MSE_BUFFER_SIZE = 150;
    }

    const SUPPORTED_BLINK = engineName === 'blink' && engineVersion >= 62;
    UNRECOMMENDED_BROWSER = (!SUPPORTED_BLINK && !IS_SAFARI) || browserName.includes('wechat') || browserName === 'ucbrowser';
})();



const NATIVE_HLS_SUPPORTED = (function () {
    const audioElem = createAudioElement();
    const videoElem = createVideoElement();
    return (videoElem.canPlayType('application/vnd.apple.mpegurl') !== '') && (audioElem.canPlayType('application/vnd.apple.mpegurl') !== '') && IS_SAFARI;
})();
const MSE_SUPPORTED = isSupported();

const CAN_PLAY_ALAC = audioCanPlay('alac');
const CAN_PLAY_FLAC = audioCanPlay('flac') || audioCanPlay('fLaC');

const CAN_PLAY_AVC = videoCanPlay('avc1.640032');
const CAN_PLAY_AAC = audioCanPlay('mp4a.40.2');

UNRECOMMENDED_BROWSER = UNRECOMMENDED_BROWSER || !(CAN_PLAY_AVC && CAN_PLAY_AAC) || !(CAN_PLAY_FLAC || CAN_PLAY_ALAC);

export { IS_CHROMIUM };
export { IS_IOS };
export { IS_FIREFOX };
export { IS_WINDOWS };
export { IS_MACOS };
export { UNRECOMMENDED_BROWSER };
export { MIN_MSE_BUFFER_SIZE };
export { MSE_BUFFER_SIZE };

export { NATIVE_HLS_SUPPORTED };
export { MSE_SUPPORTED };
export { CAN_PLAY_ALAC };
export { CAN_PLAY_FLAC };
export { CAN_PLAY_AVC };
export { CAN_PLAY_AAC };

export function videoCanPlay(codecs: string): boolean {
    return canPlay('video', 'mp4', codecs);
}

export function audioCanPlay(codecs: string): boolean {
    return canPlay('audio', 'mp4', codecs);
}

export function canPlay(type: 'video' | 'audio', container: string, codecs: string): boolean {
    if (codecs !== '') {
        codecs = `; codecs="${codecs}"`;
    }
    const mediaSource = getMediaSource();
    if (MSE_SUPPORTED && mediaSource !== undefined) {
        return mediaSource.isTypeSupported(`${type}/${container}${codecs}`);
    } else if (NATIVE_HLS_SUPPORTED) {
        let mediaElement: HTMLMediaElement;
        if (type === 'video') {
            mediaElement = createVideoElement();
        } else {
            mediaElement = createAudioElement();
        }
        return mediaElement.canPlayType(`${type}/${container}${codecs}`) !== '';
    }
    return false;
}