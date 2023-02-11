import {
    TOP_URL,
} from '../module/env/constant';
import {
    changeColor,
    getURLParam,
} from '../module/main';
import {
    addClass,
    appendChild,
    changeURL,
    createElement,
    getComputedStyle,
} from '../module/dom';

export function getContentBoxHeight(elem: HTMLElement): number {
    let height = elem.scrollHeight;
    height -= parseFloat(getComputedStyle(elem, 'padding-top')) + parseFloat(getComputedStyle(elem, 'padding-bottom'));
    return height;
}

export function updateURLParam(seriesID: string, epIndex: number, formatIndex: number): void {
    let url = TOP_URL + '/bangumi/' + seriesID;

    const query = createQuery(epIndex, formatIndex);
    if (query !== '') {
        url += '?' + query;
    }

    changeURL(url, true);
}

export function getLogoutParam(seriesID: string, epIndex: number): string {
    const query = 'series=' + seriesID;
    const additionalQuery = createQuery(epIndex, getFormatIndex());
    if (additionalQuery === '') {
        return query;
    }
    return query + '&' + additionalQuery;
}

function createQuery(epIndex: number, formatIndex: number): string {
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
    txt = txt.replace(/<.*?>/g, '');
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

export function createMessageElem(title: string, body: string, titleColor: string | null) {
    const container = createElement('div');
    const titleElem = createElement('p');
    const bodyElem = createElement('div');
    addClass(container, 'message');
    addClass(titleElem, 'message-title');
    addClass(bodyElem, 'message-body');
    titleElem.innerHTML = title;
    bodyElem.innerHTML = body;
    titleColor !== null && changeColor(titleElem, titleColor);
    appendChild(container, titleElem);
    appendChild(container, bodyElem);
    return container;
}