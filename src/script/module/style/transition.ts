import { CSS_PROPERTY } from './internal/property';
import { addStyle } from './internal/add_style';
import { removeStyle } from './internal/remove_style';

export function enableTransition(element: HTMLElement, enable: boolean) {
    if (enable) {
        removeStyle(element, CSS_PROPERTY.TRANSITION);
    } else {
        addStyle(element, CSS_PROPERTY.TRANSITION, 'none');
    }
}
