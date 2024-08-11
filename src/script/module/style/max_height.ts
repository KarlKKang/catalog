import { setStyle, CSS_PROPERTY } from './internal';
import type { CSS_UNIT } from './value/unit';

export function setMaxHeight(element: HTMLElement, value: number, unit: CSS_UNIT): void;
export function setMaxHeight(element: HTMLElement, value: null): void;
export function setMaxHeight(element: HTMLElement, value: number | null, unit?: CSS_UNIT) {
    setStyle(element, CSS_PROPERTY.MAX_HEIGHT, value, unit);
}
