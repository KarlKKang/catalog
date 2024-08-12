import { CSS_PROPERTY } from './internal/property';
import { removeStyle } from './internal/remove_style';

export function showElement(elem: HTMLElement) {
    removeStyle(elem, CSS_PROPERTY.DISPLAY);
}
