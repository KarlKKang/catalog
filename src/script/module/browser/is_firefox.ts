import { getBrowserName } from './internal/ua/get_browser_name';
import { IS_IOS } from './is_ios';

export const IS_FIREFOX = getBrowserName().includes('firefox') && !IS_IOS;
