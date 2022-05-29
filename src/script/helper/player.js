import {default as Hls} from 'hls.js';
import {default as videojs} from 'video.js/dist/video.cjs';
export {default as videojsMod} from './videojs_mod.js';

export {Hls};
export {videojs};

const vjsBrowser = videojs.browser;

const IS_CHROMIUM = (!!window.chrome) || vjsBrowser.IS_CHROME;
const IS_MOBILE = vjsBrowser.IS_IOS || vjsBrowser.IS_ANDROID;
const IS_SAFARI = vjsBrowser.IS_SAFARI || vjsBrowser.IS_IOS;
const USE_MSE = Hls.isSupported() && !IS_SAFARI;
const NATIVE_HLS = (document.createElement('video').canPlayType('application/vnd.apple.mpegurl') != "") && (document.createElement('audio').canPlayType('application/vnd.apple.mpegurl') != "");

let CAN_PLAY_ALAC;
let CAN_PLAY_FLAC;
if (USE_MSE) {
    let mediaSource = window.MediaSource || window.WebKitMediaSource;
    CAN_PLAY_ALAC = mediaSource.isTypeSupported('video/mp4; codecs="alac"');
    CAN_PLAY_FLAC = mediaSource.isTypeSupported('audio/flac') || mediaSource.isTypeSupported('audio/x-flac');
} else {
    CAN_PLAY_ALAC = document.createElement('audio').canPlayType('video/mp4; codecs="alac"') != "";
    CAN_PLAY_FLAC = document.createElement('audio').canPlayType('audio/flac') || document.createElement('audio').canPlayType('audio/x-flac');
}

export const browser = {
    IS_CHROMIUM: IS_CHROMIUM,
    IS_MOBILE: IS_MOBILE,
    USE_MSE: USE_MSE,
    NATIVE_HLS: NATIVE_HLS,
    CAN_PLAY_ALAC: CAN_PLAY_ALAC,
    CAN_PLAY_FLAC: CAN_PLAY_FLAC
};