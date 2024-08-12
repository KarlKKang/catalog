import { createElement } from '../internal/create_element';

export function createCanvasElement() {
    return createElement('canvas') as HTMLCanvasElement;
}
