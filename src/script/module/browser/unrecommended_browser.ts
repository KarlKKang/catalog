import { CAN_PLAY_AAC } from './can_play/codec/aac';
import { CAN_PLAY_ALAC } from './can_play/codec/alac';
import { CAN_PLAY_AVC } from './can_play/codec/avc';
import { CAN_PLAY_FLAC } from './can_play/codec/flac';
import { browserName } from './ua/browser_name';
import { engineMajorVersion } from './ua/engine_major_version';
import { engineName } from './ua/engine_name';
import { IS_SAFARI_VARIANT } from './is_safari_variant';

const SUPPORTED_BLINK = engineName === 'blink' && engineMajorVersion >= 79;
export const UNRECOMMENDED_BROWSER
    = (!SUPPORTED_BLINK && !IS_SAFARI_VARIANT)
        || browserName === 'wechat'
        || browserName === 'ucbrowser'
        || !(CAN_PLAY_AVC && CAN_PLAY_AAC)
        || !(CAN_PLAY_FLAC || CAN_PLAY_ALAC);
