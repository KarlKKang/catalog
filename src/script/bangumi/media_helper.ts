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
} from '../module/DOM';
import { show as showMessage } from '../module/message';
import { invalidResponse } from '../module/message/template/param/server';
import { defaultError } from '../module/message/template/title';
import { defaultErrorSuffix } from '../module/message/template/body';
import { createMessageElem, getContentBoxHeight, getFormatIndex, getLogoutParam } from './helper';
import { IS_IOS, IS_MACOS, IS_WINDOWS } from '../module/browser';

export const incompatibleTitle = '再生できません';
export const incompatibleSuffix = '他のブラウザをご利用いただくか、パソコンでファイルをダウンロードして再生してください。';

export function showPlaybackError(detail?: string) {
    showErrorMessage(defaultError, '再生中にエラーが発生しました。' + defaultErrorSuffix + (detail === undefined ? '' : ('<br>Error detail: ' + detail)));
}

export function showHLSCompatibilityError() {
    showErrorMessage(incompatibleTitle, 'お使いのブラウザは、再生に最低限必要なMedia Source Extensions（MSE）およびHTTP Live Streaming（HLS）に対応していません。' + incompatibleSuffix);
}

export function showCodecCompatibilityError() {
    showErrorMessage(incompatibleTitle, 'お使いのブラウザは、再生に必要なコーデックに対応していません。' + incompatibleSuffix);
}

export function showPlayPromiseError() {
    showErrorMessage(incompatibleTitle, 'ブラウザによって再生が中断されました。再読み込みするか、他のブラウザを使用してみてください。');
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

export function getDownloadAccordion(token: string, seriesID: string, epIndex: number): HTMLElement {

    const accordion = createElement('button');
    addClass(accordion, 'accordion');
    accordion.innerHTML = 'DOWNLOAD';

    const accordionPanel = createElement('div');
    addClass(accordionPanel, 'panel');

    accordionPanel.innerHTML = '<ul>' +
        '<li>下の「ダウンロード」ボタンをクリックすると、必要なツールやスクリプトが入ったZIPファイルのダウンロードが開始されます。</li>' +
        '<li>ZIPファイルをダウンロードした後、解凍してREADME.txtに記載されている手順で行ってください。</li>' +
        '<li>ZIPファイル内のスクリプトの有効期限は、ダウンロード後5分です。有効期限内にスクリプトを実行してください。</li>' +
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
    downloadButton.id = 'download-button';
    addClass(downloadButton, 'button');
    downloadButton.innerHTML = 'ダウンロード';

    const iframe = createElement('iframe') as HTMLIFrameElement;
    iframe.id = 'download-iframe';
    iframe.height = '0';
    iframe.width = '0';

    addEventListener(downloadButton, 'click', function () {
        downloadButton.disabled = true;
        sendServerRequest('start_download.php', {
            callback: function (response: string) {
                if (response.startsWith(CDN_URL)) {
                    iframe.src = response;
                    downloadButton.disabled = false;
                } else {
                    showMessage(invalidResponse);
                }
            },
            content: 'token=' + token + '&format=' + getFormatIndex() + '&os=' + selectMenu.value,
            logoutParam: getLogoutParam(seriesID, epIndex)
        });
    });
    appendChild(accordionPanel, downloadButton);

    const downloadElem = createElement('div');
    addClass(downloadElem, 'download');
    appendChild(downloadElem, accordion);
    appendChild(downloadElem, accordionPanel);
    appendChild(downloadElem, iframe);
    addAccordionEvent(accordion);
    return downloadElem;
}

export function addAccordionEvent(acc: HTMLElement): void {
    addEventListener(acc, 'click', function () {
        toggleClass(acc, 'active');
        const panel = acc.nextElementSibling;
        if (panel === null) {
            return;
        }
        const panelCast = panel as HTMLElement;
        if (panelCast.style.maxHeight !== '') {
            panelCast.style.maxHeight = '';
            panelCast.style.padding = '0px 1em';
        } else {
            panelCast.style.maxHeight = getContentBoxHeight(panelCast) + 'px';
            panelCast.style.padding = '1em';
        }
    });
}