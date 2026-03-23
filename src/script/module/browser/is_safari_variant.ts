import { IS_APPLE_MOBILE_WEBKIT } from './is_apple_mobile_webkit';
import { browserName } from './ua/browser_name';

export const IS_SAFARI_VARIANT = IS_APPLE_MOBILE_WEBKIT || browserName === 'safari';
