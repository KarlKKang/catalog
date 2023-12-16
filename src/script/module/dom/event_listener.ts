type ListenerMap = Map<EventListener, [EventListener | null, EventListener | null]>;
type EventMap = Map<string, ListenerMap>;
type ElementMap = Map<EventTarget, EventMap>;

const elementMap: ElementMap = new Map();
let elementCount = 0;

const LOG_ELEMENT_MAP = false;

export function addEventListener(elem: EventTarget, event: string, callback: EventListener, useCapture?: boolean) {
    let eventMap = elementMap.get(elem);
    if (eventMap === undefined) {
        eventMap = new Map();
        elementMap.set(elem, eventMap);
        if (DEVELOPMENT) {
            elementCount++;
        }
    }
    let listenerMap = eventMap.get(event);
    if (listenerMap === undefined) {
        listenerMap = new Map();
        eventMap.set(event, listenerMap);
    }
    if (DEVELOPMENT) {
        if (listenerMap.size > 5) {
            console.warn('More than 5 listeners on this event.', elem, event);
        }
    }
    let listenerConfig = listenerMap.get(callback);
    const listenerConfigIdx = useCapture ? 1 : 0;
    if (listenerConfig === undefined) {
        listenerConfig = [null, null];
        listenerMap.set(callback, listenerConfig);
    } else if (listenerConfig[listenerConfigIdx] !== null) {
        if (DEVELOPMENT) {
            console.warn('Listener already added.', elem, event, callback, useCapture);
        }
        return;
    }
    const _listenerConfig = listenerConfig;
    const _callback = (...args: [evt: Event]) => {
        if (_listenerConfig[listenerConfigIdx] === _callback) {
            callback.apply(elem, args);
        }
    };
    listenerConfig[listenerConfigIdx] = _callback;
    elem.addEventListener(event, _callback, useCapture);
    if (DEVELOPMENT) {
        console.log('Event listener added. Total elements listening: ' + elementCount + '. Total events on this element: ' + eventMap.size + '. Total listeners on this event: ' + listenerMap.size + '.');
        LOG_ELEMENT_MAP && console.log(elementMap);
    }
}

export function addEventsListener(elem: EventTarget, events: Array<string>, callback: EventListener, useCapture?: boolean) {
    for (const event of events) {
        addEventListener(elem, event, callback, useCapture);
    }
}

export function removeEventListener(elem: EventTarget, event: string, callback: EventListener, useCapture?: boolean) {
    const eventMap = elementMap.get(elem);
    if (eventMap === undefined) {
        if (DEVELOPMENT) {
            console.warn('Event map not found.', elem);
        }
        return;
    }
    const listenerMap = eventMap.get(event);
    if (listenerMap === undefined) {
        if (DEVELOPMENT) {
            console.warn('Listener map not found.', elem, event);
        }
        return;
    }
    const listenerConfig = listenerMap.get(callback);
    if (listenerConfig === undefined) {
        if (DEVELOPMENT) {
            console.warn('Listener config not found.', elem, event, callback);
        }
        return;
    }
    const listenerConfigIdx = useCapture ? 1 : 0;
    const _callback = listenerConfig[listenerConfigIdx];
    if (_callback === null) {
        if (DEVELOPMENT) {
            console.warn('Listener config not set.', elem, event, callback, useCapture);
        }
        return;
    }
    elem.removeEventListener(event, _callback, useCapture);
    listenerConfig[listenerConfigIdx] = null;

    if (listenerConfig[0] === null && listenerConfig[1] === null) {
        listenerMap.delete(callback);
    }
    if (listenerMap.size === 0) {
        eventMap.delete(event);
    }
    if (eventMap.size === 0) {
        elementMap.delete(elem);
        if (DEVELOPMENT) {
            elementCount--;
        }
    }
    if (DEVELOPMENT) {
        console.log('Event listener removed. Total elements listening: ' + elementCount + '. Total events on this element: ' + eventMap.size + '. Total listeners on this event: ' + listenerMap.size + '.');
        LOG_ELEMENT_MAP && console.log(elementMap);
    }
}

export function removeEventsListener(elem: EventTarget, events: Array<string>, callback: EventListener, useCapture?: boolean) {
    for (const event of events) {
        removeEventListener(elem, event, callback, useCapture);
    }
}

export function addEventListenerOnce(elem: EventTarget, event: string, callback: EventListener, useCapture?: boolean) {
    const callbackOnce = (...args: [evt: Event]) => {
        removeEventListener(elem, event, callbackOnce, useCapture);
        callback.apply(elem, args);
    };
    addEventListener(elem, event, callbackOnce, useCapture);
}

export function removeAllEventListeners(elem: EventTarget) {
    const eventMap = elementMap.get(elem);
    if (eventMap === undefined) {
        if (DEVELOPMENT) {
            console.warn('Event map not found.', elem);
        }
        return;
    }
    removeAllEventListenersHelper(elem, eventMap);
}

export function deregisterAllEventTargets() {
    for (const [elem, eventMap] of elementMap) {
        removeAllEventListenersHelper(elem, eventMap);
    }
}

function removeAllEventListenersHelper(elem: EventTarget, eventMap: EventMap) {
    for (const [event, listenerMap] of eventMap) {
        for (const [callback, listenerConfig] of listenerMap) {
            if (listenerConfig[0] !== null) {
                elem.removeEventListener(event, listenerConfig[0], false);
                listenerConfig[0] = null;
            }
            if (listenerConfig[1] !== null) {
                elem.removeEventListener(event, listenerConfig[1], true);
                listenerConfig[1] = null;
            }
            listenerMap.delete(callback);
        }
        eventMap.delete(event);
    }
    elementMap.delete(elem);
    if (DEVELOPMENT) {
        elementCount--;
    }
    if (DEVELOPMENT) {
        console.log('All event listeners removed. Total elements listening: ' + elementCount + '.');
        LOG_ELEMENT_MAP && console.log(elementMap);
    }
}