import { setStyle, CSS_PROPERTY } from './internal';
import type { CSS_UNIT } from './value/unit';

export function setLeft(element: HTMLElement, value: number, unit: CSS_UNIT): void;
export function setLeft(element: HTMLElement, value: null): void;
export function setLeft(element: HTMLElement, value: number | null, unit?: CSS_UNIT) {
    setStyle(element, CSS_PROPERTY.LEFT, value, unit);
}