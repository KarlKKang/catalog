import { isBoolean } from '../../type/is/boolean';
import type { CustomAddEventListenerOptions } from './type';

export function isUseCapture(options?: boolean | CustomAddEventListenerOptions) {
    if (options === undefined) {
        return false;
    }
    if (isBoolean(options)) {
        return options;
    }
    return options.capture === true;
}
