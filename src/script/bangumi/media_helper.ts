import {
    CDN_URL,
} from '../module/env/constant';
import {
    sendServerRequest,
} from '../module/main';
import {
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
} from '../module/dom';
import { show as showMessage } from '../module/message';
import { invalidResponse } from '../module/message/template/param/server';
import { defaultError } from '../module/message/template/title';
import { defaultErrorSuffix } from '../module/message/template/body';
import { createMessageElem, getContentBoxHeight, getLogoutParam } from './helper';
import { IS_IOS, IS_MACOS, IS_WINDOWS } from '../module/browser';
import { CustomMediaError } from '../module/player/media_error';
import { VideoFormatInfo } from '../module/type/BangumiInfo';

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
    mediaSessionCredential: string,
    seriesID: string,
    epIndex: number,
    videoFormats: null | {
        selectMenu: HTMLSelectElement;
        formats: VideoFormatInfo[];
        initialFormat: VideoFormatInfo;
    }
): [HTMLElement, HTMLElement] {
    const accordion = createElement('button');
    addClass(accordion, 'accordion');
    accordion.textContent = 'DOWNLOAD';

    const accordionPanel = createElement('div');
    addClass(accordionPanel, 'panel');

    const accordionPannelContent = createElement('ul') as HTMLUListElement;
    appendListItems(accordionPannelContent, [
        '下の「ダウンロード」ボタンをクリックすると、必要なツールやスクリプトが入ったZIPファイルのダウンロードが開始されます。',
        'ZIPファイルをダウンロードした後、解凍してREADME.txtに記載されている手順で行ってください。',
        'スクリプトを実行するには、Windows、macOS、またはLinuxを搭載したパソコンが必要です。',
        'インターネット接続が良好であることをご確認してください。',
    ]);
    appendChild(accordionPanel, accordionPannelContent);

    const downloadOptionsContainer = createElement('div');
    downloadOptionsContainer.id = 'download-options';

    const osSelector = createElement('div');
    addClass(osSelector, 'select');
    const osSelectMenu = createElement('select') as HTMLSelectElement;
    const osOptionWindows = createElement('option') as HTMLOptionElement;
    const osOptionMac = createElement('option') as HTMLOptionElement;
    const osOptionLinux = createElement('option') as HTMLOptionElement;
    osOptionWindows.value = '1';
    osOptionMac.value = '2';
    osOptionLinux.value = '0';
    osOptionWindows.textContent = 'Windows';
    osOptionMac.textContent = 'macOS';
    osOptionLinux.textContent = 'Linux';
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

    const containerSelector = createElement('div');
    addClass(containerSelector, 'select');
    const containerSelectMenu = createElement('select') as HTMLSelectElement;
    const containerOptionTS = createElement('option') as HTMLOptionElement;
    const containerOptionMKV = createElement('option') as HTMLOptionElement;
    const containerOptionMP4 = createElement('option') as HTMLOptionElement;
    containerOptionTS.value = '0';
    containerOptionMKV.value = '1';
    containerOptionMP4.value = '2';
    containerOptionTS.textContent = 'MPEG Transport Stream (.ts)';
    containerOptionMKV.textContent = 'Matroska (.mkv)';
    containerOptionMP4.textContent = 'MPEG-4 Part 14 (.mp4)';
    containerOptionTS.selected = true;
    appendChild(containerSelectMenu, containerOptionTS);
    appendChild(containerSelectMenu, containerOptionMKV);
    appendChild(containerSelectMenu, containerOptionMP4);
    appendChild(containerSelector, containerSelectMenu);
    appendChild(downloadOptionsContainer, containerSelector);
    if (videoFormats === null || videoFormats.initialFormat.direct_download) {
        hideElement(containerSelector);
    }

    appendChild(accordionPanel, downloadOptionsContainer);

    const downloadButton = createElement('button') as HTMLButtonElement;
    addClass(downloadButton, 'download-button');
    addClass(downloadButton, 'button');
    downloadButton.innerHTML = 'ダウンロード';

    const iframe = createElement('iframe') as HTMLIFrameElement;
    hideElement(iframe);
    iframe.height = '0';
    iframe.width = '0';

    addEventListener(downloadButton, 'click', function () {
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
        sendServerRequest('start_download.php', {
            callback: function (response: string) {
                if (getBaseURL(response).startsWith(CDN_URL + '/download/')) {
                    iframe.src = response;
                    downloadButton.disabled = false;
                } else {
                    showMessage(invalidResponse);
                }
            },
            content: requestContent,
            logoutParam: getLogoutParam(seriesID, epIndex)
        });
    });
    appendChild(accordionPanel, downloadButton);

    const downloadElem = createElement('div');
    addClass(downloadElem, 'download');
    appendChild(downloadElem, accordion);
    appendChild(downloadElem, accordionPanel);
    appendChild(downloadElem, iframe);
    addAccordionEvent(accordion, accordionPanel);
    return [downloadElem, containerSelector];
}

function appendListItems(list: HTMLUListElement, contents: string[]): void {
    for (const content of contents) {
        const item = createElement('li');
        item.textContent = content;
        appendChild(list, item);
    }
}

export function addAccordionEvent(acc: HTMLElement, panel: HTMLElement): void {
    const hidePanel = function () {
        panel.style.maxHeight = '0px';
        panel.style.padding = '0px 1em';
    };
    hidePanel();
    addEventListener(acc, 'click', function () {
        toggleClass(acc, 'active');
        if (containsClass(acc, 'active')) {
            panel.style.maxHeight = getContentBoxHeight(panel) + 'px';
            panel.style.padding = '1em';
        } else {
            hidePanel();
        }
    });
}