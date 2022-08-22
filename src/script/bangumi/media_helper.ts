import {
    SERVER_URL,
} from '../module/env/constant';
import {
    sendServerRequest,
    changeColor,
} from '../module/main';
import {
    addEventListener,
    getById,
    removeClass,
    createElement,
    addClass,
    toggleClass,
    appendChild,
} from '../module/DOM';
import { show as showMessage } from '../module/message';
import { invalidResponse } from '../module/message/template/param/server';
import { defaultError } from '../module/message/template/title';
import { defaultErrorSuffix } from '../module/message/template/body';
import { getContentBoxHeight, getFormatIndex, getLogoutParam } from './helper';

import type { VideojsModInstance } from '../module/player';


export const incompatibleTitle = '再生できません';
export const incompatibleSuffix = '他のブラウザをご利用いただくか、パソコンでファイルをダウンロードして再生してください。';

export function showPlaybackError(detail?: string) {
    showMediaMessage(defaultError, '<p>再生中にエラーが発生しました。' + defaultErrorSuffix + (detail === undefined ? '' : ('<br>Error detail: ' + detail)) + '</p>', 'red');
}

export function showHLSCompatibilityError() {
    showMediaMessage(incompatibleTitle, '<p>お使いのブラウザは、再生に最低限必要なMedia Source Extensions（MSE）およびHTTP Live Streaming（HLS）に対応していません。' + incompatibleSuffix + '</p>', 'red');
}

export function showCodecCompatibilityError(IS_LINUX: boolean) {
    showMediaMessage(incompatibleTitle, '<p>お使いのブラウザは、再生に必要なコーデックに対応していません。' + incompatibleSuffix + (IS_LINUX ? 'Linuxをお使いの方は、対応するメディアコーデックパッケージのインストールをお試しください。' : '') + '</p>', 'red');
}

export function showLegacyBrowserError() {
    showMediaMessage(incompatibleTitle, '<p>お使いのブラウザは古すぎるため、再生に対応していません。' + incompatibleSuffix + '</p>', 'red');
}

export function showMediaMessage(title: string, messageTxt: string, titleColor: string) {
    const messageTitle = getById('message-title');
    changeColor(messageTitle, titleColor);
    messageTitle.innerHTML = title;
    getById('message-body').innerHTML = messageTxt;
    removeClass(getById('message'), 'hidden');
}

export function destroyAll(mediaInstances: Array<VideojsModInstance>) {
    for (const mediaInstance of mediaInstances) {
        mediaInstance.destroy();
    }
}

export function getDownloadAccordion(token: string, seriesID: string, epIndex: number): HTMLElement {

    const accordion = createElement('button');
    addClass(accordion, 'accordion');
    accordion.innerHTML = 'DOWNLOAD';

    const accordionPanel = createElement('div');
    addClass(accordionPanel, 'panel');

    accordionPanel.innerHTML = '<ul>' +
        '<li>まず、下の「ダウンロード」ボタンをクリックして、必要なツールやスクリプトが入ったZIPファイルをダウンロードしてください。</li>' +
        '<li>このZIPファイルをダウンロードした後、解凍してREADME.txtに記載されている手順に従ってください。</li>' +
        '<li>ZIPファイルをダウンロード後、5分以内にスクリプトを起動してください。</li>' +
        '<li>インターネット接続が良好であることを確認してください。</li>' +
        '<li>IDMなどの拡張機能を使用している場合、ZIPファイルのダウンロードに問題が発生する可能性があります。ダウンロードする前に、そのような拡張機能を無効にしてください。</li>' +
        '</ul>';

    const downloadButton = createElement('button') as HTMLButtonElement;
    downloadButton.id = 'download-button';
    addClass(downloadButton, 'button');
    downloadButton.innerHTML = 'ダウンロード';
    const warning = createElement('p');
    changeColor(warning, 'red');
    addClass(warning, 'hidden');
    warning.innerHTML = 'お使いの端末はダウンロードに対応していません。';
    appendChild(accordionPanel, warning);

    const iframe = createElement('iframe') as HTMLIFrameElement;
    iframe.id = 'download-iframe';
    iframe.height = '0';
    iframe.width = '0';

    addEventListener(downloadButton, 'click', function () {
        downloadButton.disabled = true;
        sendServerRequest('start_download.php', {
            callback: function (response: string) {
                if (response == 'UNAVAILABLE') {
                    addClass(downloadButton, 'hidden');
                    removeClass(warning, 'hidden');
                } else if (response.startsWith(SERVER_URL)) {
                    iframe.src = response;
                    downloadButton.disabled = false;
                } else {
                    showMessage(invalidResponse);
                }
            },
            content: "token=" + token + '&format=' + getFormatIndex(),
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
    addEventListener(acc, "click", function () {
        toggleClass(acc, "active");
        const panel = acc.nextElementSibling;
        if (panel === null) {
            return;
        }
        const panelCast = panel as HTMLElement;
        if (panelCast.style.maxHeight !== '') {
            panelCast.style.maxHeight = '';
            panelCast.style.padding = '0px 1em';
        } else {
            panelCast.style.maxHeight = getContentBoxHeight(panelCast) + "px";
            panelCast.style.padding = '1em';
        }
    });
}