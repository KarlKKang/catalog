import { createElement } from '../../internal';

export function createInputElement(type: string) {
    const elem = createElement('input') as HTMLInputElement;
    elem.type = type;
    return elem;
}
