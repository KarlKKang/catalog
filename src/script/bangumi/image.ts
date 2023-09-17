import {
    removeRightClick,
} from '../module/main';
import {
    createElement,
    addClass,
    appendChild,
    prependChild,
    getById,
    addEventListener,
    hideElement,
    createParagraphElement,
    createDivElement,
    createButtonElement,
    createHRElement,
    createUListElement,
    createLIElement,
    appendText,
} from '../module/dom';
import type { ImageEPInfo } from '../module/type/BangumiInfo';
import type { LazyloadImportPromise } from './get_import_promises';
import { show as showMessage } from '../module/message';
import { moduleImportError } from '../module/message/template/param';
import type { default as LazyloadObserve } from '../module/lazyload';
import { addAccordionEvent } from './media_helper';
import { encodeCFURIComponent } from '../module/main/pure';

export default async function (
    epInfo: ImageEPInfo,
    baseURL: string,
    lazyloadImportPromise: LazyloadImportPromise
) {
    let lazyloadObserve: typeof LazyloadObserve;
    try {
        lazyloadObserve = (await lazyloadImportPromise).default;
    } catch (e) {
        showMessage(moduleImportError(e));
        throw e;
    }

    const contentContainer = getById('content');
    const mediaHolder = getById('media-holder');

    if (epInfo.gallery_title != '') {
        const title = createParagraphElement();
        addClass(title, 'sub-title');
        addClass(title, 'center-align');
        title.innerHTML = epInfo.gallery_title; // Gallery title is in HTML syntax.
        prependChild(contentContainer, title);
    }

    const files = epInfo.files;

    files.forEach((file, index) => {
        if (file.tag != '') {
            const subtitle = createParagraphElement();
            addClass(subtitle, 'sub-title');
            appendText(subtitle, file.tag);
            appendChild(mediaHolder, subtitle);
        }

        const imageNode = createDivElement();
        const lazyloadNode = createDivElement();
        const overlay = createDivElement();
        const downloadPanel = createDivElement();
        const downloadButton = createButtonElement();
        const downloadAnchor = createElement('a') as HTMLAnchorElement;

        addClass(imageNode, 'image');
        addClass(lazyloadNode, 'lazyload');
        addClass(overlay, 'overlay');
        appendChild(lazyloadNode, overlay);

        addClass(downloadPanel, 'panel');
        addClass(downloadButton, 'button');
        addClass(downloadButton, 'hcenter');
        addClass(downloadButton, 'download-button');
        downloadButton.disabled = true;
        appendText(downloadButton, 'ダウンロード');
        appendChild(downloadPanel, downloadButton);

        hideElement(downloadAnchor);
        downloadAnchor.download = file.file_name;
        appendChild(downloadPanel, downloadAnchor); // The element need to be in the document for some old browsers like Firefox <= 69.

        removeRightClick(lazyloadNode);
        addAccordionEvent(lazyloadNode, downloadPanel, false);

        appendChild(imageNode, lazyloadNode);
        appendChild(imageNode, downloadPanel);
        appendChild(mediaHolder, imageNode);

        lazyloadObserve(lazyloadNode, baseURL + encodeCFURIComponent(file.file_name), file.file_name, {
            xhrParam: 'p=' + index,
            mediaSessionCredential: epInfo.media_session_credential,
            delay: 250,
            onDataLoad: function (data: Blob) {
                addEventListener(downloadButton, 'click', () => {
                    downloadButton.disabled = true;
                    downloadAnchor.href = URL.createObjectURL(data);
                    addEventListener(downloadAnchor, 'click', () => {
                        setTimeout(() => {
                            URL.revokeObjectURL(downloadAnchor.href);
                            downloadAnchor.href = '';
                            downloadButton.disabled = false;
                        }, 100); // Should be triggered in the next event cycle otherwise the download will fail (at least in Chrome). iOS 14 and earlier need some delays.
                    });
                    downloadAnchor.click();
                });
                downloadButton.disabled = false;
            }
        });
    });

    const downloadElem = createDivElement();
    addClass(downloadElem, 'download');

    const downloadAccordion = createButtonElement();
    addClass(downloadAccordion, 'accordion');
    appendText(downloadAccordion, 'ダウンロード');

    const downloadPanel = createDivElement();
    addClass(downloadPanel, 'panel');
    appendChild(downloadPanel, createHRElement());
    const downloadPanelContent = createUListElement();
    const downloadPanelContentItem = createLIElement();
    appendText(downloadPanelContentItem, '画像をクリックすると、ダウンロードできます。');
    appendChild(downloadPanelContent, downloadPanelContentItem);
    appendChild(downloadPanel, downloadPanelContent);
    addAccordionEvent(downloadAccordion, downloadPanel, true);

    appendChild(downloadElem, downloadAccordion);
    appendChild(downloadElem, downloadPanel);
    appendChild(contentContainer, downloadElem);
}