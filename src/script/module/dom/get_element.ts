import { d } from './document';

export function getById(id: string) {
    return d.getElementById(id);
}

export function getByClass(parent: Element | Document, className: string) {
    return parent.getElementsByClassName(className);
}

export function getByTag(parent: Element | Document, tagName: string) {
    return parent.getElementsByTagName(tagName);
}
