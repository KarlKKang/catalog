import {
    openImageWindow,
} from '../module/image/open_window';
import { ImageSessionTypes } from '../module/image/session_type';
import { removeRightClick } from '../module/dom/element/remove_right_click';
import { createStyledButtonElement } from '../module/dom/element/button/styled/create';
import { appendText } from '../module/dom/element/text/append';
import { createAnchorElement } from '../module/dom/element/anchor/create';
import { createLIElement } from '../module/dom/element/list/li/create';
import { createUListElement } from '../module/dom/element/list/ul/create';
import { createParagraphElement } from '../module/dom/element/paragraph/create';
import { createSpanElement } from '../module/dom/element/span/create';
import { createDivElement } from '../module/dom/element/div/create';
import { prependChild } from '../module/dom/node/prepend_child';
import { insertBefore } from '../module/dom/node/insert_before';
import { replaceChildren } from '../module/dom/node/replace_children';
import { appendChild } from '../module/dom/node/append_child';
import { addClass } from '../module/dom/class/add';
import { addEventListener } from '../module/event_listener/add';
import { FileInfoKey, ImageFileKey, type ImageFileInfo } from '../module/type/EPInfo';
import { addAccordionEvent, buildAccordion } from './media_helper';
import { encodeCloudfrontURIComponent } from '../module/string/uri/cloudfront/encode_component';
import { MediaSessionInfoKey, type MediaSessionInfo } from '../module/type/MediaSessionInfo';
import { SharedElement, getSharedElement } from './shared_var';
import { hideElement } from '../module/style/hide_element';
import { setWidth } from '../module/style/width';
import { CSS_AUTO } from '../module/style/value/auto';
import * as styles from '../../css/bangumi.module.scss';
import { attachLazyload, setLazyloadCredential, offload as offloadLazyload } from '../module/lazyload';
import { disableButton } from '../module/dom/element/button/disable';
import { addOffloadCallback } from '../module/global/offload';
import { addTimeoutNative } from '../module/timer/add/native/timeout';

export default async function (
    fileInfo: ImageFileInfo,
    baseURL: string,
    createMediaSessionPromise: Promise<MediaSessionInfo>,
    canonicalURL: string,
) {
    const contentContainer = getSharedElement(SharedElement.CONTENT_CONTAINER);

    if (fileInfo[FileInfoKey.TITLE] !== undefined) {
        const title = createParagraphElement();
        addClass(title, styles.subTitle, styles.centerAlign);
        title.innerHTML = fileInfo[FileInfoKey.TITLE]; // Gallery title is in HTML syntax.
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

    const mediaSessionCredential = await createMediaSessionPromise;
    const credential = mediaSessionCredential[MediaSessionInfoKey.CREDENTIAL];
    addOffloadCallback(offloadLazyload);
    setLazyloadCredential(credential, ImageSessionTypes.MEDIA);
    showImages(fileInfo[FileInfoKey.FILES], baseURL, credential, canonicalURL);
}

function showImages(files: ImageFileInfo[FileInfoKey.FILES], baseURL: string, credential: string, canonicalURL: string) {
    const mediaHolder = getSharedElement(SharedElement.MEDIA_HOLDER);
    replaceChildren(mediaHolder);
    for (const file of files) {
        const fileName = file[ImageFileKey.FILE_NAME];
        const imageNode = createDivElement();
        const lazyloadNode = createDivElement();
        const downloadPanel = createDivElement();
        const showFullSizeButton = createStyledButtonElement('フルサイズで表示');
        const downloadButton = createStyledButtonElement('ダウンロード');
        const buttonFlexbox = createDivElement();
        const downloadAnchor = createAnchorElement();

        addClass(imageNode, styles.imageContainer);
        addClass(lazyloadNode, styles.image);

        addClass(downloadPanel, styles.accordionPanel);
        setWidth(showFullSizeButton, CSS_AUTO);
        disableButton(downloadButton, true);
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
            openImageWindow(baseURL, fileName, credential, ImageSessionTypes.MEDIA, canonicalURL);
        });
        attachLazyload(
            lazyloadNode,
            baseURL + encodeCloudfrontURIComponent(fileName),
            fileName,
            250,
            (data: Blob) => {
                addEventListener(downloadButton, 'click', () => {
                    const objURL = URL.createObjectURL(data);
                    downloadAnchor.href = objURL;
                    downloadAnchor.click();
                    downloadAnchor.href = '';
                    addTimeoutNative(() => {
                        URL.revokeObjectURL(objURL);
                    }, 100); // Should be triggered in the next event cycle otherwise the download will fail (at least in Chrome). iOS 14 and earlier need some delays.
                });
                disableButton(downloadButton, false);
            },
            (canvas) => {
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
        );
    }
}
