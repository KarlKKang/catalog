import {
    encodeCFURIComponent,
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
} from '../module/dom';
import type { ImageEPInfo } from '../module/type/BangumiInfo';
import type { LazyloadImportPromise } from './get_import_promises';
import { show as showMessage } from '../module/message';
import { moduleImportError } from '../module/message/template/param';
import type { default as LazyloadObserve } from '../module/lazyload';
import { addAccordionEvent } from './media_helper';

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
        const title = createElement('p');
        addClass(title, 'sub-title');
        addClass(title, 'center-align');
        title.innerHTML = epInfo.gallery_title;
        prependChild(contentContainer, title);
    }

    const files = epInfo.files;

    files.forEach(function (file, index) {
        if (file.tag != '') {
            const subtitle = createElement('p');
            addClass(subtitle, 'sub-title');
            subtitle.innerHTML = file.tag;
            appendChild(mediaHolder, subtitle);
        }

        const imageNode = createElement('div');
        const overlay = createElement('div');
        const downloadPanel = createElement('div');
        const downloadButton = createElement('button') as HTMLButtonElement;
        const downloadAnchor = createElement('a') as HTMLAnchorElement;

        addClass(imageNode, 'lazyload');
        addClass(overlay, 'overlay');
        appendChild(imageNode, overlay);

        addClass(downloadPanel, 'download');
        addClass(downloadPanel, 'panel');
        addClass(downloadButton, 'button');
        addClass(downloadButton, 'image-download-button');
        downloadButton.disabled = true;
        downloadButton.innerHTML = 'ダウンロード';
        appendChild(downloadPanel, downloadButton);

        hideElement(downloadAnchor);
        downloadAnchor.download = file.file_name;
        appendChild(downloadPanel, downloadAnchor); // The element need to be in the document for some old browsers like Firefox <= 69.

        removeRightClick(imageNode);
        addAccordionEvent(imageNode, downloadPanel);

        appendChild(mediaHolder, imageNode);
        appendChild(mediaHolder, downloadPanel);

        lazyloadObserve(imageNode, baseURL + encodeCFURIComponent(file.file_name), file.file_name, {
            xhrParam: index.toString(),
            mediaSessionCredential: epInfo.media_session_credential,
            delay: 250,
            onDataLoad: function (data: Blob) {
                addEventListener(downloadButton, 'click', function () {
                    downloadButton.disabled = true;
                    downloadAnchor.href = URL.createObjectURL(data);
                    addEventListener(downloadAnchor, 'click', function () {
                        setTimeout(function () {
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

    const downloadElem = createElement('div');
    addClass(downloadElem, 'download');

    const downloadAccordion = createElement('button');
    addClass(downloadAccordion, 'accordion');
    downloadAccordion.innerHTML = 'DOWNLOAD';

    const downloadPanel = createElement('div');
    addClass(downloadPanel, 'panel');
    downloadPanel.innerHTML = '<ul>' +
        '<li>画像をクリックすると、ダウンロードできます。</li>' +
        '</ul>';

    addAccordionEvent(downloadAccordion, downloadPanel);

    appendChild(downloadElem, downloadAccordion);
    appendChild(downloadElem, downloadPanel);
    appendChild(contentContainer, downloadElem);
}