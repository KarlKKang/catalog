import { IS_APPLE_MOBILE_WEBKIT } from './is_apple_mobile_webkit';
import { BROWSER_NAME } from './ua/browser_name';

export const IS_SAFARI_VARIANT = IS_APPLE_MOBILE_WEBKIT || BROWSER_NAME === 'safari';
