import { d } from '../dom/document';
import { browserName } from './internal/ua/get_browser_name';
import { osName } from './internal/ua/get_os_name';

export const IS_IOS = browserName === 'mobile safari' || osName === 'ios' || (browserName === 'safari' && 'ontouchend' in d);
