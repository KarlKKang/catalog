import type { CSS_PROPERTY } from "./property";

export function removeStyle(element: HTMLElement, property: CSS_PROPERTY) {
    element.style[property] = '';
}
