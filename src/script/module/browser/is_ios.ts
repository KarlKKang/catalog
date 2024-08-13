import { d } from '../dom/document';
import { browserName } from './internal/ua/browser_name';
import { osName } from './internal/ua/os_name';

export const IS_IOS = browserName === 'mobile safari' || osName === 'ios' || (browserName === 'safari' && 'ontouchend' in d);
