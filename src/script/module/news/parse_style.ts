import * as commonStyles from '../../../css/common.module.scss';
import * as styles from '../../../css/news.module.scss';
import { getDescendantsByClass } from '../dom/get_element';
import { addClass } from '../dom/class/add';
import { removeClass } from '../dom/class/remove';

const classMap = {
    'sub-title': styles.subTitle,
    'bolder': styles.bolder,
    'bold': styles.bold,
    'line-break': styles.lineBreak,
    'code-inline': styles.codeInline,
    'color-red': commonStyles.colorRed,
    'color-green': commonStyles.colorGreen,
    'color-orange': commonStyles.colorOrange,
    'link': commonStyles.link,
};

export function parseNewsStyle(container: HTMLElement) {
    for (const [key, value] of Object.entries(classMap)) {
        const elements = getDescendantsByClass(container, key);
        // The loop has to be done this way because the `elements` array is a live collection.
        let elem = elements[0];
        while (elem !== undefined) {
            addClass(elem, value);
            removeClass(elem, key);
            elem = elements[0];
        }
    }
}
