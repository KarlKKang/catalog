import {
    SessionTypes,
    openImageWindow,
    removeRightClick,
} from '../module/common';
import {
    createElement,
    addClass,
    appendChild,
    prependChild,
    addEventListener,
    createParagraphElement,
    createDivElement,
    createButtonElement,
    createUListElement,
    createLIElement,
    appendText,
    createSpanElement,
    insertBefore,
} from '../module/dom';
import type { ImageEPInfo } from '../module/type/BangumiInfo';
import { addAccordionEvent, buildAccordion } from './media_helper';
import { encodeCFURIComponent } from '../module/common/pure';
import { addTimeout } from '../module/timer';
import type { MediaSessionInfo } from '../module/type/MediaSessionInfo';
import { pgid } from '../module/global';
import { lazyloadImportPromise } from './import_promise';
import { SharedElementVarsIdx, getSharedElement } from './shared_var';
import { unloadLazyload } from '../module/lazyload';
import { hideElement, setWidth } from '../module/style';
import { CSS_AUTO } from '../module/style/value';

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
    const contentContainer = getSharedElement(SharedElementVarsIdx.CONTENT_CONTAINER);
    const mediaHolder = getSharedElement(SharedElementVarsIdx.MEDIA_HOLDER);

    if (epInfo.gallery_title !== '') {
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
    lazyloadModule.setCredential(mediaSessionCredential.credential, SessionTypes.MEDIA);

    for (const file of files) {
        const imageNode = createDivElement();
        const lazyloadNode = createDivElement();
        const overlay = createDivElement();
        const downloadPanel = createDivElement();
        const showFullSizeButton = createButtonElement('フルサイズで表示');
        const downloadButton = createButtonElement('ダウンロード');
        const buttonFlexbox = createDivElement();
        const downloadAnchor = createElement('a') as HTMLAnchorElement;

        addClass(imageNode, 'image');
        addClass(lazyloadNode, 'lazyload');
        addClass(overlay, 'overlay');
        appendChild(lazyloadNode, overlay);

        addClass(downloadPanel, 'panel');
        setWidth(showFullSizeButton, CSS_AUTO);
        downloadButton.disabled = true;
        addClass(buttonFlexbox, 'image-button-flexbox');
        appendChild(buttonFlexbox, showFullSizeButton);
        appendChild(buttonFlexbox, downloadButton);
        appendChild(downloadPanel, buttonFlexbox);

        hideElement(downloadAnchor);
        downloadAnchor.download = file.file_name;
        appendChild(downloadPanel, downloadAnchor); // The element need to be in the document for some old browsers like Firefox <= 69.

        removeRightClick(lazyloadNode);
        addAccordionEvent(lazyloadNode, downloadPanel, null, false);

        appendChild(imageNode, lazyloadNode);
        appendChild(imageNode, downloadPanel);
        appendChild(mediaHolder, imageNode);

        addEventListener(showFullSizeButton, 'click', () => {
            openImageWindow(baseURL, file.file_name, mediaSessionCredential.credential, SessionTypes.MEDIA);
        });
        lazyloadModule.default(lazyloadNode, baseURL + encodeCFURIComponent(file.file_name), file.file_name, {
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
            onImageDraw: (canvas) => {
                const subtitle = createParagraphElement();
                addClass(subtitle, 'sub-title');
                const subtitleStyle = subtitle.style;
                subtitleStyle.fontSize = 'small';
                subtitleStyle.marginTop = '0px';
                subtitleStyle.marginBottom = '0.5em';
                const formatText = createSpanElement(canvas.width + '×' + canvas.height);
                addClass(formatText, 'format');
                appendChild(subtitle, formatText);
                insertBefore(subtitle, imageNode);
            },
        });
    }
}

export function offload() {
    unloadLazyload();
    imageLoader?.clearAllImageEvents();
    imageLoader = null;
}