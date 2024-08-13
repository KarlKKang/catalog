import { link as linkClass } from '../../../css/link.module.scss';
import * as styles from '../../../css/news.module.scss';
import { getByClass } from '../dom/element/get/by_class';
import { addClass } from '../dom/class/add';
import { removeClass } from '../dom/class/remove';
import { changeColor, CSS_COLOR } from '../style/color';

const classMap = {
    'sub-title': styles.subTitle,
    'bolder': styles.bolder,
    'bold': styles.bold,
    'line-break': styles.lineBreak,
    'code-inline': styles.codeInline,
    'link': linkClass,
};
const colorMap = {
    'color-red': CSS_COLOR.RED,
    'color-green': CSS_COLOR.GREEN,
    'color-orange': CSS_COLOR.ORANGE,
};

export function parseNewsStyle(container: HTMLElement) {
    loopClasses(container, classMap, addClass);
    loopClasses(container, colorMap, changeColor);
}

function loopClasses<T>(container: HTMLElement, map: Record<string, T>, callback: (elem: Element, value: T) => void) {
    for (const [key, value] of Object.entries(map)) {
        const elements = getByClass(container, key);
        // The loop has to be done this way because the `elements` array is a live collection.
        let elem = elements[0];
        while (elem !== undefined) {
            callback(elem, value);
            removeClass(elem, key);
            elem = elements[0];
        }
    }
}
