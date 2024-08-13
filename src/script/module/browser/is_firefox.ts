import { browserName } from './internal/ua/browser_name';
import { IS_IOS } from './is_ios';

export const IS_FIREFOX = browserName.includes('firefox') && !IS_IOS;
