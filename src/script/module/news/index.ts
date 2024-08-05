import * as commonStyles from '../../../css/common.module.scss';
import * as styles from '../../../css/news.module.scss';
import { getLocalTimeString } from '../time';
import { createDivElement, createHRElement, createParagraphElement } from '../dom/create_element';
import { getDescendantsByClass } from '../dom/element';
import { appendChild } from '../dom/change_node';
import { addClass, removeClass } from '../dom/class';

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

export function createNewsTemplate(title: string, createTimestamp: number | null, updateTimestamp: number | null) {
    const outerContainer = createDivElement();
    addClass(outerContainer, styles.contentContainer);
    const innerContainer = createDivElement();

    const titleContainer = createParagraphElement(title);
    addClass(titleContainer, styles.title);
    appendChild(innerContainer, titleContainer);

    if (createTimestamp !== null) {
        const createTime = getLocalTimeString(createTimestamp, true, false);
        const createTimeContainer = createParagraphElement('初回掲載日：' + createTime);
        addClass(createTimeContainer, styles.date);
        appendChild(innerContainer, createTimeContainer);
    }

    if (updateTimestamp !== null) {
        const updateTime = getLocalTimeString(updateTimestamp, true, false);
        const updateTimeContainer = createParagraphElement('最終更新日：' + updateTime);
        addClass(updateTimeContainer, styles.date);
        appendChild(innerContainer, updateTimeContainer);
    }

    appendChild(innerContainer, createHRElement());
    appendChild(outerContainer, innerContainer);

    return [outerContainer, innerContainer] as const;
}
