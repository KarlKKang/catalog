import { CSS_PROPERTY } from './internal/property';
import { setStyle } from './internal/set_style';
import type { CSS_UNIT } from './value/unit';

export function setPaddingTop(element: HTMLElement, value: number, unit: CSS_UNIT): void;
export function setPaddingTop(element: HTMLElement, value: null): void;
export function setPaddingTop(element: HTMLElement, value: number | null, unit?: CSS_UNIT) {
    setStyle(element, CSS_PROPERTY.PADDING_TOP, value, unit);
}
