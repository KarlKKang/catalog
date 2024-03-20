import {
    CDN_URL, DOMAIN,
} from '../module/env/constant';
import { sendServerRequest } from '../module/server';
import {
    w,
    addEventListener,
    createElement,
    addClass,
    appendChild,
    insertBefore,
    prependChild,
    getByIdNative,
    getDescendantsByClassAt,
    getBaseURL,
    createButtonElement,
    createDivElement,
    createSelectElement,
    createOptionElement,
    createHRElement,
    createUListElement,
    appendText,
    appendListItems,
    replaceText,
    removeClass,
    replaceChildren,
    createTextNode,
} from '../module/dom';
import { show as showMessage } from '../module/message';
import { invalidResponse } from '../module/server/message';
import { createMessageElem, getContentBoxHeight, getLogoutParam } from './helper';
import { IS_IOS, IS_MACOS, IS_WINDOWS } from '../module/browser';
import { VideoFormatInfo } from '../module/type/BangumiInfo';
import { addTimeout } from '../module/timer';
import { CustomMediaError } from '../module/player/media_error';
import { SharedElementVarsIdx, getSharedElement } from './shared_var';
import { hideElement, horizontalCenter, setMaxHeight } from '../module/style';
import { CSS_UNIT_PX } from '../module/style/value';
import { defaultError } from '../module/text/message/title';
import { defaultErrorSuffix } from '../module/text/message/body';

export const incompatibleTitle = '再生できません';
export const incompatibleSuffix = '他のブラウザをご利用いただくか、パソコンでファイルをダウンロードして再生してください。';

function showNetworkError() {
    showTextErrorMessage(defaultError, 'ネットワークエラーが発生しました。インターネット接続環境をご確認の上、再度お試しください。または、' + DOMAIN + 'の他のタブでの操作が、現在のタブに干渉している可能性があります。この場合、ページを再読み込みしてみてください。');
}

function showUnknownPlaybackError() {
    showTextErrorMessage(defaultError, '再生中に不明なエラーが発生しました。' + defaultErrorSuffix);
}

function showDecodeError() {
    showTextErrorMessage(defaultError, 'お使いのブラウザは、このデータ形式をデコードすることができません。コーデックに対応していない、またはデコードのためのメモリが不足している可能性があります。' + incompatibleSuffix);
}

export function showHLSCompatibilityError() {
    showTextErrorMessage(incompatibleTitle, 'お使いのブラウザは、再生に最低限必要なMedia Source Extensions（MSE）およびHTTP Live Streaming（HLS）に対応していません。' + incompatibleSuffix);
}

export function showCodecCompatibilityError() {
    showTextErrorMessage(incompatibleTitle, 'お使いのブラウザは、再生に必要なコーデックに対応していません。' + incompatibleSuffix);
}

function showPlayPromiseError() {
    showTextErrorMessage(incompatibleTitle, 'ブラウザによって再生が中断されました。ページを再読み込みしてみてください。このエラーが続く場合は、他のブラウザでお試しください。');
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

export function showTextErrorMessage(title: string, body: string) {
    showErrorMessage(title, [createTextNode(body)]);
}

export function showErrorMessage(title: string, body: Node[]) {
    const mediaHolder = getSharedElement(SharedElementVarsIdx.MEDIA_HOLDER);
    let messageElem = getByIdNative('error');
    if (messageElem === null) {
        messageElem = createMessageElem(title, body, 'red');
        messageElem.id = 'error';
        insertBefore(messageElem, mediaHolder);
    } else {
        const titleElem = getDescendantsByClassAt(messageElem, 'message-title', 0);
        const bodyElem = getDescendantsByClassAt(messageElem, 'message-body', 0);
        titleElem.innerHTML = title;
        replaceChildren(bodyElem, ...body);
    }
    hideElement(mediaHolder);
}

export function showMediaMessage(title: string, body: Node[], titleColor: string | null) {
    const messageElem = createMessageElem(title, body, titleColor);
    prependChild(getSharedElement(SharedElementVarsIdx.MEDIA_HOLDER), messageElem);
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

    const downloadButton = createButtonElement('ダウンロード');
    horizontalCenter(downloadButton);

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
        sendServerRequest('start_download', {
            callback: function (response: string) {
                if (getBaseURL(response).startsWith(CDN_URL + '/download/')) {
                    iframe.src = response;
                    downloadButton.disabled = false;
                } else {
                    showMessage(invalidResponse());
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
    return [downloadElem, containerSelector];
}

export function buildAccordion(title: string, active: boolean): [HTMLDivElement, HTMLDivElement] {
    const accordion = createDivElement();
    addClass(accordion, 'accordion');

    const titleElem = createDivElement();
    addClass(titleElem, 'accordion-title');
    appendText(titleElem, title);
    appendChild(accordion, titleElem);

    const iconElem = createDivElement();
    addClass(iconElem, 'accordion-icon');
    appendChild(accordion, iconElem);

    const accordionPanel = createDivElement();
    addClass(accordionPanel, 'panel');
    appendChild(accordionPanel, createHRElement());
    addAccordionEvent(accordion, accordionPanel, iconElem, active);
    return [accordion, accordionPanel];
}

export function addAccordionEvent(acc: HTMLElement, panel: HTMLElement, icon: HTMLElement | null, active: boolean): void {
    const hidePanel = () => {
        setMaxHeight(panel, 0, CSS_UNIT_PX);
    };

    const changeIcon = () => {
        if (icon !== null) {
            replaceText(icon, active ? '-' : '+');
        }
    };

    if (!active) {
        hidePanel();
    } else {
        addClass(acc, 'active');
    }
    changeIcon();

    let currentTimeout: NodeJS.Timeout | null = null;
    let currentAnimationFrame: number | null = null;
    addEventListener(acc, 'click', () => {
        active = !active;
        changeIcon();
        if (active) {
            addClass(acc, 'active');
            currentAnimationFrame = null;
            setMaxHeight(panel, getContentBoxHeight(panel), CSS_UNIT_PX);
            const timeout = addTimeout(() => {
                if (currentTimeout === timeout) {
                    setMaxHeight(panel, null);
                }
            }, 200);
            currentTimeout = timeout;
        } else {
            removeClass(acc, 'active');
            currentTimeout = null;
            let animationFrame = w.requestAnimationFrame(() => {
                if (currentAnimationFrame === animationFrame) {
                    setMaxHeight(panel, getContentBoxHeight(panel), CSS_UNIT_PX);
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