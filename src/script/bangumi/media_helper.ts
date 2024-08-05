import { ServerRequestOptionProp, sendServerRequest } from '../module/server';
import { appendListItems, appendText, createButtonElement, createDivElement, createElement, createHRElement, createOptionElement, createSelectElement, createTextNode, createUListElement, replaceText } from '../module/dom/create_element';
import { addClass, appendChild, getDescendantsByClassAt, insertBefore, prependChild, replaceChildren } from '../module/dom/element';
import { getHostname, parseOrigin, parseURI, w } from '../module/dom/document';
import { addEventListener } from '../module/event_listener';
import { showMessage } from '../module/message';
import { invalidResponse } from '../module/server/message';
import { createMessageElem, getContentBoxHeight, getLogoutParam, isArray } from './helper';
import { IS_IOS, IS_MACOS, IS_WINDOWS } from '../module/browser';
import { VideoFormat, VideoFormatKey, VideoFormats } from '../module/type/BangumiInfo';
import { addTimeout } from '../module/timer';
import { CustomMediaError } from '../module/player/media_error';
import { SharedElement, errorMessageElement, getSharedElement, setErrorMessageElement } from './shared_var';
import { hideElement, horizontalCenter, setMaxHeight } from '../module/style';
import { CSS_COLOR, CSS_UNIT } from '../module/style/value';
import { defaultError } from '../module/text/message/title';
import { defaultErrorSuffix } from '../module/text/message/body';
import * as styles from '../../css/bangumi.module.scss';
import { getCDNOrigin } from '../module/env/origin';
import { buildURLForm, joinURLForms } from '../module/http_form';

export const incompatibleTitle = '再生できません';
export const incompatibleSuffix = '他のブラウザをご利用いただくか、パソコンでファイルをダウンロードして再生してください。';

function showNetworkError() {
    showErrorMessage(defaultError, 'ネットワークエラーが発生しました。インターネット接続環境をご確認の上、再度お試しください。または、' + getHostname() + 'の他のタブでの操作が、現在のタブに干渉している可能性があります。この場合、ページを再読み込みしてみてください。');
}

function showUnknownPlaybackError() {
    showErrorMessage(defaultError, '再生中に不明なエラーが発生しました。' + defaultErrorSuffix);
}

function showDecodeError() {
    showErrorMessage(defaultError, 'お使いのブラウザは、このデータ形式をデコードすることができません。コーデックに対応していない、またはデコードのためのメモリが不足している可能性があります。' + incompatibleSuffix);
}

export function showHLSCompatibilityError() {
    showErrorMessage(incompatibleTitle, 'お使いのブラウザは、再生に最低限必要なMedia Source Extensions（MSE）およびHTTP Live Streaming（HLS）に対応していません。' + incompatibleSuffix);
}

export function showCodecCompatibilityError() {
    showErrorMessage(incompatibleTitle, 'お使いのブラウザは、再生に必要なコーデックに対応していません。' + incompatibleSuffix);
}

function showPlayPromiseError() {
    showErrorMessage(incompatibleTitle, 'ブラウザによって再生が中断されました。ページを再読み込みしてみてください。このエラーが続く場合は、他のブラウザでお試しください。');
}

export function showPlayerError(errorCode: number | null) {
    if (errorCode === CustomMediaError.MEDIA_ERR_ABORTED) {
        showPlayPromiseError();
    } else if (errorCode === CustomMediaError.MEDIA_ERR_NETWORK || errorCode === CustomMediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
        showNetworkError();
    } else if (errorCode === CustomMediaError.MEDIA_ERR_DECODE || errorCode === CustomMediaError.HLS_BUFFER_APPEND_ERROR) {
        showDecodeError();
    } else {
        showUnknownPlaybackError();
    }
}

export function showErrorMessage(title: string, body: Node[] | string) {
    const mediaHolder = getSharedElement(SharedElement.MEDIA_HOLDER);
    let messageElem = errorMessageElement;
    if (messageElem === null) {
        messageElem = createMessageElem(title, body, CSS_COLOR.RED);
        setErrorMessageElement(messageElem);
        insertBefore(messageElem, mediaHolder);
    } else {
        const titleElem = getDescendantsByClassAt(messageElem, styles.messageTitle, 0);
        const bodyElem = getDescendantsByClassAt(messageElem, styles.messageBody, 0);
        titleElem.innerHTML = title;
        isArray(body) ? replaceChildren(bodyElem, ...body) : replaceChildren(bodyElem, createTextNode(body));
    }
    hideElement(mediaHolder);
}

export function showMediaMessage(title: string, body: Node[] | string, titleColor: CSS_COLOR | null) {
    const messageElem = createMessageElem(title, body, titleColor);
    prependChild(getSharedElement(SharedElement.MEDIA_HOLDER), messageElem);
}

export function buildDownloadAccordion(
    mediaSessionCredential: string,
    seriesID: string,
    epIndex: number,
    videoFormats: null | [
        HTMLSelectElement,
        VideoFormats,
        VideoFormat,
    ],
): [HTMLDivElement, HTMLDivElement] {
    const [accordion, accordionPanel] = buildAccordion('ダウンロード', true);

    const accordionPanelContent = createUListElement();
    appendListItems(
        accordionPanelContent,
        '下の「ダウンロード」ボタンをクリックすると、必要なスクリプトが入ったZIPファイルがダウンロードできます。',
        'ZIPファイルをダウンロードした後、解凍してREADME.txtに記載されている手順で行ってください。',
        'スクリプトを実行するには、Windows、macOS、またはLinuxを搭載したパソコンが必要です。',
        'インターネット接続が良好であることをご確認してください。',
    );
    appendChild(accordionPanel, accordionPanelContent);

    const downloadOptionsContainer = createDivElement();
    addClass(downloadOptionsContainer, styles.downloadOptions);

    const osSelector = createDivElement();
    addClass(osSelector, styles.select);
    const osSelectMenu = createSelectElement();
    const osOptionWindows = createOptionElement();
    const osOptionMac = createOptionElement();
    const osOptionLinux = createOptionElement();
    osOptionWindows.value = '1';
    osOptionMac.value = '2';
    osOptionLinux.value = '0';
    appendText(osOptionWindows, 'Windows');
    appendText(osOptionMac, 'macOS');
    appendText(osOptionLinux, 'Linux');
    if (IS_WINDOWS) {
        osOptionWindows.selected = true;
    } else if (IS_MACOS || IS_IOS) {
        osOptionMac.selected = true;
    } else {
        osOptionLinux.selected = true;
    }
    appendChild(osSelectMenu, osOptionWindows);
    appendChild(osSelectMenu, osOptionMac);
    appendChild(osSelectMenu, osOptionLinux);
    appendChild(osSelector, osSelectMenu);
    appendChild(downloadOptionsContainer, osSelector);

    const containerSelector = createDivElement();
    addClass(containerSelector, styles.select);
    const containerSelectMenu = createSelectElement();
    const containerOptionTS = createOptionElement();
    const containerOptionMKV = createOptionElement();
    const containerOptionMP4 = createOptionElement();
    containerOptionTS.value = '0';
    containerOptionMKV.value = '1';
    containerOptionMP4.value = '2';
    appendText(containerOptionTS, 'MPEG Transport Stream (.ts)');
    appendText(containerOptionMKV, 'Matroska (.mkv)');
    appendText(containerOptionMP4, 'MPEG-4 Part 14 (.mp4)');
    containerOptionMKV.selected = true;
    appendChild(containerSelectMenu, containerOptionTS);
    appendChild(containerSelectMenu, containerOptionMKV);
    appendChild(containerSelectMenu, containerOptionMP4);
    appendChild(containerSelector, containerSelectMenu);
    appendChild(downloadOptionsContainer, containerSelector);
    if (videoFormats === null || videoFormats[2][VideoFormatKey.DIRECT_DOWNLOAD]) {
        hideElement(containerSelector);
    }

    appendChild(accordionPanel, downloadOptionsContainer);

    const downloadButton = createButtonElement('ダウンロード');
    horizontalCenter(downloadButton);

    const iframe = createElement('iframe') as HTMLIFrameElement;
    hideElement(iframe);
    iframe.height = '0';
    iframe.width = '0';

    addEventListener(downloadButton, 'click', () => {
        downloadButton.disabled = true;
        let requestContent = joinURLForms(mediaSessionCredential, buildURLForm({ os: osSelectMenu.value }));
        if (videoFormats !== null) {
            const formatIndex = videoFormats[0].selectedIndex;
            const format = videoFormats[1][formatIndex];
            if (format === undefined) {
                return;
            }
            requestContent = joinURLForms(
                requestContent,
                buildURLForm({
                    format: formatIndex,
                    ...format[VideoFormatKey.DIRECT_DOWNLOAD] !== true && { container: containerSelectMenu.value },
                }),
            );
        }
        sendServerRequest('start_download', {
            [ServerRequestOptionProp.CALLBACK]: function (response: string) {
                const downloadURI = parseURI(response);
                if (parseOrigin(response) === getCDNOrigin() && downloadURI?.startsWith('/download/')) {
                    iframe.src = response;
                    downloadButton.disabled = false;
                } else {
                    showMessage(invalidResponse());
                }
            },
            [ServerRequestOptionProp.CONTENT]: requestContent,
            [ServerRequestOptionProp.LOGOUT_PARAM]: getLogoutParam(seriesID, epIndex),
            [ServerRequestOptionProp.SHOW_SESSION_ENDED_MESSAGE]: true,
        });
    });
    appendChild(accordionPanel, downloadButton);

    const downloadElem = createDivElement();
    addClass(downloadElem, styles.download);
    appendChild(downloadElem, accordion);
    appendChild(downloadElem, accordionPanel);
    appendChild(downloadElem, iframe);
    return [downloadElem, containerSelector];
}

export type AccordionInstance = [HTMLDivElement, HTMLDivElement, boolean];

export function buildAccordion(title: string, active: boolean) {
    const accordion = createDivElement();
    addClass(accordion, styles.accordion);

    const titleElem = createDivElement();
    addClass(titleElem, styles.accordionTitle);
    appendText(titleElem, title);
    appendChild(accordion, titleElem);

    const iconElem = createDivElement();
    addClass(iconElem, styles.accordionIcon);
    appendChild(accordion, iconElem);

    const accordionPanel = createDivElement();
    addClass(accordionPanel, styles.accordionPanel);
    const hr = createHRElement();
    addClass(hr, styles.hr);
    appendChild(accordionPanel, hr);
    const instance: AccordionInstance = [accordion, accordionPanel, active];
    addAccordionEvent(instance, iconElem);
    return instance;
}

export function addAccordionEvent(instance: AccordionInstance, icon: HTMLElement | null): void {
    const [acc, panel] = instance;

    const hidePanel = () => {
        setMaxHeight(panel, 0, CSS_UNIT.PX);
    };

    const changeIcon = () => {
        if (icon !== null) {
            replaceText(icon, instance[2] ? '-' : '+');
        }
    };

    if (!instance[2]) {
        hidePanel();
    }
    changeIcon();

    let currentTimeout: NodeJS.Timeout | null = null;
    let currentAnimationFrame: number | null = null;
    addEventListener(acc, 'click', () => {
        instance[2] = !instance[2];
        changeIcon();
        if (instance[2]) {
            currentAnimationFrame = null;
            setMaxHeight(panel, getContentBoxHeight(panel), CSS_UNIT.PX);
            const timeout = addTimeout(() => {
                if (currentTimeout === timeout) {
                    setMaxHeight(panel, null);
                }
            }, 200);
            currentTimeout = timeout;
        } else {
            currentTimeout = null;
            let animationFrame = w.requestAnimationFrame(() => {
                if (currentAnimationFrame === animationFrame) {
                    setMaxHeight(panel, getContentBoxHeight(panel), CSS_UNIT.PX);
                    animationFrame = w.requestAnimationFrame(() => {
                        if (currentAnimationFrame === animationFrame) {
                            hidePanel();
                        }
                    });
                    currentAnimationFrame = animationFrame;
                }
            });
            currentAnimationFrame = animationFrame;
        }
    });
}
