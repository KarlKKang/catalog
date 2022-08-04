import {w, d} from './document';
import * as message from '../message';


export function getByIdNative (id: string) {
    return d.getElementById(id);
}

export function getById (id: string) {
    let elem = getByIdNative(id);
    if (elem === null) {
        message.show(message.template.param.javascriptError(`Element with ID '${id}' not found.`));
    }
    return elem as HTMLElement;
}

export function getDescendantsByClass (parent: Element | Document, className: string) {
    return parent.getElementsByClassName(className);
}

export function getByClass (className: string) {
    return getDescendantsByClass (d, className);
}

export function getDescendantsByClassAt (parent: Element | Document, className: string, index: number) {
    var elems = getDescendantsByClass (parent, className);
    if (elems[index] === undefined) {
        message.show(message.template.param.javascriptError(`Element with class '${className}' at index ${index} not found.`));
    }
    return elems[index] as Element;
}

export function getByClassAt (className: string, index: number) {
    var elems = getByClass (className);
    if (elems[index] === undefined) {
        message.show(message.template.param.javascriptError(`Element with class '${className}' at index ${index} not found.`));
    }
    return elems[index] as Element;
}

export function getDescendantsByTag (parent: Element | Document, tagName: string) {
    return parent.getElementsByTagName(tagName);
}

export function getByTag (tagName: string) {
    return getDescendantsByTag (d, tagName);
}

export function getDescendantsByTagAt (parent: Element | Document, tagName: string, index: number) {
    var elems = getDescendantsByTag (parent, tagName);
    if (elems[index] === undefined) {
        message.show(message.template.param.javascriptError(`Element with tag '${tagName}' at index ${index} not found.`));
    }
    return elems[index] as Element;
}

export function getByTagAt (tagName: string, index: number) {
    var elems = getByTag (tagName);
    if (elems[index] === undefined) {
        message.show(message.template.param.javascriptError(`Element with tag '${tagName}' at index ${index} not found.`));
    }
    return elems[index] as Element;
}

export function addClass (elem: Element, className: string) {
    elem.classList.add(className);
}

export function removeClass (elem: Element, className: string) {
    elem.classList.remove(className);
}

export function setClass (elem: Element, className: string) {
    elem.className = className;
}

export function toggleClass (elem: Element, className: string) {
    elem.classList.toggle(className);
}

export function containsClass (elem: Element, className: string) {
    return elem.classList.contains(className);
}

export function getParent (elem: Element) {
    var parent = elem.parentElement;
    if (parent === null) {
        message.show(message.template.param.javascriptError('parentElement not found.'));
    }
    return parent as HTMLElement;
}

export function insertBefore (newNode: Node, beforeNode: Element) {
    getParent(beforeNode).insertBefore(newNode, beforeNode);
}

export function remove (elem: Element) {
    getParent(elem).removeChild(elem);
}

export function createElement (tag: string) {
    return d.createElement(tag);
}

export function createTextNode (text: string) {
    return d.createTextNode(text);
}

export function addEventListener (elem: Element | Document | Window, event: string, callback: EventListenerOrEventListenerObject, useCapture?: boolean) {
    elem.addEventListener(event, callback, useCapture);
}

export function addEventsListener (elem: Element | Document | Window, events: Array<string>, callback: EventListenerOrEventListenerObject, useCapture?: boolean) {
    for (let event of events) {
        addEventListener(elem, event, callback, useCapture);
    }
}

export function removeEventListener (elem: Element | Document | Window, event: string, callback: EventListenerOrEventListenerObject, useCapture?: boolean) {
    elem.removeEventListener(event, callback, useCapture);
}

export function removeEventsListener (elem: Element | Document | Window, events: Array<string>, callback: EventListenerOrEventListenerObject, useCapture?: boolean) {
    for (let event of events) {
        removeEventListener(elem, event, callback, useCapture);
    }
}

export function getComputedStyle(elem: HTMLElement, property: string) { 
    return w.getComputedStyle(elem, null).getPropertyValue(property); 
}

export function appendChild (parent: Node, child: Node) {
    parent.appendChild(child);
}