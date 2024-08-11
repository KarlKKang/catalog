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

export function getDescendantsByClassAt(parent: Element | Document, className: string, index: number) {
    const elems = getDescendantsByClass(parent, className);
    const elem = elems[index];
    if (elem === undefined) {
        throw new Error(`Element with class '${className}' at index ${index} not found.`);
    }
    return elem;
}

export function getDescendantsByTag(parent: Element | Document, tagName: string) {
    return parent.getElementsByTagName(tagName);
}

export function getDescendantsByTagAt(parent: Element | Document, tagName: string, index: number) {
    const elems = getDescendantsByTag(parent, tagName);
    const elem = elems[index];
    if (elem === undefined) {
        throw new Error(`Element with tag '${tagName}' at index ${index} not found.`);
    }
    return elem;
}

export function getParentElement(elem: Node) {
    const parent = elem.parentElement;
    if (parent === null) {
        throw new Error('Parent element not found.');
    }
    return parent;
}
