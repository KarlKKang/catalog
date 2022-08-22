import { getMediaSource } from 'hls.js/src/utils/mediasource-helper';
import { isSupported } from 'hls.js/src/is-supported';
import Bowser from 'bowser';

import { w, createElement } from '../DOM';

declare global {
    interface Window {
        chrome: any,
        WebKitMediaSource: any
    }
}

const USER_AGENT = w.navigator && w.navigator.userAgent || '';
let IS_CHROMIUM = false;
let IS_IOS = false;
let IS_DESKTOP = false;
let IS_IE = false;
let IS_FIREFOX = false;
let IS_SAFARI = false;
let IS_LINUX = false;
//var IS_APPLE = false;
let IS_LEGACY = true;

if (USER_AGENT !== '') {
    const bowserParser = Bowser.getParser(USER_AGENT);

    const browserName = bowserParser.getBrowserName();
    const osName = bowserParser.getOSName();
    const engineName = bowserParser.getEngineName();
    const platformType = bowserParser.getPlatformType();

    IS_CHROMIUM = engineName === 'Blink' || !!w.chrome;
    IS_IOS = (osName === 'iOS') || (browserName === 'Safari' && (('ontouchstart' in w) || (navigator.maxTouchPoints > 0))) /* iPad in desktop mode */;
    IS_DESKTOP = platformType === 'desktop' && (osName === 'Linux' || osName === 'Windows' || osName === 'macOS') && !IS_IOS;
    IS_IE = browserName === 'Internet Explorer';
    IS_FIREFOX = engineName === 'Gecko';

    IS_SAFARI = IS_IOS || browserName === 'Safari';
    IS_LINUX = osName === 'Linux';
    //IS_APPLE = (osName === 'iOS') || (osName === 'macOS');

    IS_LEGACY = engineName === 'EdgeHTML' || engineName === 'Trident' || engineName === 'Presto';
}

const audioElem = createElement('audio') as HTMLAudioElement;
const videoElem = createElement('video') as HTMLVideoElement;

const NATIVE_HLS = (videoElem.canPlayType('application/vnd.apple.mpegurl') != "") && (audioElem.canPlayType('application/vnd.apple.mpegurl') != "") && IS_SAFARI;
const USE_MSE = isSupported() && !NATIVE_HLS;

let CAN_PLAY_ALAC = false;
let CAN_PLAY_FLAC = false;
const CAN_PLAY_MP3 = (audioElem.canPlayType('audio/mpeg') != "") && !IS_IE;
let CAN_PLAY_AVC_AAC = false;

if (USE_MSE) {
    const mediaSource = getMediaSource();
    if (mediaSource !== undefined) {
        CAN_PLAY_ALAC = mediaSource.isTypeSupported('audio/mp4; codecs="alac"');
        CAN_PLAY_FLAC = mediaSource.isTypeSupported('audio/mp4; codecs="flac"');
        CAN_PLAY_AVC_AAC = mediaSource.isTypeSupported('video/mp4; codecs="avc1.640032,mp4a.40.2"');
    }
    //CAN_PLAY_MP3 = mediaSource.isTypeSupported('audio/mpeg'); //Firefox fails this test, but can still play mp3 in MSE.
} else {
    CAN_PLAY_ALAC = audioElem.canPlayType('audio/mp4; codecs="alac"') != "";
    CAN_PLAY_FLAC = audioElem.canPlayType('audio/mp4; codecs="flac"') != "";
    CAN_PLAY_AVC_AAC = audioElem.canPlayType('video/mp4; codecs="avc1.640032,mp4a.40.2"') != "";
    //CAN_PLAY_MP3 = audioElem.canPlayType('audio/mpeg') != "";
}

export { IS_CHROMIUM };
export { IS_IOS };
export { IS_DESKTOP };
export { IS_FIREFOX };
export { IS_LINUX };
//export {IS_APPLE};
export { IS_LEGACY }

export { NATIVE_HLS };
export { USE_MSE };
export { CAN_PLAY_ALAC };
export { CAN_PLAY_FLAC };
export { CAN_PLAY_MP3 };
export { CAN_PLAY_AVC_AAC };