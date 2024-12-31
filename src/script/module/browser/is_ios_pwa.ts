import { w } from '../dom/window';
import { IS_IOS } from './is_ios';

// The IS_IOS check is required because the standalone property is true in Safari 17 and later on macOS as well.
export const IS_IOS_PWA = (w.navigator as any).standalone === true && IS_IOS;
