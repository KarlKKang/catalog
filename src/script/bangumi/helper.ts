import { getSearchParam } from '../module/dom/location/get/search_param';
import { w } from '../module/dom/window';
import { createTextNode } from '../module/dom/element/text/create';
import { createParagraphElement } from '../module/dom/element/paragraph/create';
import { createDivElement } from '../module/dom/element/div/create';
import { appendChild } from '../module/dom/node/append_child';
import { appendChildren } from '../module/dom/node/append_children';
import { addClass } from '../module/dom/class/add';
import { changeColor, type CSS_COLOR } from '../module/style/color';
import * as styles from '../../css/bangumi.module.scss';
import { buildHttpForm } from '../module/string/http_form/build';
import { buildURI } from '../module/string/uri/build';
import { BANGUMI_ROOT_URI } from '../module/env/uri';

export function getContentBoxHeight(elem: HTMLElement): number {
    let height = elem.scrollHeight;
    const computedStyle = w.getComputedStyle(elem);
    let paddingTop = parseFloat(computedStyle.getPropertyValue('padding-top'));
    if (isNaN(paddingTop)) {
        paddingTop = 0;
    }
    let paddingBottom = parseFloat(computedStyle.getPropertyValue('padding-bottom'));
    if (isNaN(paddingBottom)) {
        paddingBottom = 0;
    }
    height -= paddingTop + paddingBottom;
    return height;
}

export function getEPFullURI(seriesID: string, epIndex: number, formatIndex: number): string {
    return buildURI(
        BANGUMI_ROOT_URI + seriesID + '/' + (epIndex + 1),
        buildHttpForm({
            ...formatIndex !== 0 && { format: formatIndex + 1 },
        }),
    );
}

export function parseCharacters(txt: string) {
    txt = txt.replace(/&gt;/g, '>');
    txt = txt.replace(/&lt;/g, '<');
    txt = txt.replace(/&amp;/g, '&');
    return txt;
}

export function getFormatIndex(): number {
    const formatIndexParam = getSearchParam('format');
    let formatIndex: number;
    if (formatIndexParam === null) {
        formatIndex = 0;
    } else {
        formatIndex = parseInt(formatIndexParam);
        if (isNaN(formatIndex) || formatIndex < 1) {
            formatIndex = 0;
        } else {
            formatIndex--;
        }
    }
    return formatIndex;
}

export function createMessageElem(title: Node[] | string, body: Node[] | string, titleColor: CSS_COLOR | null, additionalContent: HTMLElement | null = null) {
    const outerContainer = createDivElement();
    const innerContainer = createDivElement();
    addClass(outerContainer, styles.message);
    appendChild(outerContainer, innerContainer);

    const titleElem = createParagraphElement();
    const bodyElem = createDivElement();
    addClass(titleElem, styles.messageTitle);
    addClass(bodyElem, styles.messageBody);
    isArray(title) ? appendChildren(titleElem, ...title) : appendChild(titleElem, createTextNode(title));
    isArray(body) ? appendChildren(bodyElem, ...body) : appendChild(bodyElem, createTextNode(body));
    titleColor !== null && changeColor(titleElem, titleColor);
    appendChild(innerContainer, titleElem);
    appendChild(innerContainer, bodyElem);
    additionalContent !== null && appendChild(innerContainer, additionalContent);

    return outerContainer;
}

export function isArray(arg: any): arg is any[] {
    return Array.isArray(arg);
}
