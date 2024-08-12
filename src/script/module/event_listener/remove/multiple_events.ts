import { removeEventListener } from '.';

export function removeEventsListener(elem: EventTarget, events: string[], callback: EventListener, useCapture?: boolean) {
    for (const event of events) {
        removeEventListener(elem, event, callback, useCapture);
    }
}
