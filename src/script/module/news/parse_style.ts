import * as colorStyle from '../../../css/color.module.scss';
import { link as linkClass } from '../../../css/link.module.scss';
import * as styles from '../../../css/news.module.scss';
import { getByClass } from '../dom/element/get/by_class';
import { addClass } from '../dom/class/add';
import { removeClass } from '../dom/class/remove';

const classMap = {
    'sub-title': styles.subTitle,
    'bolder': styles.bolder,
    'bold': styles.bold,
    'line-break': styles.lineBreak,
    'code-inline': styles.codeInline,
    'color-red': colorStyle.red,
    'color-green': colorStyle.green,
    'color-orange': colorStyle.orange,
    'link': linkClass,
};

export function parseNewsStyle(container: HTMLElement) {
    for (const [key, value] of Object.entries(classMap)) {
        const elements = getByClass(container, key);
        // The loop has to be done this way because the `elements` array is a live collection.
        let elem = elements[0];
        while (elem !== undefined) {
            addClass(elem, value);
            removeClass(elem, key);
            elem = elements[0];
        }
    }
}
