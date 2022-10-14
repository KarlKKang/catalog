import { w, d } from './document';

export function getByIdNative(id: string) {
    return d.getElementById(id);
}

export function getById(id: string) {
    const elem = getByIdNative(id);
    if (elem === null) {
        throw new Error(`Element with ID '${id}' not found.`);
    }
    return elem;
}

export function getDescendantsByClass(parent: Element | Document, className: string) {
    return parent.getElementsByClassName(className);
}

export function getByClass(className: string) {
    return getDescendantsByClass(d, className);
}

export function getDescendantsByClassAt(parent: Element | Document, className: string, index: number) {
    const elems = getDescendantsByClass(parent, className);
    const elem = elems[index];
    if (elem === undefined) {
        throw new Error(`Element with class '${className}' at index ${index} not found.`);
    }
    return elem;
}

export function getByClassAt(className: string, index: number) {
    const elems = getByClass(className);
    const elem = elems[index];
    if (elem === undefined) {
        throw new Error(`Element with class '${className}' at index ${index} not found.`);
    }
    return elem;
}

export function getDescendantsByTag(parent: Element | Document, tagName: string) {
    return parent.getElementsByTagName(tagName);
}

export function getByTag(tagName: string) {
    return getDescendantsByTag(d, tagName);
}

export function getDescendantsByTagAt(parent: Element | Document, tagName: string, index: number) {
    const elems = getDescendantsByTag(parent, tagName);
    const elem = elems[index];
    if (elem === undefined) {
        throw new Error(`Element with tag '${tagName}' at index ${index} not found.`);
    }
    return elem;
}

export function getByTagAt(tagName: string, index: number) {
    const elems = getByTag(tagName);
    const elem = elems[index];
    if (elem === undefined) {
        throw new Error(`Element with tag '${tagName}' at index ${index} not found.`);
    }
    return elem;
}

export function addClass(elem: Element, className: string) {
    elem.classList.add(className);
}

export function removeClass(elem: Element, className: string) {
    elem.classList.remove(className);
}

export function setClass(elem: Element, className: string) {
    elem.className = className;
}

export function toggleClass(elem: Element, className: string) {
    elem.classList.toggle(className);
}

export function containsClass(elem: Element, className: string) {
    return elem.classList.contains(className);
}

export function setDataAttribute(elem: Element, name: string, value: string) {
    setAttribute(elem, 'data-' + name, value);
}

export function getDataAttribute(elem: Element, name: string) {
    return getAttribute(elem, 'data-' + name);
}

export function setAttribute(elem: Element, name: string, value: string) {
    elem.setAttribute(name, value);
}

export function getAttribute(elem: Element, name: string) {
    if (!elem.hasAttribute(name)) {
        return null;
    }
    return elem.getAttribute(name);
}

export function getParent(elem: Element) {
    const parent = elem.parentElement;
    if (parent === null) {
        throw new Error('parentElement not found.');
    }
    return parent;
}

export function prependChild(parent: Node, child: Node) {
    parent.insertBefore(child, parent.firstChild);
}

export function insertBefore(newNode: Node, beforeNode: Element) {
    getParent(beforeNode).insertBefore(newNode, beforeNode);
}

export function remove(elem: Element) {
    getParent(elem).removeChild(elem);
}

export function createElement(tag: string) {
    return d.createElement(tag);
}

export function createTextNode(text: string) {
    return d.createTextNode(text);
}

export function addEventListener(elem: Element | Document | Window, event: string, callback: EventListener, useCapture?: boolean) {
    elem.addEventListener(event, callback, useCapture);
}

export function addEventsListener(elem: Element | Document | Window, events: Array<string>, callback: EventListener, useCapture?: boolean) {
    for (const event of events) {
        addEventListener(elem, event, callback, useCapture);
    }
}

export function removeEventListener(elem: Element | Document | Window, event: string, callback: EventListener, useCapture?: boolean) {
    elem.removeEventListener(event, callback, useCapture);
}

export function removeEventsListener(elem: Element | Document | Window, events: Array<string>, callback: EventListener, useCapture?: boolean) {
    for (const event of events) {
        removeEventListener(elem, event, callback, useCapture);
    }
}

export function addEventListenerOnce(elem: Element | Document | Window, event: string, callback: EventListener, useCapture?: boolean) {
    const callbackOnce = function (this: any, arg: Event) {
        removeEventListener(elem, event, callbackOnce, useCapture);
        callback.call(this, arg);
    };
    addEventListener(elem, event, callbackOnce, useCapture);
}

export function getComputedStyle(elem: HTMLElement, property: string) {
    return w.getComputedStyle(elem, null).getPropertyValue(property);
}

export function appendChild(parent: Node, child: Node) {
    parent.appendChild(child);
}