import {
    CDN_URL,
} from '../module/env/constant';
import {
    sendServerRequest,
} from '../module/common';
import {
    w,
    addEventListener,
    getById,
    createElement,
    addClass,
    toggleClass,
    appendChild,
    insertBefore,
    prependChild,
    getByIdNative,
    getDescendantsByClassAt,
    hideElement,
    getBaseURL,
    containsClass,
    createButtonElement,
    createDivElement,
    createSelectElement,
    createOptionElement,
    createHRElement,
    createUListElement,
    appendText,
    appendListItems,
} from '../module/dom';
import { show as showMessage } from '../module/message';
import { invalidResponse } from '../module/message/template/param/server';
import { defaultError } from '../module/message/template/title';
import { defaultErrorSuffix } from '../module/message/template/body';
import { createMessageElem, getContentBoxHeight, getLogoutParam } from './helper';
import { IS_IOS, IS_MACOS, IS_WINDOWS } from '../module/browser';
import { VideoFormatInfo } from '../module/type/BangumiInfo';
import { addTimeout } from '../module/timer';
import type { RedirectFunc } from '../module/type/RedirectFunc';

export const incompatibleTitle = '再生できません';
export const incompatibleSuffix = '他のブラウザをご利用いただくか、パソコンでファイルをダウンロードして再生してください。';

function showNetworkError() {
    showErrorMessage(defaultError, 'ネットワークエラーが発生しました。インターネット接続環境をご確認の上、再度お試しください。');
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
    } else if (errorCode === CustomMediaError.MEDIA_ERR_NETWORK) {
        showNetworkError();
    } else if (errorCode === CustomMediaError.MEDIA_ERR_DECODE || errorCode === CustomMediaError.HLS_BUFFER_APPEND_ERROR) {
        showDecodeError();
    } else if (errorCode === CustomMediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
        showCodecCompatibilityError();
    } else {
        showUnknownPlaybackError();
    }
}

export function showErrorMessage(title: string, body: string) {
    let messageElem = getByIdNative('error');
    const mediaHolder = getById('media-holder');
    if (messageElem === null) {
        messageElem = createMessageElem(title, body, 'red');
        messageElem.id = 'error';
        insertBefore(messageElem, mediaHolder);
    } else {
        const titleElem = getDescendantsByClassAt(messageElem, 'message-title', 0);
        const bodyElem = getDescendantsByClassAt(messageElem, 'message-body', 0);
        titleElem.innerHTML = title;
        bodyElem.innerHTML = body;
    }
    hideElement(mediaHolder);
}

export function showMediaMessage(title: string, body: string, titleColor: string | null) {
    const messageElem = createMessageElem(title, body, titleColor);
    prependChild(getById('media-holder'), messageElem);
}

export function buildDownloadAccordion(
    redirect: RedirectFunc,
    mediaSessionCredential: string,
    seriesID: string,
    epIndex: number,
    videoFormats: null | {
        selectMenu: HTMLSelectElement;
        formats: VideoFormatInfo[];
        initialFormat: VideoFormatInfo;
    }
): [HTMLDivElement, HTMLDivElement] {
    const accordion = createButtonElement();
    addClass(accordion, 'accordion');
    appendText(accordion, 'ダウンロード');

    const accordionPanel = createDivElement();
    addClass(accordionPanel, 'panel');
    appendChild(accordionPanel, createHRElement());

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
    downloadOptionsContainer.id = 'download-options';

    const osSelector = createDivElement();
    addClass(osSelector, 'select');
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
    addClass(containerSelector, 'select');
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
    if (videoFormats === null || videoFormats.initialFormat.direct_download) {
        hideElement(containerSelector);
    }

    appendChild(accordionPanel, downloadOptionsContainer);

    const downloadButton = createButtonElement();
    addClass(downloadButton, 'download-button');
    addClass(downloadButton, 'button');
    addClass(downloadButton, 'hcenter');
    appendText(downloadButton, 'ダウンロード');

    const iframe = createElement('iframe') as HTMLIFrameElement;
    hideElement(iframe);
    iframe.height = '0';
    iframe.width = '0';

    addEventListener(downloadButton, 'click', () => {
        downloadButton.disabled = true;
        let requestContent = mediaSessionCredential + '&os=' + osSelectMenu.value;
        if (videoFormats !== null) {
            const formatIndex = videoFormats.selectMenu.selectedIndex;
            requestContent += '&format=' + formatIndex;
            const format = videoFormats.formats[formatIndex];
            if (format === undefined) {
                return;
            }
            if (format.direct_download !== true) {
                requestContent += '&container=' + containerSelectMenu.value;
            }
        }
        sendServerRequest(redirect, 'start_download', {
            callback: function (response: string) {
                if (getBaseURL(response).startsWith(CDN_URL + '/download/')) {
                    iframe.src = response;
                    downloadButton.disabled = false;
                } else {
                    showMessage(redirect, invalidResponse());
                }
            },
            content: requestContent,
            logoutParam: getLogoutParam(seriesID, epIndex),
            showSessionEndedMessage: true,
        });
    });
    appendChild(accordionPanel, downloadButton);

    const downloadElem = createDivElement();
    addClass(downloadElem, 'download');
    appendChild(downloadElem, accordion);
    appendChild(downloadElem, accordionPanel);
    appendChild(downloadElem, iframe);
    addAccordionEvent(accordion, accordionPanel, true);
    return [downloadElem, containerSelector];
}

export function addAccordionEvent(acc: HTMLElement, panel: HTMLElement, active: boolean): void {
    const hidePanel = () => {
        panel.style.maxHeight = '0px';
    };

    if (active) {
        addClass(acc, 'active');
    } else {
        hidePanel();
    }

    let currentTimeout: NodeJS.Timeout | null = null;
    let currentAnimationFrame: number | null = null;
    addEventListener(acc, 'click', () => {
        toggleClass(acc, 'active');
        if (containsClass(acc, 'active')) {
            currentAnimationFrame = null;
            panel.style.maxHeight = getContentBoxHeight(panel) + 'px';
            const timeout = addTimeout(() => {
                if (currentTimeout === timeout) {
                    panel.style.removeProperty('max-height');
                }
            }, 200);
            currentTimeout = timeout;
        } else {
            currentTimeout = null;
            let animationFrame = w.requestAnimationFrame(() => {
                if (currentAnimationFrame === animationFrame) {
                    panel.style.maxHeight = getContentBoxHeight(panel) + 'px';
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