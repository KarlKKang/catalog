import type { CustomAddEventListenerOptions } from './type';

export function isUseCapture(options?: boolean | CustomAddEventListenerOptions) {
    if (options === undefined) {
        return false;
    }
    if (typeof options === 'boolean') {
        return options;
    }
    return options.capture === true;
}
