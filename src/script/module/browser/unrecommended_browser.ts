import { CAN_PLAY_AAC } from './can_play/codec/aac';
import { CAN_PLAY_AVC } from './can_play/codec/avc';
import { CAN_PLAY_FLAC } from './can_play/codec/flac';
import { BROWSER_NAME } from './ua/browser_name';
import { ENGINE_MAJOR_VERSION } from './ua/engine_major_version';
import { ENGINE_NAME } from './ua/engine_name';
import { IS_SAFARI_VARIANT } from './is_safari_variant';

// We do not provide browser recommendation based on HEVC playback capability, because it largely depends on the device and OS, even in the same browser.
//  Instead we point the user to an article specifically about HEVC playback if we detect that the browser cannot play HEVC video.
const SUPPORTED_BLINK = ENGINE_NAME === 'blink' && ENGINE_MAJOR_VERSION >= 79;
export const UNRECOMMENDED_BROWSER
    = (!SUPPORTED_BLINK && !IS_SAFARI_VARIANT)
        || BROWSER_NAME === 'wechat'
        || BROWSER_NAME === 'ucbrowser'
        || !(CAN_PLAY_AVC && CAN_PLAY_AAC)
        || !CAN_PLAY_FLAC;
