import { createElement } from '../../internal/create_element';

export function createInputElement(type: string) {
    const elem = createElement('input') as HTMLInputElement;
    elem.type = type;
    return elem;
}
