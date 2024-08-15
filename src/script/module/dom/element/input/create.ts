import { createElement } from '../internal/create_element';

export function createInputElement(type: string) {
    const elem = createElement('input');
    elem.type = type;
    return elem;
}
