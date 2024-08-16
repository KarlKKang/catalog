import { isUseCapture } from '../internal/is_use_capture';
import { addEventListener } from '.';
import { removeEventListener } from '../remove';
import type { CustomAddEventListenerOptions } from '../internal/type';

export function addEventListenerOnce(elem: EventTarget, event: string, callback: EventListener, options?: boolean | CustomAddEventListenerOptions) {
    const callbackOnce = (...args: Parameters<EventListener>) => {
        removeEventListener(elem, event, callbackOnce, isUseCapture(options));
        callback.apply(elem, args);
    };
    addEventListener(elem, event, callbackOnce, options);
}
