import { createElement } from '../internal';

export function createSelectElement() {
    return createElement('select') as HTMLSelectElement;
}
