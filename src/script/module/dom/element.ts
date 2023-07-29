import { d } from './document';

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

export function getParentElement(elem: Node) {
    const parent = elem.parentElement;
    if (parent === null) {
        throw new Error('Parent element not found.');
    }
    return parent;
}

function getParentNode(elem: Node) {
    const parent = elem.parentNode;
    if (parent === null) {
        throw new Error('Parent node not found.');
    }
    return parent;
}

export function prependChild(parent: Node, child: Node) {
    parent.insertBefore(child, parent.firstChild); // Works with empty elements as well.
}

export function insertBefore(newNode: Node, beforeNode: Node) {
    getParentNode(beforeNode).insertBefore(newNode, beforeNode);
}

export function insertAfter(newNode: Node, beforeNode: Node) {
    getParentNode(beforeNode).insertBefore(newNode, beforeNode.nextSibling);
}

export function remove(elem: Node) {
    getParentNode(elem).removeChild(elem);
}

export function replaceChildren(parent: Node, ...newChildren: Node[]) {
    let oldChild = parent.firstChild;
    while (oldChild !== null) {
        parent.removeChild(oldChild);
        oldChild = parent.firstChild;
    }
    for (const newChild of newChildren) {
        appendChild(parent, newChild);
    }
}

export function createElement(tag: string) {
    const elem = d.createElement(tag);
    return elem;
}

export function createDivElement() {
    return createElement('div') as HTMLDivElement;
}

export function createButtonElement() {
    return createElement('button') as HTMLButtonElement;
}

export function createSpanElement() {
    return createElement('span') as HTMLSpanElement;
}

export function createParagraphElement() {
    return createElement('p') as HTMLParagraphElement;
}

export function createCanvasElement() {
    return createElement('canvas') as HTMLCanvasElement;
}

export function createVideoElement() {
    return createElement('video') as HTMLVideoElement;
}

export function createAudioElement() {
    return createElement('audio') as HTMLAudioElement;
}

export function createSelectElement() {
    return createElement('select') as HTMLSelectElement;
}

export function createOptionElement() {
    return createElement('option') as HTMLOptionElement;
}

export function createHRElement() {
    return createElement('hr') as HTMLHRElement;
}

export function createBRElement() {
    return createElement('br') as HTMLBRElement;
}

export function createUListElement() {
    return createElement('ul') as HTMLUListElement;
}

export function createLIElement() {
    return createElement('li') as HTMLLIElement;
}

export function createAnchorElement() {
    return createElement('a') as HTMLAnchorElement;
}

export function createSVGElement(viewBox: string, path: string) {
    const svg = d.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', viewBox);
    addSVGPath(svg, path);
    return svg;
}

function addSVGPath(svg: SVGSVGElement, path: string) {
    const svgPath = d.createElementNS('http://www.w3.org/2000/svg', 'path');
    svgPath.setAttribute('d', path);
    appendChild(svg, svgPath);
}

export function createTextNode(text: string) {
    return d.createTextNode(text);
}

export function appendText(parent: Node, content: string) {
    appendChild(parent, createTextNode(content));
}

export function replaceText(parent: Node, content: string) {
    replaceChildren(parent, createTextNode(content));
}

export function addEventListener(elem: EventTarget, event: string, callback: EventListener, useCapture?: boolean) {
    elem.addEventListener(event, callback, useCapture);
}

export function addEventsListener(elem: EventTarget, events: Array<string>, callback: EventListener, useCapture?: boolean) {
    for (const event of events) {
        addEventListener(elem, event, callback, useCapture);
    }
}

export function removeEventListener(elem: EventTarget, event: string, callback: EventListener, useCapture?: boolean) {
    elem.removeEventListener(event, callback, useCapture);
}

export function removeEventsListener(elem: EventTarget, events: Array<string>, callback: EventListener, useCapture?: boolean) {
    for (const event of events) {
        removeEventListener(elem, event, callback, useCapture);
    }
}

export function addEventListenerOnce(elem: EventTarget, event: string, callback: EventListener, useCapture?: boolean) {
    const callbackOnce = function (this: any, arg: Event) {
        removeEventListener(elem, event, callbackOnce, useCapture);
        callback.call(this, arg);
    };
    addEventListener(elem, event, callbackOnce, useCapture);
}

export function appendChild(parent: Node, child: Node) {
    parent.appendChild(child);
}

export function hideElement(elem: HTMLElement) {
    addClass(elem, 'hidden');
}

export function showElement(elem: HTMLElement) {
    removeClass(elem, 'hidden');
}

export function isHidden(elem: HTMLElement) {
    return containsClass(elem, 'hidden');
}