import { setAttribute } from '../set';

export function setDataAttribute(elem: Element, name: string, value: string) {
    setAttribute(elem, 'data-' + name, value);
}
