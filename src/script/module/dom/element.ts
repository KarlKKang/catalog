import { d } from './document';
import * as styles from '../../../css/common.module.scss';

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

export function addClass(elem: Element, className: string, ...classNames: string[]) {
    elem.classList.add(className);
    for (const className of classNames) {
        elem.classList.add(className);
    }
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

export function insertAfter(newNode: Node, afterNode: Node) {
    getParentNode(afterNode).insertBefore(newNode, afterNode.nextSibling);
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
    appendChildren(parent, ...newChildren);
}

export function appendChild(parent: Node, child: Node) {
    parent.appendChild(child);
}

export function appendChildren(parent: Node, ...children: Node[]) {
    for (const child of children) {
        appendChild(parent, child);
    }
}

export function disableInput(inputElement: HTMLInputElement, disabled: boolean) {
    inputElement.disabled = disabled;
    if (disabled) {
        addClass(getParentElement(inputElement), styles.disabled);
    } else {
        removeClass(getParentElement(inputElement), styles.disabled);
    }
}