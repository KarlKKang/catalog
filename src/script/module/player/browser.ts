import { getMediaSource } from 'hls.js/src/utils/mediasource-helper';
import { isSupported } from 'hls.js/src/is-supported';
import { default as videojs } from 'video.js';

import { w, createElement } from '../DOM';

/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
    interface Window {
        chrome: any
    }
}
/* eslint-enable @typescript-eslint/no-explicit-any */

interface VjsBrowser extends videojs.Browser { IS_FIREFOX?: boolean }
const vjsBrowser: VjsBrowser = videojs.browser;

const IS_IOS = vjsBrowser.IS_IOS;
const IS_SAFARI = vjsBrowser.IS_SAFARI || IS_IOS;
const IS_CHROMIUM = !!w.chrome;
const IS_FIREFOX = vjsBrowser.IS_FIREFOX;

const audioElem = createElement('audio') as HTMLAudioElement;
const videoElem = createElement('video') as HTMLVideoElement;

const NATIVE_HLS = (videoElem.canPlayType('application/vnd.apple.mpegurl') != '') && (audioElem.canPlayType('application/vnd.apple.mpegurl') != '') && IS_SAFARI;
const USE_MSE = isSupported() && !NATIVE_HLS;

let CAN_PLAY_ALAC = false;
let CAN_PLAY_FLAC = false;
const CAN_PLAY_MP3 = audioElem.canPlayType('audio/mpeg') != '';
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
    CAN_PLAY_ALAC = audioElem.canPlayType('audio/mp4; codecs="alac"') != '';
    CAN_PLAY_FLAC = audioElem.canPlayType('audio/mp4; codecs="flac"') != '';
    CAN_PLAY_AVC_AAC = audioElem.canPlayType('video/mp4; codecs="avc1.640032,mp4a.40.2"') != '';
    //CAN_PLAY_MP3 = audioElem.canPlayType('audio/mpeg') != "";
}

export { IS_CHROMIUM };
export { IS_IOS };
export { IS_FIREFOX };

export { NATIVE_HLS };
export { USE_MSE };
export { CAN_PLAY_ALAC };
export { CAN_PLAY_FLAC };
export { CAN_PLAY_MP3 };
export { CAN_PLAY_AVC_AAC };