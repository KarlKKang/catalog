import { createElement } from '../internal/create_element';

export function createDivElement() {
    return createElement('div') as HTMLDivElement;
}
