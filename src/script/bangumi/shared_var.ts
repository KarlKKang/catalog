import { body } from '../module/dom/body';
import { createDivElement, createParagraphElement } from '../module/dom/create_element';
import { appendChild } from '../module/dom/change_node';
import { addClass } from '../module/dom/class';
import * as styles from '../../css/bangumi.module.scss';
import { loading } from '../module/text/ui';

export const enum SharedElement {
    CONTENT_CONTAINER,
    MEDIA_HOLDER,
}
let sharedElements: { [key in SharedElement]: HTMLElement } | null = null;
export let errorMessageElement: HTMLElement | null = null;

export function initializeSharedVars() {
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
