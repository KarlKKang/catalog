import { body } from '../module/dom/body';
import { createParagraphElement } from '../module/dom/element/paragraph/create';
import { createDivElement } from '../module/dom/element/div/create';
import { appendChild } from '../module/dom/node/append_child';
import { addClass } from '../module/dom/class/add';
import * as styles from '../../css/bangumi.module.scss';
import { loading } from '../module/text/search/loading';
import { addOffloadCallback } from '../module/global/offload';

export const enum SharedElement {
    CONTENT_CONTAINER,
    MEDIA_HOLDER,
}
let sharedElements: { [key in SharedElement]: HTMLElement } | null = null;
export let errorMessageElement: HTMLElement | null = null;

export function initializeSharedVars() {
    addOffloadCallback(dereferenceSharedVars);
    const content = createDivElement();
    addClass(content, styles.content);
    appendChild(body, content);
    const mediaHolder = createDivElement();
    addClass(mediaHolder, styles.mediaHolder);
    appendChild(content, mediaHolder);
    const loadingText = createParagraphElement(loading);
    addClass(loadingText, styles.loadingText);
    appendChild(mediaHolder, loadingText);
    sharedElements = {
        [SharedElement.CONTENT_CONTAINER]: content,
        [SharedElement.MEDIA_HOLDER]: mediaHolder,
    };
}

function dereferenceSharedVars() {
    sharedElements = null;
}

export function getSharedElement(idx: SharedElement): HTMLElement {
    if (sharedElements === null) {
        throw new Error('Not initialized.');
    }
    const value = sharedElements[idx];
    return value;
}

export function setErrorMessageElement(elem: HTMLElement) {
    addOffloadCallback(dereferenceErrorMessageElement);
    errorMessageElement = elem;
}

export function dereferenceErrorMessageElement() {
    errorMessageElement = null;
}
