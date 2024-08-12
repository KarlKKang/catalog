import type { CSS_UNIT } from "../value/unit";
import type { CSS_PROPERTY } from "./property";
import { addStyle } from './add_style';
import { removeStyle } from './remove_style';

export function setStyle(element: HTMLElement, property: CSS_PROPERTY, value: number | string | null, unit?: CSS_UNIT) {
    if (value === null) {
        removeStyle(element, property);
    } else {
        addStyle(element, property, value, unit);
    }
}
