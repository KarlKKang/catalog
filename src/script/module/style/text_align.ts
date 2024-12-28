import { CSS_PROPERTY } from './internal/property';
import { setStyle } from './internal/set_style';

export const enum CSS_TEXT_ALIGN {
    CENTER = 'center',
    LEFT = 'left',
    RIGHT = 'right',
}

export function setTextAlign(element: HTMLElement, textAlign: CSS_TEXT_ALIGN | null) {
    setStyle(element, CSS_PROPERTY.TEXT_ALIGN, textAlign);
}
