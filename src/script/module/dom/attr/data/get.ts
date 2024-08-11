import { getAttribute } from '../get';

export function getDataAttribute(elem: Element, name: string) {
    return getAttribute(elem, 'data-' + name);
}
