import { addClass, appendChild, body, createDivElement, createParagraphElement, prependChild } from '../module/dom';
import * as styles from '../../css/bangumi.module.scss';

let sharedElementVars: HTMLElement[] = [];
export let errorMessageElement: HTMLElement | null = null;

export const enum SharedElementVarsIdx {
    TITLE,
    CONTENT_CONTAINER,
    MEDIA_HOLDER,
}

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
    sharedElementVars = [
        titleElem,
        content,
        mediaHolder,
    ];
}

export function dereferenceSharedVars() {
    sharedElementVars = [];
}

export function getSharedElement(idx: SharedElementVarsIdx): HTMLElement {
    const value = sharedElementVars[idx];
    if (value === undefined) {
        throw new Error('Cannot access shared variable.');
    }
    return value;
}

export function setErrorMessageElement(elem: HTMLElement | null) {
    errorMessageElement = elem;
}