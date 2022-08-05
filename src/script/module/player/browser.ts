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
var IS_CHROMIUM = false;
var IS_IOS = false;
var IS_DESKTOP = false;
var IS_IE = false;
var IS_FIREFOX = false;
var IS_SAFARI = false;
var IS_LINUX = false;
//var IS_APPLE = false;

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
}

let audioElem = createElement('audio') as HTMLAudioElement;
let videoElem = createElement('video') as HTMLVideoElement;

var NATIVE_HLS = (videoElem.canPlayType('application/vnd.apple.mpegurl') != "") && (audioElem.canPlayType('application/vnd.apple.mpegurl') != "") && IS_SAFARI;
var USE_MSE = isSupported() && !NATIVE_HLS;

var CAN_PLAY_ALAC = false;
var CAN_PLAY_FLAC = false;
var CAN_PLAY_MP3 = (audioElem.canPlayType('audio/mpeg') != "") && !IS_IE;
var CAN_PLAY_AVC_AAC = false;

if (USE_MSE) {
    let mediaSource = getMediaSource();
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
export { IS_IE };
export { IS_FIREFOX };
export { IS_LINUX };
//export {IS_APPLE};

export { NATIVE_HLS };
export { USE_MSE };
export { CAN_PLAY_ALAC };
export { CAN_PLAY_FLAC };
export { CAN_PLAY_MP3 };
export { CAN_PLAY_AVC_AAC };