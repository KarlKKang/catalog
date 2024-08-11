import { appendText, createButtonElement, createDivElement, createHRElement, createParagraphElement, createSpanElement, replaceText } from '../module/dom/create_element';
import { getProtocol, w, windowLocation } from '../module/dom/document';
import { appendChild, replaceChildren } from '../module/dom/change_node';
import { addClass } from '../module/dom/class';
import { concatenateLocationPrefix, getBaseHost, getLocationPrefix, getServerOrigin, locationCodeToPrefix } from '../module/env/origin';
import { addEventListener, addEventsListener } from '../module/event_listener';
import { createNewsTemplate } from '../module/news';
import { type RouteInfo, RouteInfoKey, type RouteList } from '../module/type/RouteList';
import * as commonStyles from '../../css/common.module.scss';
import * as styles from '../../css/news.module.scss';
import { body } from '../module/dom/body';
import { cnRoutesPageTitle } from '../module/text/page_title';
import { NEWS_ROOT_URI } from '../module/env/uri';
import { addManualMultiLanguageClass } from '../module/dom/create_element/multi_language';
import { redirect } from '../module/global';
import { newXHR } from '../module/xhr';
import { TOP_DOMAIN } from '../module/env/domain';
import { horizontalCenter } from '../module/style/horizontal_center';
import { buildURI, buildURLForm } from '../module/http_form';
import { EN_LANG_CODE, ZH_HANS_LANG_CODE, ZH_HANT_LANG_CODE } from '../module/lang';
import { disableButton } from '../module/dom/change_input';
import { round } from '../module/math';
import { getHighResTimestamp } from '../module/hi_res_timestamp';

const DEFAULT_ROUTE_NAME = 'CloudFront';
const enum RouteInfoNodeKey {
    INFO,
    LATENCY,
    RESULT_OVERRIDE,
    IN_USE,
    NEXT,
}
interface RouteInfoNode {
    readonly [RouteInfoNodeKey.INFO]: RouteInfo | null;
    [RouteInfoNodeKey.LATENCY]: number | null | false;
    [RouteInfoNodeKey.RESULT_OVERRIDE]: string | null;
    readonly [RouteInfoNodeKey.IN_USE]: boolean;
    [RouteInfoNodeKey.NEXT]: RouteInfoNode | null;
}

export default function (routeList: RouteList) {
    const [outerContainer, innerContainer] = createNewsTemplate(cnRoutesPageTitle, null, null);
    const contentContainer = createDivElement();
    addClass(contentContainer, styles.content);
    addManualMultiLanguageClass(contentContainer);
    appendChild(innerContainer, contentContainer);
    appendChild(body, outerContainer);
    appendPromptText(contentContainer);

    const routeListContainer = createDivElement();
    routeListContainer.style.textAlign = 'center';
    appendChild(contentContainer, routeListContainer);

    const retestButton = createButtonElement('再測定');
    appendChild(contentContainer, retestButton);
    horizontalCenter(retestButton);
    disableButton(retestButton, true);

    const codeToNameMap = new Map<string, string>();
    codeToNameMap.set('', DEFAULT_ROUTE_NAME);
    for (const routeInfo of routeList) {
        codeToNameMap.set(routeInfo[RouteInfoKey.CODE], routeInfo[RouteInfoKey.NAME]);
    }
    addEventListener(retestButton, 'click', () => {
        disableButton(retestButton, true);
        testNextRoute(codeToNameMap, routeListContainer, initializeList(routeList), retestButton);
    });
    testNextRoute(codeToNameMap, routeListContainer, initializeList(routeList), retestButton);

    appendChild(contentContainer, createHRElement());
    appendASNPromptText(contentContainer);
    const asnResultContainer = createParagraphElement();
    asnResultContainer.style.textAlign = 'center';
    appendChild(contentContainer, asnResultContainer);
    const asnRetestButton = createButtonElement('再測定');
    appendChild(contentContainer, asnRetestButton);
    horizontalCenter(asnRetestButton);
    getASN(asnResultContainer, asnRetestButton);
    addEventListener(asnRetestButton, 'click', () => {
        getASN(asnResultContainer, asnRetestButton);
    });
}

function initializeList(routeList: RouteList) {
    const currentLocationPrefix = getLocationPrefix();
    const head = {
        [RouteInfoNodeKey.INFO]: null,
        [RouteInfoNodeKey.LATENCY]: null,
        [RouteInfoNodeKey.RESULT_OVERRIDE]: null,
        [RouteInfoNodeKey.IN_USE]: currentLocationPrefix === locationCodeToPrefix(''),
        [RouteInfoNodeKey.NEXT]: null,
    };
    let current: RouteInfoNode = head;
    for (const routeInfo of routeList) {
        const next = {
            [RouteInfoNodeKey.INFO]: routeInfo,
            [RouteInfoNodeKey.LATENCY]: null,
            [RouteInfoNodeKey.RESULT_OVERRIDE]: null,
            [RouteInfoNodeKey.IN_USE]: currentLocationPrefix === locationCodeToPrefix(routeInfo[RouteInfoKey.CODE]),
            [RouteInfoNodeKey.NEXT]: null,
        };
        current[RouteInfoNodeKey.NEXT] = next;
        current = next;
    }
    return head;
}

function testNextRoute(codeToNameMap: Map<string, string>, container: HTMLDivElement, head: RouteInfoNode, retestButton: HTMLButtonElement) {
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
            appendText(spanElem, DEFAULT_ROUTE_NAME);
        }
        appendText(spanElem, '：');
        let result: string;
        if (current[RouteInfoNodeKey.LATENCY] === null) {
            result = '測定中…';
        } else if (current[RouteInfoNodeKey.LATENCY] === false) {
            result = '測定失敗';
        } else if (current[RouteInfoNodeKey.LATENCY] === -1) {
            result = '速度をテストする前にログインしてください';
        } else {
            result = current[RouteInfoNodeKey.LATENCY] + 'ms';
        }
        if (current[RouteInfoNodeKey.RESULT_OVERRIDE] !== null) {
            result = current[RouteInfoNodeKey.RESULT_OVERRIDE];
        }
        appendText(spanElem, result);
        if (current[RouteInfoNodeKey.IN_USE]) {
            appendText(spanElem, '（現在使用中）');
        } else if (current[RouteInfoNodeKey.LATENCY] !== null && current[RouteInfoNodeKey.LATENCY] !== false) {
            addClass(spanElem, commonStyles.link);
            addEventListener(spanElem, 'click', () => {
                const baseHost = getBaseHost(); // Use host just in case there is a port number.
                const locationCode = routeInfo !== null ? routeInfo[RouteInfoKey.CODE] : '';
                windowLocation.href = getProtocol() + '//' + concatenateLocationPrefix(locationCodeToPrefix(locationCode), baseHost);
            });
        }
        previous = current;
        current = current[RouteInfoNodeKey.NEXT];
    }

    const testRouteNodeConst = testRouteNode;
    if (testRouteNodeConst === null) {
        disableButton(retestButton, false);
        return;
    }

    const routeInfo = testRouteNodeConst[RouteInfoNodeKey.INFO];
    const locationPrefix = locationCodeToPrefix(routeInfo !== null ? routeInfo[RouteInfoKey.CODE] : '');
    const sortResult = (latency: number | false) => {
        if (testRouteNodePrevious !== null) { // Add the node back to the linked list, in sorted order.
            testRouteNodePrevious[RouteInfoNodeKey.NEXT] = testRouteNodeConst[RouteInfoNodeKey.NEXT];
            let previous: RouteInfoNode | null = null;
            let current: RouteInfoNode | null = head;
            while (
                current !== null
                && current[RouteInfoNodeKey.LATENCY] !== null
                && current[RouteInfoNodeKey.LATENCY] !== false
                && (latency === false || current[RouteInfoNodeKey.LATENCY] < latency)
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
        testNextRoute(codeToNameMap, container, head, retestButton);
    };
    const onUnauthorizedCallback = () => {
        let current: RouteInfoNode | null = head;
        while (current !== null) {
            if (current[RouteInfoNodeKey.LATENCY] === null) {
                current[RouteInfoNodeKey.LATENCY] = -1;
            }
            current = current[RouteInfoNodeKey.NEXT];
        }
        testNextRoute(codeToNameMap, container, head, retestButton);
    };
    testRoute(0, locationPrefix, (routeCode: string) => { // The first request is to cache DNS to avoid the impact of DNS caching on the latency test.
        if (routeInfo !== null && routeInfo[RouteInfoKey.TYPE] === 'alias') {
            const routeName = codeToNameMap.get(routeCode);
            if (routeName === undefined) {
                onErrorCallback();
                return;
            }
            testRouteNodeConst[RouteInfoNodeKey.RESULT_OVERRIDE] = routeName;
            testRouteNodeConst[RouteInfoNodeKey.LATENCY] = Number.POSITIVE_INFINITY;
            sortResult(testRouteNodeConst[RouteInfoNodeKey.LATENCY]);
            testNextRoute(codeToNameMap, container, head, retestButton);
        } else {
            if (!checkRouteCode(routeCode, routeInfo)) {
                onErrorCallback();
                return;
            }
            const start = getHighResTimestamp();
            testRoute(512 * 1024, locationPrefix, () => {
                const latency = round(getHighResTimestamp() - start);
                if (!checkRouteCode(routeCode, routeInfo)) {
                    onErrorCallback();
                    return;
                }
                testRouteNodeConst[RouteInfoNodeKey.LATENCY] = latency;
                sortResult(latency);
                testNextRoute(codeToNameMap, container, head, retestButton);
            }, onErrorCallback, onUnauthorizedCallback);
        }
    }, onErrorCallback, onUnauthorizedCallback);
}

function testRoute(size: number, locationPrefix: string, callback: (routeCode: string) => void, onErrorCallback: () => void, onUnauthorizedCallback: () => void) {
    const xhr = newXHR(
        getServerOrigin(locationPrefix) + '/test_download',
        'POST',
        true,
        () => {
            if (xhr.status === 200) {
                const viaHeader = xhr.getResponseHeader('Via');
                if (viaHeader === null) {
                    // There must be at least one Via header that is sent by CloudFront.
                    onErrorCallback();
                    return;
                }
                let routeCode = null;
                const viaHeaderList = viaHeader.split(',');
                for (const viaHeaderValue of viaHeaderList) {
                    const viaHeaderValueList = viaHeaderValue.trim().split(' ');
                    const proxyCode = viaHeaderValueList[1];
                    if (proxyCode === undefined) {
                        // This is not a valid Via header, ignore it.
                        continue;
                    }
                    const proxyProvider = viaHeaderValueList[2];
                    if (proxyProvider === '(' + DEFAULT_ROUTE_NAME + ')') {
                        routeCode = '';
                    } else if (proxyProvider === '(' + TOP_DOMAIN + ')') {
                        routeCode = proxyCode;
                    }
                }
                if (routeCode === null) {
                    onErrorCallback();
                    return;
                }
                callback(routeCode);
            } else if (xhr.status === 403 && xhr.responseText === 'UNAUTHORIZED') {
                onUnauthorizedCallback();
            } else {
                onErrorCallback();
            }
        },
    );
    xhr.timeout = 15000;
    addEventsListener(xhr, ['error', 'timeout'], onErrorCallback);
    xhr.send(buildURLForm({ size: size }));
}

function checkRouteCode(routeCode: string, routeInfo: RouteInfo | null) {
    if (routeInfo === null) {
        return routeCode === '';
    }
    return routeCode === routeInfo[RouteInfoKey.CODE];
}

function getASN(asnResultContainer: HTMLElement, asnRetestButton: HTMLButtonElement) {
    replaceText(asnResultContainer, 'ASNを取得中…');
    disableButton(asnRetestButton, true);
    const failedCallback = () => {
        replaceText(asnResultContainer, 'ASNの取得に失敗しました');
        disableButton(asnRetestButton, false);
    };
    const xhr = newXHR(
        getServerOrigin('') + '/get_asn',
        'GET',
        false,
        () => {
            if (xhr.status !== 200) {
                failedCallback();
                return;
            }
            const asn = xhr.responseText;
            if (asn === '0') {
                failedCallback();
                return;
            }
            const resultSpan = createSpanElement();
            replaceText(resultSpan, 'AS' + asn);
            addClass(resultSpan, commonStyles.link);
            addEventListener(resultSpan, 'click', () => {
                w.open('https://bgp.he.net/AS' + asn);
            });
            replaceChildren(asnResultContainer, resultSpan);
            disableButton(asnRetestButton, false);
        },
    );
    addEventListener(xhr, 'error', failedCallback);
    xhr.send();
}

function appendPromptText(contentContainer: HTMLElement) {
    const NEWS_URI = NEWS_ROOT_URI + '2ghJ5dHKW8T';

    const promptParagraphJa = createParagraphElement('以下は、中国のユーザーのために用意した回線です（詳細は');
    const linkJa = createSpanElement();
    addClass(linkJa, commonStyles.link);
    appendText(linkJa, 'こちら');
    addEventListener(linkJa, 'click', () => {
        redirect(NEWS_URI);
    });
    appendChild(promptParagraphJa, linkJa);
    appendText(promptParagraphJa, '）。測定が完了したら、回線を切り替えることができます。512kBのファイルをダウンロードするのにかかる時間を計測しています。時間が短いほど良いです。2000ミリ秒以上かかる場合は、回線がお使いのISPに最適化されていない、または回線が混雑している可能性があります。1000ミリ秒前後かそれ以下であれば、大きな差はないので安心して利用できます。');

    const promptParagraphEn = createParagraphElement(
        'Below are the routes we have prepared for users in China (see details ',
    );
    promptParagraphEn.lang = EN_LANG_CODE;
    const linkEn = createSpanElement();
    addClass(linkEn, commonStyles.link);
    appendText(linkEn, 'here');
    addEventListener(linkEn, 'click', () => {
        redirect(buildURI(NEWS_URI, '', EN_LANG_CODE));
    });
    appendChild(promptParagraphEn, linkEn);
    appendText(promptParagraphEn, '). Once the measurement is complete, you can to switch between the routes. We are measuring the time it takes to download a 512kB file. The shorter the time, the better. If it takes more than 2000ms, the route may not be optimized for your ISP or the route may be congested. If it is around 1000 milliseconds or less, there is no significant difference and you can use it without worry.');

    const promptParagraphHant = createParagraphElement(
        '以下是我們為中國用戶準備的線路（點擊',
    );
    promptParagraphHant.lang = ZH_HANT_LANG_CODE;
    const linkHant = createSpanElement();
    addClass(linkHant, commonStyles.link);
    appendText(linkHant, '此處');
    addEventListener(linkHant, 'click', () => {
        redirect(buildURI(NEWS_URI, '', ZH_HANT_LANG_CODE));
    });
    appendChild(promptParagraphHant, linkHant);
    appendText(promptParagraphHant, '了解詳情）。測量完成後即可切換線路。我們測量下載一個512kB文件所需的時間。時間越短越好。如果超過2000毫秒，則此線路可能沒有針對您的ISP進行最佳化，或者此線路擁擠。如果在1000毫秒左右或者更短的話，則區別不大，可放心使用。');

    const promptParagraphHans = createParagraphElement(
        '以下是我们为中国用户准备的线路（点击',
    );
    promptParagraphHans.lang = ZH_HANS_LANG_CODE;
    const linkHans = createSpanElement();
    addClass(linkHans, commonStyles.link);
    appendText(linkHans, '此处');
    addEventListener(linkHans, 'click', () => {
        redirect(buildURI(NEWS_URI, '', ZH_HANS_LANG_CODE));
    });
    appendChild(promptParagraphHans, linkHans);
    appendText(promptParagraphHans, '了解详情）。测量完成后即可切换线路。我们测量下载一个512kB文件所需的时间。时间越短越好。如果超过2000毫秒，则此线路可能没有针对您的ISP进行优化，或者此线路拥挤。如果在1000毫秒左右或者更短的话，则区别不大，可放心使用。');

    appendChild(contentContainer, promptParagraphJa);
    appendChild(contentContainer, promptParagraphEn);
    appendChild(contentContainer, promptParagraphHant);
    appendChild(contentContainer, promptParagraphHans);
    appendChild(contentContainer, createHRElement());
}

function appendASNPromptText(contentContainer: HTMLElement) {
    const promptParagraphJa = createParagraphElement('以下では、あなたのASN（自律システム番号）を取得します。この番号を使って、現在利用しているISPを確認することができます。例えば、AS4134は中国電信、AS9808は中国移動、AS4837は中国聯通です。1つのISPが複数のASNを所有することもありますのでご注意ください。');
    const promptParagraphEn = createParagraphElement('Below you will get your ASN (Autonomous System Number). You can use this number to find out which ISP you are currently using. For example, AS4134 is China Telecom, AS9808 is China Mobile, and AS4837 is China Unicom. Please note that one ISP may own multiple ASNs.');
    promptParagraphEn.lang = EN_LANG_CODE;
    const promptParagraphHant = createParagraphElement('您可以在下面獲得您的ASN（自治系統編號）。您可以使用此號碼來查詢您當前正在使用的ISP。例如AS4134是中國電信，AS9808是中國移動，AS4837是中國聯通。請注意，一個ISP可能擁有多個ASN。');
    promptParagraphHant.lang = ZH_HANT_LANG_CODE;
    const promptParagraphHans = createParagraphElement('您可以在下面获得您的ASN（自治系统编号）。您可以使用此号码来查询您当前正在使用的ISP。例如AS4134是中国电信，AS9808是中国移动，AS4837是中国联通。请注意，一个ISP可能拥有多个ASN。');
    promptParagraphHans.lang = ZH_HANS_LANG_CODE;
    appendChild(contentContainer, promptParagraphJa);
    appendChild(contentContainer, promptParagraphEn);
    appendChild(contentContainer, promptParagraphHant);
    appendChild(contentContainer, promptParagraphHans);
    appendChild(contentContainer, createHRElement());
}
