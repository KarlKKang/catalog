type EventListenerAndOptions = [EventListener, boolean | AddEventListenerOptions | undefined];
type ListenerMap = Map<EventListener, [EventListenerAndOptions | null, EventListenerAndOptions | null]>;
type EventMap = Map<string, ListenerMap>;
type ElementMap = Map<EventTarget, EventMap>;

const elementMap: ElementMap = new Map();
let elementCount = 0;

export function addEventListener(elem: EventTarget, event: string, callback: EventListener, options?: boolean | AddEventListenerOptions) {
    if (options !== undefined && typeof options !== 'boolean' && options.once === true) {
        delete options.once;
        addEventListenerOnce(elem, event, callback, options);
        return;
    }
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
    const useCapture = isUseCapture(options);
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
        const eventListenerAndOptions = _listenerConfig[listenerConfigIdx];
        if (eventListenerAndOptions === null || eventListenerAndOptions[0] !== _callback) {
            return;
        }
        callback.apply(elem, args);
    };
    listenerConfig[listenerConfigIdx] = [_callback, options];
    elem.addEventListener(event, _callback, options);
    if (DEVELOPMENT) {
        console.log('Event listener added. Total elements listening: ' + elementCount + '. Total events on this element: ' + eventMap.size + '. Total listeners on this event: ' + listenerMap.size + '.');
    }
}

export function addEventsListener(elem: EventTarget, events: string[], callback: EventListener, options?: boolean | AddEventListenerOptions) {
    for (const event of events) {
        addEventListener(elem, event, callback, options);
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
    const eventListenerAndOptions = listenerConfig[listenerConfigIdx];
    if (eventListenerAndOptions === null) {
        if (DEVELOPMENT) {
            console.warn('Listener config not set.', elem, event, callback, useCapture);
        }
        return;
    }
    elem.removeEventListener(event, eventListenerAndOptions[0], eventListenerAndOptions[1]);
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
    }
}

export function removeEventsListener(elem: EventTarget, events: string[], callback: EventListener, useCapture?: boolean) {
    for (const event of events) {
        removeEventListener(elem, event, callback, useCapture);
    }
}

export function addEventListenerOnce(elem: EventTarget, event: string, callback: EventListener, options?: boolean | AddEventListenerOptions) {
    if (options !== undefined && typeof options !== 'boolean') {
        if (options.once === true) {
            delete options.once;
        } else if (options.once === false) {
            throw new Error('addEventListenerOnce does not support `once: false`.');
        }
    }
    const callbackOnce = (...args: [evt: Event]) => {
        removeEventListener(elem, event, callbackOnce, isUseCapture(options));
        callback.apply(elem, args);
    };
    addEventListener(elem, event, callbackOnce, options);
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
            let eventListenerAndOptions = listenerConfig[0];
            if (eventListenerAndOptions !== null) {
                elem.removeEventListener(event, eventListenerAndOptions[0], eventListenerAndOptions[1]);
                listenerConfig[0] = null;
            }
            eventListenerAndOptions = listenerConfig[1];
            if (eventListenerAndOptions !== null) {
                elem.removeEventListener(event, eventListenerAndOptions[0], eventListenerAndOptions[1]);
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
    }
}

function isUseCapture(options?: boolean | AddEventListenerOptions) {
    if (options === undefined) {
        return false;
    }
    if (typeof options === 'boolean') {
        return options;
    }
    return options.capture === true;
}
