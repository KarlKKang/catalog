import * as styles from '../../../css/news.module.scss';
import { getLocalTimeString } from '../time';
import { createHRElement } from '../dom/element/hr/create';
import { createParagraphElement } from '../dom/element/paragraph/create';
import { createDivElement } from '../dom/element/div/create';
import { appendChild } from '../dom/change_node';
import { addClass } from '../dom/class/add';

export function createNewsContainer(title: string, createTimestamp: number | null, updateTimestamp: number | null) {
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
