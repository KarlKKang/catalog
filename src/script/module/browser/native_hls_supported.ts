import { createAudioElement } from '../dom/element/audio/create';
import { createVideoElement } from '../dom/element/video/create';
import { IS_SAFARI } from './is_safari';

const hlsMimeType = 'application/vnd.apple.mpegurl';
export const NATIVE_HLS_SUPPORTED
    = createVideoElement().canPlayType(hlsMimeType) !== ''
    && createAudioElement().canPlayType(hlsMimeType) !== ''
    && IS_SAFARI;
