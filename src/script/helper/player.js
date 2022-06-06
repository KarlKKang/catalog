import {default as Hls} from 'hls.js';
import {default as videojs} from 'video.js/dist/alt/video.novtt';
export {default as videojsMod} from './videojs_mod.js';

export {Hls};
export {videojs};

const vjsBrowser = videojs.browser;

const IS_CHROMIUM = !!window.chrome;
const IS_MOBILE = vjsBrowser.IS_IOS || vjsBrowser.IS_ANDROID;
const IS_SAFARI = vjsBrowser.IS_SAFARI || vjsBrowser.IS_IOS;
const USE_MSE = Hls.isSupported() && !IS_SAFARI;

let audioElem = document.createElement('audio');
let videoElem = document.createElement('video');

const NATIVE_HLS = (videoElem.canPlayType('application/vnd.apple.mpegurl') != "") && (audioElem.canPlayType('application/vnd.apple.mpegurl') != "");

let CAN_PLAY_ALAC;
let CAN_PLAY_FLAC;
let CAN_PLAY_MP3 = audioElem.canPlayType('audio/mpeg') != "";
let CAN_PLAY_AVC_AAC;
if (USE_MSE) {
    let mediaSource = window.MediaSource || window.WebKitMediaSource;
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

export const browser = {
    IS_CHROMIUM: IS_CHROMIUM,
    IS_MOBILE: IS_MOBILE,
    IS_IE: IS_IE,
    IS_FIREFOX: vjsBrowser.IS_FIREFOX, //IS_FIREFOX is not presented in the interface
    USE_MSE: USE_MSE,
    NATIVE_HLS: NATIVE_HLS,
    CAN_PLAY_ALAC: CAN_PLAY_ALAC,
    CAN_PLAY_FLAC: CAN_PLAY_FLAC,
    CAN_PLAY_MP3: CAN_PLAY_MP3,
    CAN_PLAY_AVC_AAC: CAN_PLAY_AVC_AAC
};