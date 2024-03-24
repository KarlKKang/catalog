import {
    addClass,
    appendChild,
    body,
    createDivElement,
} from '../module/dom';
import html from '../../html/info.html';
import * as styles from '../../css/news.module.scss';
import { addManualAllLanguageClass } from '../module/dom/create_element/all_language';
import { createNewsTemplate, parseNewsStyle } from '../module/news';
import { infoPageTitle } from '../module/text/page_title';

export default function () {
    const [outerContainer, innerContainer] = createNewsTemplate(infoPageTitle, null, 1699333200);
    const contentContainer = createDivElement();
    addClass(contentContainer, styles.content);
    addManualAllLanguageClass(contentContainer);
    contentContainer.innerHTML = html;
    parseNewsStyle(contentContainer);
    appendChild(innerContainer, contentContainer);
    appendChild(body, outerContainer);
}