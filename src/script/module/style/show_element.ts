import { removeStyle, CSS_PROPERTY } from './internal';

export function showElement(elem: HTMLElement) {
    removeStyle(elem, CSS_PROPERTY.DISPLAY);
}
