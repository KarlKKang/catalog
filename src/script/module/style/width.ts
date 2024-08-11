import { setStyle, CSS_PROPERTY } from './internal';
import type { CSS_AUTO } from './value/auto';
import type { CSS_UNIT } from './value/unit';

export function setWidth(element: HTMLElement, value: number, unit: CSS_UNIT): void;
export function setWidth(element: HTMLElement, value: typeof CSS_AUTO | null): void;
export function setWidth(element: HTMLElement, value: number | typeof CSS_AUTO | null, unit?: CSS_UNIT) {
    setStyle(element, CSS_PROPERTY.WIDTH, value, unit);
}
