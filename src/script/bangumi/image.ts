import {
    removeRightClick,
} from '../module/common';
import {
    createElement,
    addClass,
    appendChild,
    prependChild,
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
import { addAccordionEvent, buildAccordion } from './media_helper';
import { encodeCFURIComponent } from '../module/common/pure';
import { addTimeout } from '../module/timer';
import type { MediaSessionInfo } from '../module/type/MediaSessionInfo';
import { pgid } from '../module/global';
import { lazyloadImportPromise } from './import_promise';
import { SHARED_VAR_IDX_CONTENT_CONTAINER, SHARED_VAR_IDX_MEDIA_HOLDER, getSharedElement } from './shared_var';
import { unloadLazyload } from '../module/lazyload';

type ImageLoader = typeof import(
    /* webpackExports: ["clearAllImageEvents"] */
    '../module/image_loader'
);
let imageLoader: ImageLoader | null = null;

export default async function (
    epInfo: ImageEPInfo,
    baseURL: string,
    createMediaSessionPromise: Promise<MediaSessionInfo>
) {
    const contentContainer = getSharedElement(SHARED_VAR_IDX_CONTENT_CONTAINER);
    const mediaHolder = getSharedElement(SHARED_VAR_IDX_MEDIA_HOLDER);

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

    const currentPgid = pgid;
    const [lazyloadModule, mediaSessionCredential] = await Promise.all([lazyloadImportPromise, createMediaSessionPromise]);
    if (currentPgid !== pgid) {
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

        lazyloadModule.default(lazyloadNode, baseURL + encodeCFURIComponent(file.file_name), file.file_name, {
            xhrParam: 'p=' + index,
            mediaSessionCredential: mediaSessionCredential.credential,
            delay: 250,
            onDataLoad: (data: Blob) => {
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
            },
            onImageDraw: () => {
                imageNode.style.width = 'fit-content';
            },
        });
    });
}

export function offload() {
    unloadLazyload();
    imageLoader?.clearAllImageEvents();
    imageLoader = null;
}