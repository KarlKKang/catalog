import {default as Hls} from 'hls.js';
import {default as videojs} from 'video.js';

import {w, createElement} from '../main';

declare global {
    interface Window {
        chrome: any,
        WebKitMediaSource: any
    }
}

interface browser extends videojs.Browser {
    IS_FIREFOX?: boolean
}

let audioElem = createElement('audio') as HTMLAudioElement;
let videoElem = createElement('video') as HTMLVideoElement;

const vjsBrowser: browser = videojs.browser;

const IS_CHROMIUM = !!w.chrome;
const IS_IOS = vjsBrowser.IS_IOS; // IS_IOS = IS_IPHONE || IS_IPAD || IS_IPOD
const IS_MOBILE = IS_IOS || vjsBrowser.IS_ANDROID; 
const IS_SAFARI = vjsBrowser.IS_SAFARI || vjsBrowser.IS_IOS;
const USE_MSE = Hls.isSupported() && !IS_SAFARI;


const NATIVE_HLS = (videoElem.canPlayType('application/vnd.apple.mpegurl') != "") && (audioElem.canPlayType('application/vnd.apple.mpegurl') != "");

let CAN_PLAY_ALAC;
let CAN_PLAY_FLAC;
let CAN_PLAY_MP3 = audioElem.canPlayType('audio/mpeg') != "";
let CAN_PLAY_AVC_AAC;
if (USE_MSE) {
    let mediaSource = w.MediaSource || w.WebKitMediaSource;
    CAN_PLAY_ALAC = mediaSource.isTypeSupported('audio/mp4; codecs="alac"');
    CAN_PLAY_FLAC = mediaSource.isTypeSupported('audio/mp4; codecs="flac"');
    CAN_PLAY_AVC_AAC = mediaSource.isTypeSupported('video/mp4; codecs="avc1.640032,mp4a.40.2"');
    //CAN_PLAY_MP3 = mediaSource.isTypeSupported('audio/mpeg'); //Firefox fails this test, but can still play mp3 in MSE.
} else {
    CAN_PLAY_ALAC = audioElem.canPlayType('audio/mp4; codecs="alac"') != "";
    CAN_PLAY_FLAC = audioElem.canPlayType('audio/mp4; codecs="flac"') != "";
    CAN_PLAY_AVC_AAC = audioElem.canPlayType('video/mp4; codecs="avc1.640032,mp4a.40.2"') != "";
    //CAN_PLAY_MP3 = audioElem.canPlayType('audio/mpeg') != "";
}

const IS_IE = (vjsBrowser.IE_VERSION !== null) && (!CAN_PLAY_FLAC);
CAN_PLAY_MP3 = CAN_PLAY_MP3 && !IS_IE; //IE cannot play mp3 in HLS

export {IS_CHROMIUM};
export {IS_IOS};
export {IS_MOBILE};
export {IS_IE};
export const IS_FIREFOX = vjsBrowser.IS_FIREFOX === true; //IS_FIREFOX is not presented in the interface
export {USE_MSE};
export {NATIVE_HLS};
export {CAN_PLAY_ALAC};
export {CAN_PLAY_FLAC};
export {CAN_PLAY_MP3};
export {CAN_PLAY_AVC_AAC};