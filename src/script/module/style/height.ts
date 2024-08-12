import { CSS_PROPERTY } from './internal/property';
import { setStyle } from './internal/set_style';
import type { CSS_AUTO } from './value/auto';
import type { CSS_UNIT } from './value/unit';

export function setHeight(element: HTMLElement, value: number, unit: CSS_UNIT): void;
export function setHeight(element: HTMLElement, value: typeof CSS_AUTO | null): void;
export function setHeight(element: HTMLElement, value: number | typeof CSS_AUTO | null, unit?: CSS_UNIT) {
    setStyle(element, CSS_PROPERTY.HEIGHT, value, unit);
}
