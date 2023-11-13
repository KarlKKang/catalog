import {
    removeRightClick,
} from '../module/common';
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
    createUListElement,
    createLIElement,
    appendText,
} from '../module/dom';
import type { ImageEPInfo } from '../module/type/BangumiInfo';
import type { ImageLoaderImportPromise, LazyloadImportPromise } from './get_import_promises';
import { show as showMessage } from '../module/message';
import { moduleImportError } from '../module/message/template/param';
import type { default as LazyloadObserve } from '../module/lazyload';
import { addAccordionEvent, buildAccordion } from './media_helper';
import { encodeCFURIComponent } from '../module/common/pure';
import { addTimeout } from '../module/timer';
import type { RedirectFunc } from '../module/type/RedirectFunc';
import type { MediaSessionInfo } from '../module/type/MediaSessionInfo';

let pageLoaded = true;

type Lazyload = typeof import(
    /* webpackExports: ["default", "unobserveAll"] */
    '../module/lazyload'
);
let lazyload: Lazyload | null = null;

type ImageLoader = typeof import(
    /* webpackExports: ["clearAllImageEvents"] */
    '../module/image_loader'
);
let imageLoader: ImageLoader | null = null;

export default async function (
    redirect: RedirectFunc,
    epInfo: ImageEPInfo,
    baseURL: string,
    lazyloadImportPromise: LazyloadImportPromise,
    imageLoaderImportPromise: ImageLoaderImportPromise,
    createMediaSessionPromise: Promise<MediaSessionInfo>
) {
    if (!pageLoaded) {
        return;
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

    const downloadElem = createDivElement();
    addClass(downloadElem, 'download');

    const [downloadAccordion, downloadPanel] = buildAccordion('ダウンロード', true);
    const downloadPanelContent = createUListElement();
    const downloadPanelContentItem = createLIElement();
    appendText(downloadPanelContentItem, '画像をクリックすると、ダウンロードできます。');
    appendChild(downloadPanelContent, downloadPanelContentItem);
    appendChild(downloadPanel, downloadPanelContent);

    appendChild(downloadElem, downloadAccordion);
    appendChild(downloadElem, downloadPanel);
    appendChild(contentContainer, downloadElem);

    const files = epInfo.files;

    let lazyloadObserve: typeof LazyloadObserve;
    let mediaSessionCredential: string;
    try {
        mediaSessionCredential = (await createMediaSessionPromise).credential;
        lazyload = await lazyloadImportPromise;
        lazyloadObserve = lazyload.default;
        imageLoader = await imageLoaderImportPromise;
    } catch (e) {
        showMessage(redirect, moduleImportError(e));
        throw e;
    }

    if (!pageLoaded) {
        return;
    }

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
        addAccordionEvent(lazyloadNode, downloadPanel, null, false);

        appendChild(imageNode, lazyloadNode);
        appendChild(imageNode, downloadPanel);
        appendChild(mediaHolder, imageNode);

        lazyloadObserve(lazyloadNode, baseURL + encodeCFURIComponent(file.file_name), file.file_name, redirect, {
            xhrParam: 'p=' + index,
            mediaSessionCredential: mediaSessionCredential,
            delay: 250,
            onDataLoad: function (data: Blob) {
                addEventListener(downloadButton, 'click', () => {
                    downloadButton.disabled = true;
                    downloadAnchor.href = URL.createObjectURL(data);
                    addEventListener(downloadAnchor, 'click', () => {
                        addTimeout(() => {
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
}

export function reload() {
    pageLoaded = true;
}

export function offload() {
    pageLoaded = false;
    lazyload?.unobserveAll();
    lazyload = null;
    imageLoader?.clearAllImageEvents();
    imageLoader = null;
}