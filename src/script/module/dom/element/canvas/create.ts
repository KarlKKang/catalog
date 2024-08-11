import { createElement } from '../internal';

export function createCanvasElement() {
    return createElement('canvas') as HTMLCanvasElement;
}
