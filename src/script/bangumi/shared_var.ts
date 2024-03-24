import { addClass, appendChild, body, createDivElement, createParagraphElement, prependChild } from '../module/dom';
import * as styles from '../../css/bangumi.module.scss';

export const enum SharedElement {
    TITLE,
    CONTENT_CONTAINER,
    MEDIA_HOLDER,
}
let sharedElements: { [key in SharedElement]: HTMLElement } | null = null;
export let errorMessageElement: HTMLElement | null = null;

export function initializeSharedVars() {
    const titleElem = createParagraphElement();
    addClass(titleElem, styles.title);
    prependChild(body, titleElem);
    const content = createDivElement();
    addClass(content, styles.content);
    const mediaHolder = createDivElement();
    addClass(mediaHolder, styles.mediaHolder);
    appendChild(content, mediaHolder);
    appendChild(body, content);
    sharedElements = {
        [SharedElement.TITLE]: titleElem,
        [SharedElement.CONTENT_CONTAINER]: content,
        [SharedElement.MEDIA_HOLDER]: mediaHolder,
    };
}

export function dereferenceSharedVars() {
    sharedElements = null;
}

export function getSharedElement(idx: SharedElement): HTMLElement {
    if (sharedElements === null) {
        throw new Error('Not initialized.');
    }
    const value = sharedElements[idx];
    return value;
}

export function setErrorMessageElement(elem: HTMLElement | null) {
    errorMessageElement = elem;
}