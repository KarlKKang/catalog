import { appendText, createDivElement, createEmailLink, createParagraphElement, createSpanElement } from './module/dom/create_element';
import { clearSessionStorage, getHost, getProtocol, windowLocation } from './module/dom/document';
import { addClass, appendChild, replaceChildren } from './module/dom/element';
import { getServerOrigin, splitHostname } from './module/env/origin';
import { addEventListener, removeAllEventListeners } from './module/event_listener';
import { ShowPageFunc } from './module/global';
import { addNavBar } from './module/nav_bar';
import { createNewsTemplate } from './module/news';
import { ServerRequestOptionProp, parseResponse, sendServerRequest } from './module/server';
import { type PopInfo, parsePopsList, PopInfoKey } from './module/type/PopsList';
import * as commonStyles from '../css/common.module.scss';
import * as styles from '../css/news.module.scss';
import { body } from './module/dom/body';
import { popsPageTitle } from './module/text/page_title';
import { POPS_URI } from './module/env/uri';
import { TOP_DOMAIN } from './module/env/domain';

const enum PopInfoNodeKey {
    INFO,
    FULL_CODE,
    LATENCY,
    IN_USE,
    NEXT,
}
type PopInfoNode = {
    readonly [PopInfoNodeKey.INFO]: PopInfo | null;
    [PopInfoNodeKey.FULL_CODE]: string | null;
    [PopInfoNodeKey.LATENCY]: number | null | false;
    readonly [PopInfoNodeKey.IN_USE]: boolean;
    [PopInfoNodeKey.NEXT]: PopInfoNode | null;
};

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();
    addNavBar();

    sendServerRequest('list_pops', {
        [ServerRequestOptionProp.CALLBACK]: async (response: string) => {
            const popsList = parseResponse(response, parsePopsList);
            showPage();
            const [outerContainer, innerContainer] = createNewsTemplate(popsPageTitle, null, null);
            const contentContainer = createDivElement();
            addClass(contentContainer, styles.content);
            appendChild(innerContainer, contentContainer);
            appendChild(body, outerContainer);

            const promptParagraph = createParagraphElement(
                '以下は、いくつかのPoints of Presenceの専用エンドポイントです。「自動」が最適でない場合は、これらのいずれかを使用することができます。他のPoints of Presenceを専用エンドポイントとして公開する必要がある場合は、管理者（'
            );
            appendChild(promptParagraph, createEmailLink('admin@' + TOP_DOMAIN));
            appendText(promptParagraph, '）にお問い合わせください。');
            appendChild(contentContainer, promptParagraph);

            const popListContainer = createDivElement();
            popListContainer.style.textAlign = 'center';
            appendChild(contentContainer, popListContainer);

            const currentLocation = splitHostname()[0].toLowerCase();
            const head = {
                [PopInfoNodeKey.INFO]: null,
                [PopInfoNodeKey.FULL_CODE]: null,
                [PopInfoNodeKey.LATENCY]: null,
                [PopInfoNodeKey.IN_USE]: currentLocation === '',
                [PopInfoNodeKey.NEXT]: null,
            };
            let current: PopInfoNode = head;
            for (const popInfo of popsList) {
                const next = {
                    [PopInfoNodeKey.INFO]: popInfo,
                    [PopInfoNodeKey.FULL_CODE]: null,
                    [PopInfoNodeKey.LATENCY]: null,
                    [PopInfoNodeKey.IN_USE]: currentLocation === (popInfo[PopInfoKey.CODE].toLowerCase() + '.'),
                    [PopInfoNodeKey.NEXT]: null,
                };
                current[PopInfoNodeKey.NEXT] = next;
                current = next;
            }
            testNextPop(popListContainer, head, currentLocation.length);
        },
        [ServerRequestOptionProp.METHOD]: 'GET',
    });
}

function testNextPop(container: HTMLDivElement, head: PopInfoNode, locationPrefixLength: number) {
    replaceChildren(container);
    let testPopNodePrevious: PopInfoNode | null = null;
    let testPopNode: PopInfoNode | null = null;
    let previous: PopInfoNode | null = null;
    let current: PopInfoNode | null = head;
    while (current !== null) {
        if (testPopNode === null && current[PopInfoNodeKey.LATENCY] === null) {
            testPopNodePrevious = previous;
            testPopNode = current;
        }
        const paragraphElem = createParagraphElement();
        const spanElem = createSpanElement();
        appendChild(container, paragraphElem);
        appendChild(paragraphElem, spanElem);
        const popInfo = current[PopInfoNodeKey.INFO];
        if (popInfo !== null) {
            const code = current[PopInfoNodeKey.FULL_CODE] ?? popInfo[PopInfoKey.CODE].toUpperCase();
            appendText(
                spanElem,
                popInfo[PopInfoKey.LOCATION] + '（' + code + '・' + popInfo[PopInfoKey.COUNTRY] + '）'
            );
        } else {
            appendText(spanElem, '自動');
            const fullCode = current[PopInfoNodeKey.FULL_CODE];
            if (fullCode !== null) {
                appendText(spanElem, '（' + fullCode + '）');
            }
        }
        appendText(spanElem, '：');
        if (current[PopInfoNodeKey.LATENCY] === null) {
            appendText(spanElem, '測定中…');
        } else if (current[PopInfoNodeKey.LATENCY] === false) {
            appendText(spanElem, '測定失敗');
        } else {
            appendText(spanElem, current[PopInfoNodeKey.LATENCY] + 'ms');
        }
        if (current[PopInfoNodeKey.IN_USE]) {
            appendText(spanElem, '（現在使用中）');
        } else if (current[PopInfoNodeKey.LATENCY] !== null && current[PopInfoNodeKey.LATENCY] !== false) {
            addClass(spanElem, commonStyles.link);
            addEventListener(spanElem, 'click', () => {
                const host = getHost().substring(locationPrefixLength);
                const locationPrefix = popInfo !== null ? popInfo[PopInfoKey.CODE].toLowerCase() + '.' : '';
                windowLocation.href = getProtocol() + '//' + locationPrefix + host + POPS_URI;
            });
        }
        previous = current;
        current = current[PopInfoNodeKey.NEXT];
    }

    const testPopNodeConst = testPopNode;
    if (testPopNodeConst === null) {
        return;
    }

    if (testPopNodePrevious !== null) { // Remove the node from the linked list.
        testPopNodePrevious[PopInfoNodeKey.NEXT] = testPopNodeConst[PopInfoNodeKey.NEXT];
    }
    let code = '';
    let locationPrefix = '';
    const popInfo = testPopNodeConst[PopInfoNodeKey.INFO];
    if (popInfo !== null) {
        code = popInfo[PopInfoKey.CODE].toLowerCase();
        locationPrefix = code + '.';
    }
    const sortResult = (latency: number | false) => {
        if (testPopNodePrevious !== null) {// Add the node back to the linked list, in sorted order.
            let previous: PopInfoNode | null = null;
            let current: PopInfoNode | null = head;
            while (
                current !== null &&
                current[PopInfoNodeKey.LATENCY] !== null &&
                current[PopInfoNodeKey.LATENCY] !== false &&
                (latency === false || current[PopInfoNodeKey.LATENCY] < latency)
            ) {
                previous = current;
                current = current[PopInfoNodeKey.NEXT];
            }
            testPopNodeConst[PopInfoNodeKey.NEXT] = current;
            if (previous === null) {
                head = testPopNodeConst;
            } else {
                previous[PopInfoNodeKey.NEXT] = testPopNodeConst;
            }
        }
    };
    const onErrorCallback = () => {
        testPopNodeConst[PopInfoNodeKey.LATENCY] = false;
        sortResult(false);
        testNextPop(container, head, locationPrefixLength);
    };
    testPop(locationPrefix, () => { // The first request is to cache DNS to avoid the impact of DNS caching on the latency test.
        const start = performance.now();
        testPop(locationPrefix, (fullCode) => {
            if (fullCode === null || !fullCode.toLowerCase().startsWith(code)) {
                onErrorCallback();
                return;
            }
            const latency = Math.round(performance.now() - start);
            testPopNodeConst[PopInfoNodeKey.FULL_CODE] = fullCode;
            testPopNodeConst[PopInfoNodeKey.LATENCY] = latency;
            sortResult(latency);
            testNextPop(container, head, locationPrefixLength);
        }, onErrorCallback);
    }, onErrorCallback);
}

function testPop(locationPrefix: string, callback: (fullCode: string | null) => void, onErrorCallback: () => void) {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', getServerOrigin(locationPrefix) + '/empty', true);

    addEventListener(xhr, 'error', () => {
        removeAllEventListeners(xhr);
        onErrorCallback();
    });
    addEventListener(xhr, 'abort', () => {
        removeAllEventListeners(xhr);
        onErrorCallback();
    });
    addEventListener(xhr, 'load', () => {
        removeAllEventListeners(xhr);
        if (xhr.status === 200 && xhr.responseText === '') {
            callback(xhr.getResponseHeader('X-Amz-Cf-Pop'));
        } else {
            onErrorCallback();
        }
    });

    xhr.send();
}