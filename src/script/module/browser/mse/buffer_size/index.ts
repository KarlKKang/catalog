import { getManagedMediaSource } from '../../internal/hls/get_managed_media_source';
import { IS_CHROMIUM } from '../../is_chromium';
import { IS_SAFARI } from '../../is_safari';
import { IS_IOS } from '../../is_ios';
import { MIN_MSE_BUFFER_SIZE } from './min';
import { IS_FIREFOX } from '../../is_firefox';
import { browserMajorVersion } from '../../internal/ua/browser_major_version';

let MSE_BUFFER_SIZE = MIN_MSE_BUFFER_SIZE;

if (IS_SAFARI) {
    if (getManagedMediaSource() === undefined) {
        MSE_BUFFER_SIZE = 300;
    } else { // Safari 17 and up
        if (!IS_IOS) {
            MSE_BUFFER_SIZE = 275;
        }
    }
} else if (IS_CHROMIUM) {
    MSE_BUFFER_SIZE = 150;
} else if (IS_FIREFOX) {
    if (browserMajorVersion >= 129) {
        MSE_BUFFER_SIZE = 145;
    }
}

export { MSE_BUFFER_SIZE };
