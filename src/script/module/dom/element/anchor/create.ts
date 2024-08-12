import { createElement } from '../internal/create_element';

export function createAnchorElement() {
    return createElement('a') as HTMLAnchorElement;
}
