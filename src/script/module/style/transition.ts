import { removeStyle, CSS_PROPERTY, addStyle } from './internal';

export function enableTransition(element: HTMLElement, enable: boolean) {
    if (enable) {
        removeStyle(element, CSS_PROPERTY.TRANSITION);
    } else {
        addStyle(element, CSS_PROPERTY.TRANSITION, 'none');
    }
}
