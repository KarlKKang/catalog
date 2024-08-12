import { addEventListener } from '.';
import type { CustomAddEventListenerOptions } from '../internal/type';

export function addEventsListener(elem: EventTarget, events: string[], callback: EventListener, options?: boolean | CustomAddEventListenerOptions) {
    for (const event of events) {
        addEventListener(elem, event, callback, options);
    }
}
