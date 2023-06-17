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
import { createMessageElem, getContentBoxHeight, getFormatIndex, getLogoutParam } from './helper';
import { IS_IOS, IS_MACOS, IS_WINDOWS } from '../module/browser';
import { CustomMediaError } from '../module/player/media_error';

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

export function getDownloadAccordion(mediaSessionCredential: string, seriesID: string, epIndex: number): HTMLElement {

    const accordion = createElement('button');
    addClass(accordion, 'accordion');
    accordion.innerHTML = 'DOWNLOAD';

    const accordionPanel = createElement('div');
    addClass(accordionPanel, 'panel');

    accordionPanel.innerHTML = '<ul>' +
        '<li>下の「ダウンロード」ボタンをクリックすると、必要なツールやスクリプトが入ったZIPファイルのダウンロードが開始されます。</li>' +
        '<li>ZIPファイルをダウンロードした後、解凍してREADME.txtに記載されている手順で行ってください。</li>' +
        '<li>スクリプトの実行には、Windows 10、Mac OS X 10.9、Linux 3.2.0以上を搭載したパソコンが必要です。</li>' +
        '<li>インターネット接続が良好であることをご確認してください。</li>' +
        '</ul>';

    const osSelector = createElement('div');
    osSelector.id = 'os-selector';
    addClass(osSelector, 'select');
    const selectMenu = createElement('select') as HTMLSelectElement;
    const optionWindows = createElement('option') as HTMLOptionElement;
    const optionMac = createElement('option') as HTMLOptionElement;
    const optionLinux = createElement('option') as HTMLOptionElement;
    optionWindows.value = '1';
    optionMac.value = '2';
    optionLinux.value = '0';
    optionWindows.innerHTML = 'Windows 10 / 11';
    optionMac.innerHTML = 'Mac OS X 10.9 +';
    optionLinux.innerHTML = 'Linux 3.2.0 +';
    if (IS_WINDOWS) {
        optionWindows.selected = true;
    } else if (IS_MACOS || IS_IOS) {
        optionMac.selected = true;
    } else {
        optionLinux.selected = true;
    }
    appendChild(selectMenu, optionWindows);
    appendChild(selectMenu, optionMac);
    appendChild(selectMenu, optionLinux);
    appendChild(osSelector, selectMenu);
    appendChild(accordionPanel, osSelector);

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
        sendServerRequest('start_download.php', {
            callback: function (response: string) {
                if (getBaseURL(response).startsWith(CDN_URL + '/download/')) {
                    iframe.src = response;
                    downloadButton.disabled = false;
                } else {
                    showMessage(invalidResponse);
                }
            },
            content: mediaSessionCredential + '&format=' + getFormatIndex() + '&os=' + selectMenu.value,
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
    return downloadElem;
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