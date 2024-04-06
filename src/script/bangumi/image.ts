import {
    SessionTypes,
    openImageWindow,
    removeRightClick,
} from '../module/common';
import {
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
    replaceChildren,
    createAnchorElement,
} from '../module/dom';
import { EPInfoKey, ImageFileKey, type ImageEPInfo } from '../module/type/BangumiInfo';
import { addAccordionEvent, buildAccordion } from './media_helper';
import { encodeCFURIComponent } from '../module/common/pure';
import { addTimeout } from '../module/timer';
import { MediaSessionInfoKey, type MediaSessionInfo } from '../module/type/MediaSessionInfo';
import { pgid } from '../module/global';
import { lazyloadImportPromise } from './import_promise';
import { SharedElement, getSharedElement } from './shared_var';
import { LazyloadProp, offloadLazyload } from '../module/lazyload';
import { hideElement, setWidth } from '../module/style';
import { CSS_AUTO } from '../module/style/value';
import * as styles from '../../css/bangumi.module.scss';

export default async function (
    epInfo: ImageEPInfo,
    baseURL: string,
    createMediaSessionPromise: Promise<MediaSessionInfo>
) {
    const contentContainer = getSharedElement(SharedElement.CONTENT_CONTAINER);

    if (epInfo[EPInfoKey.TITLE] !== undefined) {
        const title = createParagraphElement();
        addClass(title, styles.subTitle, styles.centerAlign);
        title.innerHTML = epInfo[EPInfoKey.TITLE]; // Gallery title is in HTML syntax.
        prependChild(contentContainer, title);
    }

    const downloadElem = createDivElement();
    addClass(downloadElem, styles.download);

    const [downloadAccordion, downloadPanel] = buildAccordion('ダウンロード', true);
    const downloadPanelContent = createUListElement();
    const downloadPanelContentItem = createLIElement();
    appendText(downloadPanelContentItem, '画像をクリックすると、ダウンロードできます。');
    appendChild(downloadPanelContent, downloadPanelContentItem);
    appendChild(downloadPanel, downloadPanelContent);

    appendChild(downloadElem, downloadAccordion);
    appendChild(downloadElem, downloadPanel);
    appendChild(contentContainer, downloadElem);

    const currentPgid = pgid;
    const mediaSessionCredential = await createMediaSessionPromise;
    const lazyloadModule = await lazyloadImportPromise;
    if (currentPgid !== pgid) {
        return;
    }
    const credential = mediaSessionCredential[MediaSessionInfoKey.CREDENTIAL];
    lazyloadModule[LazyloadProp.SET_CREDENTIAL](credential, SessionTypes.MEDIA);
    showImages(epInfo[EPInfoKey.FILES], baseURL, credential, lazyloadModule);
}

function showImages(files: ImageEPInfo[EPInfoKey.FILES], baseURL: string, credential: string, lazyloadModule: Awaited<typeof lazyloadImportPromise>) {
    const mediaHolder = getSharedElement(SharedElement.MEDIA_HOLDER);
    replaceChildren(mediaHolder);
    for (const file of files) {
        const fileName = file[ImageFileKey.FILE_NAME];
        const imageNode = createDivElement();
        const lazyloadNode = createDivElement();
        const downloadPanel = createDivElement();
        const showFullSizeButton = createButtonElement('フルサイズで表示');
        const downloadButton = createButtonElement('ダウンロード');
        const buttonFlexbox = createDivElement();
        const downloadAnchor = createAnchorElement();

        addClass(imageNode, styles.imageContainer);
        addClass(lazyloadNode, styles.image);

        addClass(downloadPanel, styles.accordionPanel);
        setWidth(showFullSizeButton, CSS_AUTO);
        downloadButton.disabled = true;
        addClass(buttonFlexbox, styles.imageButtonFlexbox);
        appendChild(buttonFlexbox, showFullSizeButton);
        appendChild(buttonFlexbox, downloadButton);
        appendChild(downloadPanel, buttonFlexbox);

        hideElement(downloadAnchor);
        downloadAnchor.download = fileName;
        appendChild(downloadPanel, downloadAnchor); // The element need to be in the document for some old browsers like Firefox <= 69.

        removeRightClick(lazyloadNode);
        addAccordionEvent([lazyloadNode, downloadPanel, false], null);

        appendChild(imageNode, lazyloadNode);
        appendChild(imageNode, downloadPanel);
        appendChild(mediaHolder, imageNode);

        addEventListener(showFullSizeButton, 'click', () => {
            openImageWindow(baseURL, fileName, credential, SessionTypes.MEDIA);
        });
        lazyloadModule[LazyloadProp.DEFAULT](lazyloadNode, baseURL + encodeCFURIComponent(fileName), fileName, {
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
                addClass(subtitle, styles.subTitle);
                const subtitleStyle = subtitle.style;
                subtitleStyle.fontSize = 'small';
                subtitleStyle.marginTop = '0px';
                subtitleStyle.marginBottom = '0.5em';
                const formatText = createSpanElement(canvas.width + '×' + canvas.height);
                addClass(formatText, styles.subTitleFormat);
                appendChild(subtitle, formatText);
                insertBefore(subtitle, imageNode);
            },
        });
    }
}

export function offload() {
    offloadLazyload();
}