import { getManagedMediaSource } from '../../internal/hls/get_managed_media_source';
import { MIN_MSE_BUFFER_SIZE } from './min';
import { IS_GECKO } from '../../is_gecko';
import { engineMajorVersion } from '../../ua/engine_major_version';
import { IS_SAFARI_VARIANT } from '../../is_safari_variant';
import { IS_APPLE_MOBILE_WEBKIT } from '../../is_apple_mobile_webkit';
import { IS_BLINK } from '../../is_blink';

const MSE_BUFFER_SIZE = (() => {
    if (IS_SAFARI_VARIANT) {
        if (getManagedMediaSource() === undefined) {
            return 300;
        }
        // Safari 17 and up
        if (IS_APPLE_MOBILE_WEBKIT) {
            return MIN_MSE_BUFFER_SIZE;
        }
        return 275;
    }
    if (IS_BLINK) {
        return 145;
    }
    if (IS_GECKO) {
        if (engineMajorVersion >= 129) {
            return 145;
        }
        return MIN_MSE_BUFFER_SIZE;
    }
    return MIN_MSE_BUFFER_SIZE;
})();

export { MSE_BUFFER_SIZE };
