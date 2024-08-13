import { CAN_PLAY_AAC } from './can_play/codec/aac';
import { CAN_PLAY_ALAC } from './can_play/codec/alac';
import { CAN_PLAY_AVC } from './can_play/codec/avc';
import { CAN_PLAY_FLAC } from './can_play/codec/flac';
import { browserName } from './internal/ua/get_browser_name';
import { engineMajorVersion } from './internal/ua/get_engine_major_version';
import { engineName } from './internal/ua/get_engine_name';
import { IS_SAFARI } from './is_safari';

const SUPPORTED_BLINK = engineName === 'blink' && engineMajorVersion >= 62;
export const UNRECOMMENDED_BROWSER
    = (!SUPPORTED_BLINK && !IS_SAFARI)
    || browserName.includes('wechat')
    || browserName === 'ucbrowser'
    || !(CAN_PLAY_AVC && CAN_PLAY_AAC)
    || !(CAN_PLAY_FLAC || CAN_PLAY_ALAC);
