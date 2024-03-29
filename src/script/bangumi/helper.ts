import {
    changeColor,
    getURLParam,
} from '../module/common';
import {
    w,
    addClass,
    appendChild,
    createDivElement,
    createParagraphElement,
    appendChildren,
} from '../module/dom';

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

export function getLogoutParam(seriesID: string, epIndex: number): string {
    const query = 'series=' + seriesID;
    const additionalQuery = createQuery(epIndex, getFormatIndex());
    if (additionalQuery === '') {
        return query;
    }
    return query + '&' + additionalQuery;
}

export function createQuery(epIndex: number, formatIndex: number): string {
    let query = '';
    let separator: '' | '&' = '';

    if (epIndex !== 0) {
        query += 'ep=' + (epIndex + 1);
        separator = '&';
    }

    if (formatIndex !== 0) {
        query += separator + 'format=' + (formatIndex + 1);
    }

    return query;
}

export function parseCharacters(txt: string) {
    txt = txt.replace(/&gt;/g, '>');
    txt = txt.replace(/&lt;/g, '<');
    txt = txt.replace(/&amp;/g, '&');
    return txt;
}

export function getFormatIndex(): number {
    const formatIndexParam = getURLParam('format');
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

export function createMessageElem(title: string, body: Node[], titleColor: string | null, additionalContent: HTMLElement | null = null) {
    const outerContainer = createDivElement();
    const innerContainer = createDivElement();
    addClass(outerContainer, 'message');
    appendChild(outerContainer, innerContainer);

    const titleElem = createParagraphElement();
    const bodyElem = createDivElement();
    addClass(titleElem, 'message-title');
    addClass(bodyElem, 'message-body');
    titleElem.innerHTML = title;
    appendChildren(bodyElem, ...body);
    titleColor !== null && changeColor(titleElem, titleColor);
    appendChild(innerContainer, titleElem);
    appendChild(innerContainer, bodyElem);
    additionalContent !== null && appendChild(innerContainer, additionalContent);

    return outerContainer;
}