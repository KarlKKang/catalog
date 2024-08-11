import { addStyle, CSS_PROPERTY } from './internal';

export function hideElement(elem: HTMLElement) {
    addStyle(elem, CSS_PROPERTY.DISPLAY, 'none');
}
