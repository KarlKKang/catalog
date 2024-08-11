import { d } from './document';

export function getById(id: string) {
    return d.getElementById(id);
}

export function getByClass(parent: Element | Document, className: string) {
    return parent.getElementsByClassName(className);
}

export function getByClassAt(parent: Element | Document, className: string, index: number) {
    const elems = getByClass(parent, className);
    const elem = elems[index];
    if (elem === undefined) {
        throw new Error(`Element with class '${className}' at index ${index} not found.`);
    }
    return elem;
}

export function getByTag(parent: Element | Document, tagName: string) {
    return parent.getElementsByTagName(tagName);
}

export function getParentElement(elem: Node) {
    const parent = elem.parentElement;
    if (parent === null) {
        throw new Error('Parent element not found.');
    }
    return parent;
}
