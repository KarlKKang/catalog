import { d } from '../dom/document';
import { getBrowserName } from './internal/ua/get_browser_name';
import { getOsName } from './internal/ua/get_os_name';

const browserName = getBrowserName();
const osName = getOsName();
export const IS_IOS = browserName === 'mobile safari' || osName === 'ios' || (browserName === 'safari' && 'ontouchend' in d);
