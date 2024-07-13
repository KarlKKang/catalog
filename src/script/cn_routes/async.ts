import { appendText, createDivElement, createParagraphElement, createSpanElement } from '../module/dom/create_element';
import { getProtocol, windowLocation } from '../module/dom/document';
import { addClass, appendChild, replaceChildren } from '../module/dom/element';
import { concatenateLocationPrefix, getBaseHost, getLocationPrefix, getServerOrigin } from '../module/env/origin';
import { addEventListener } from '../module/event_listener';
import { createNewsTemplate } from '../module/news';
import { type RouteInfo, RouteInfoKey, type RouteList } from '../module/type/RouteList';
import * as commonStyles from '../../css/common.module.scss';
import * as styles from '../../css/news.module.scss';
import { body } from '../module/dom/body';
import { cnRoutesPageTitle } from '../module/text/page_title';
import { NEWS_ROOT_URI } from '../module/env/uri';
import { addManualMultiLanguageClass } from '../module/dom/create_element/multi_language';
import { redirect } from '../module/global';
import { newXHR } from '../module/common';

const enum RouteInfoNodeKey {
    INFO,
    LATENCY,
    IN_USE,
    NEXT,
}
type RouteInfoNode = {
    readonly [RouteInfoNodeKey.INFO]: RouteInfo | null;
    [RouteInfoNodeKey.LATENCY]: number | null | false;
    readonly [RouteInfoNodeKey.IN_USE]: boolean;
    [RouteInfoNodeKey.NEXT]: RouteInfoNode | null;
};

export default function (routeList: RouteList) {
    const [outerContainer, innerContainer] = createNewsTemplate(cnRoutesPageTitle, null, null);
    const contentContainer = createDivElement();
    addClass(contentContainer, styles.content);
    addManualMultiLanguageClass(contentContainer);
    appendChild(innerContainer, contentContainer);
    appendChild(body, outerContainer);

    const NEWS_URI = NEWS_ROOT_URI + '2ghJ5dHKW8T';

    const promptParagraphJa = createParagraphElement('以下は、中国のユーザーのために用意した回線です（詳細は');
    const linkJa = createSpanElement();
    addClass(linkJa, commonStyles.link);
    appendText(linkJa, 'こちら');
    addEventListener(linkJa, 'click', () => {
        redirect(NEWS_URI);
    });
    appendChild(promptParagraphJa, linkJa);
    appendText(promptParagraphJa, '）。測定後、クリックして切り替えることができます。512kBのファイルをダウンロードするのにかかる時間を計測しています。時間が短いほど良いです。2000ミリ秒以上かかる場合は、回線が混雑している可能性があります。1000ミリ秒前後かそれ以下であれば、大きな差はないので安心して利用できます。');

    const promptParagraphEn = createParagraphElement(
        'Below are the routes we have prepared for users in China (see details '
    );
    promptParagraphEn.lang = 'en';
    const linkEn = createSpanElement();
    addClass(linkEn, commonStyles.link);
    appendText(linkEn, 'here');
    addEventListener(linkEn, 'click', () => {
        redirect(NEWS_URI + '#en');
    });
    appendChild(promptParagraphEn, linkEn);
    appendText(promptParagraphEn, '). After measuring, you can click to switch between them. We are measuring the time it takes to download a 512kB file. The shorter the time, the better. If it takes more than 2000ms, the route may be congested. If it is around 1000 milliseconds or less, there is no significant difference and you can use it without worry.');

    const promptParagraphHant = createParagraphElement(
        '以下是我們為中國用戶準備的線路（點擊'
    );
    promptParagraphHant.lang = 'zh-Hant';
    const linkHant = createSpanElement();
    addClass(linkHant, commonStyles.link);
    appendText(linkHant, '此處');
    addEventListener(linkHant, 'click', () => {
        redirect(NEWS_URI + '#zh-Hant');
    });
    appendChild(promptParagraphHant, linkHant);
    appendText(promptParagraphHant, '了解詳情）。測量完成後，可以點擊切換線路。我們測量下載一個512kB文件所需的時間。時間越短越好。如果超過2000毫秒，則此線路可能擁擠。如果在1000毫秒左右或者更短的話，則區別不大，可放心使用。');

    const promptParagraphHans = createParagraphElement(
        '以下是我们为中国用户准备的线路（点击'
    );
    promptParagraphHans.lang = 'zh-Hans';
    const linkHans = createSpanElement();
    addClass(linkHans, commonStyles.link);
    appendText(linkHans, '此处');
    addEventListener(linkHans, 'click', () => {
        redirect(NEWS_URI + '#zh-Hans');
    });
    appendChild(promptParagraphHans, linkHans);
    appendText(promptParagraphHans, '了解详情）。测量完成后，可以点击切换线路。我们测量下载一个512kB文件所需的时间。时间越短越好。如果超过2000毫秒，则此线路可能拥挤。如果在1000毫秒左右或者更短的话，则区别不大，可放心使用。');

    appendChild(contentContainer, promptParagraphJa);
    appendChild(contentContainer, promptParagraphEn);
    appendChild(contentContainer, promptParagraphHant);
    appendChild(contentContainer, promptParagraphHans);

    const routeListContainer = createDivElement();
    routeListContainer.style.textAlign = 'center';
    appendChild(contentContainer, routeListContainer);

    const currentLocation = getLocationPrefix().toLowerCase();
    const head = {
        [RouteInfoNodeKey.INFO]: null,
        [RouteInfoNodeKey.LATENCY]: null,
        [RouteInfoNodeKey.IN_USE]: currentLocation === '',
        [RouteInfoNodeKey.NEXT]: null,
    };
    let current: RouteInfoNode = head;
    for (const routeInfo of routeList) {
        const next = {
            [RouteInfoNodeKey.INFO]: routeInfo,
            [RouteInfoNodeKey.LATENCY]: null,
            [RouteInfoNodeKey.IN_USE]: currentLocation === (routeInfo[RouteInfoKey.CODE].toLowerCase() + '.'),
            [RouteInfoNodeKey.NEXT]: null,
        };
        current[RouteInfoNodeKey.NEXT] = next;
        current = next;
    }
    testNextRoute(routeListContainer, head);
}

function testNextRoute(container: HTMLDivElement, head: RouteInfoNode) {
    replaceChildren(container);
    let testRouteNodePrevious: RouteInfoNode | null = null;
    let testRouteNode: RouteInfoNode | null = null;
    let previous: RouteInfoNode | null = null;
    let current: RouteInfoNode | null = head;
    while (current !== null) {
        if (testRouteNode === null && current[RouteInfoNodeKey.LATENCY] === null) {
            testRouteNodePrevious = previous;
            testRouteNode = current;
        }
        const paragraphElem = createParagraphElement();
        const spanElem = createSpanElement();
        appendChild(container, paragraphElem);
        appendChild(paragraphElem, spanElem);
        const routeInfo = current[RouteInfoNodeKey.INFO];
        if (routeInfo !== null) {
            appendText(spanElem, routeInfo[RouteInfoKey.NAME]);
        } else {
            appendText(spanElem, 'CloudFront');
        }
        appendText(spanElem, '：');
        if (current[RouteInfoNodeKey.LATENCY] === null) {
            appendText(spanElem, '測定中…');
        } else if (current[RouteInfoNodeKey.LATENCY] === false) {
            appendText(spanElem, '測定失敗');
        } else if (current[RouteInfoNodeKey.LATENCY] === -1) {
            appendText(spanElem, '速度をテストする前にログインしてください');
        } else {
            appendText(spanElem, current[RouteInfoNodeKey.LATENCY] + 'ms');
        }
        if (current[RouteInfoNodeKey.IN_USE]) {
            appendText(spanElem, '（現在使用中）');
        } else if (current[RouteInfoNodeKey.LATENCY] !== null && current[RouteInfoNodeKey.LATENCY] !== false) {
            addClass(spanElem, commonStyles.link);
            addEventListener(spanElem, 'click', () => {
                const baseHost = getBaseHost(); // Use host just in case there is a port number.
                const locationPrefix = routeInfo !== null ? routeInfo[RouteInfoKey.CODE].toLowerCase() + '.' : '';
                windowLocation.href = getProtocol() + '//' + concatenateLocationPrefix(locationPrefix, baseHost);
            });
        }
        previous = current;
        current = current[RouteInfoNodeKey.NEXT];
    }

    const testRouteNodeConst = testRouteNode;
    if (testRouteNodeConst === null) {
        return;
    }

    if (testRouteNodePrevious !== null) { // Remove the node from the linked list.
        testRouteNodePrevious[RouteInfoNodeKey.NEXT] = testRouteNodeConst[RouteInfoNodeKey.NEXT];
    }
    let locationPrefix = '';
    const routeInfo = testRouteNodeConst[RouteInfoNodeKey.INFO];
    if (routeInfo !== null) {
        locationPrefix = routeInfo[RouteInfoKey.CODE].toLowerCase() + '.';
    }
    const sortResult = (latency: number | false) => {
        if (testRouteNodePrevious !== null) {// Add the node back to the linked list, in sorted order.
            let previous: RouteInfoNode | null = null;
            let current: RouteInfoNode | null = head;
            while (
                current !== null &&
                current[RouteInfoNodeKey.LATENCY] !== null &&
                current[RouteInfoNodeKey.LATENCY] !== false &&
                (latency === false || current[RouteInfoNodeKey.LATENCY] < latency)
            ) {
                previous = current;
                current = current[RouteInfoNodeKey.NEXT];
            }
            testRouteNodeConst[RouteInfoNodeKey.NEXT] = current;
            if (previous === null) {
                head = testRouteNodeConst;
            } else {
                previous[RouteInfoNodeKey.NEXT] = testRouteNodeConst;
            }
        }
    };
    const onErrorCallback = () => {
        testRouteNodeConst[RouteInfoNodeKey.LATENCY] = false;
        sortResult(false);
        testNextRoute(container, head);
    };
    const onUnauthorizedCallback = () => {
        testRouteNodeConst[RouteInfoNodeKey.LATENCY] = -1;
        sortResult(false);
        testNextRoute(container, head);
    };
    testRoute('/empty', locationPrefix, () => { // The first request is to cache DNS to avoid the impact of DNS caching on the latency test.
        const start = performance.now();
        testRoute('/512kB', locationPrefix, () => {
            const latency = Math.round(performance.now() - start);
            testRouteNodeConst[RouteInfoNodeKey.LATENCY] = latency;
            sortResult(latency);
            testNextRoute(container, head);
        }, onErrorCallback, onUnauthorizedCallback);
    }, onErrorCallback, onUnauthorizedCallback);
}

function testRoute(uri: string, locationPrefix: string, callback: () => void, onErrorCallback: () => void, onUnauthorizedCallback: () => void) {
    const xhr = newXHR(
        getServerOrigin(locationPrefix) + uri,
        'POST',
        true,
        () => {
            if (xhr.status === 200) {
                callback();
            } else if (xhr.status === 403 && xhr.responseText === 'UNAUTHORIZED') {
                onUnauthorizedCallback();
            } else {
                onErrorCallback();
            }
        },
        onErrorCallback,
        onErrorCallback,
    );
    xhr.send();
}