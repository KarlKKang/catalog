import {
	DEVELOPMENT,
    TOP_URL,
} from '../module/env/constant';
import {
    getURLParam,
} from '../module/main';
import {
    changeURL,
    getComputedStyle,
} from '../module/DOM';

export function getContentBoxHeight (elem: HTMLElement): number {
    var height = elem.scrollHeight;
    height -= parseFloat(getComputedStyle(elem, 'padding-top')) + parseFloat(getComputedStyle(elem, 'padding-bottom'));
    return height;
}

export function updateURLParam (seriesID: string, epIndex: number, formatIndex: number): void {
    let url: string;
    if (DEVELOPMENT) {
        url = 'bangumi.html' + '?series=' + seriesID;
    } else {
        url = TOP_URL + '/bangumi/' + seriesID;
    }

    let query = getQuery(epIndex, formatIndex);
    if (query !== '') {
        url += (DEVELOPMENT ? '&' : '?') + query;
    }

    changeURL(url, true);
}

export function getLogoutParam (seriesID: string, epIndex: number): string {
    let query = 'series=' + seriesID;
    let additionalQuery = getQuery(epIndex, getFormatIndex());
    if (additionalQuery === '') {
        return query;
    }
    return query + '&' + additionalQuery;
}

function getQuery (epIndex: number, formatIndex: number): string {
    let query = '';
    let separator: '' | '&' = '';

    if (epIndex !== 0) {
        query += 'ep='+(epIndex+1);
        separator = '&';
    }
    
    if (formatIndex !== 0) {
        query += separator + 'format=' + (formatIndex + 1);
    }

    return query;
}

export function parseCharacters (txt: string) {
    txt = txt.replace(/<.*?>/g, '');
    txt = txt.replace(/&gt;/g, '>');
    txt = txt.replace(/&lt;/g, '<');
    txt = txt.replace(/&amp;/g, '&');
    return txt;
}

export function getFormatIndex (): number {
    const formatIndexParam = getURLParam('format');
    let formatIndex: number;
	if (formatIndexParam === null) {
        formatIndex = 0;
    } else {
        formatIndex = parseInt(formatIndexParam);
        if (isNaN(formatIndex) || formatIndex<1) {
            formatIndex = 0;
        } else {
            formatIndex--;
        }
    }
    return formatIndex;
}