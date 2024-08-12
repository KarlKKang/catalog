import { createElement } from '../internal/create_element';

export function createOptionElement() {
    return createElement('option') as HTMLOptionElement;
}
