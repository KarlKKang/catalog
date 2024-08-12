import { CSS_PROPERTY } from './internal/property';
import { addStyle } from './internal/add_style';

export function hideElement(elem: HTMLElement) {
    addStyle(elem, CSS_PROPERTY.DISPLAY, 'none');
}
