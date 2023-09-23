type ListenerMap = Map<EventListener, [boolean, boolean]>;
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
    if (listenerConfig === undefined) {
        listenerConfig = [false, false];
        listenerMap.set(callback, listenerConfig);
    }
    listenerConfig[useCapture ? 1 : 0] = true;
    elem.addEventListener(event, callback, useCapture);
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
    elem.removeEventListener(event, callback, useCapture);
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
    if (DEVELOPMENT && !listenerConfig[useCapture ? 1 : 0]) {
        console.warn('Listener config not set.', elem, event, callback, useCapture);
    }
    listenerConfig[useCapture ? 1 : 0] = false;

    if (!listenerConfig[0] && !listenerConfig[1]) {
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
    const callbackOnce = (arg: Event) => {
        removeEventListener(elem, event, callbackOnce, useCapture);
        callback(arg);
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
        for (const [listener, listenerConfig] of listenerMap) {
            if (listenerConfig[0]) {
                elem.removeEventListener(event, listener, false);
            }
            if (listenerConfig[1]) {
                elem.removeEventListener(event, listener, true);
            }
        }
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