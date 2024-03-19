import { appendChild, body, createDivElement, createParagraphElement, prependChild } from '../module/dom';

let sharedElementVars: HTMLElement[] = [];

const enum SharedElementVarsIdx {
    title,
    contentContainer,
    mediaHolder,
}

export const SHARED_VAR_IDX_TITLE = SharedElementVarsIdx.title;
export const SHARED_VAR_IDX_CONTENT_CONTAINER = SharedElementVarsIdx.contentContainer;
export const SHARED_VAR_IDX_MEDIA_HOLDER = SharedElementVarsIdx.mediaHolder;

export function initializeSharedVars() {
    const titleElem = createParagraphElement();
    titleElem.id = 'title';
    prependChild(body, titleElem);
    const content = createDivElement();
    content.id = 'content';
    const mediaHolder = createDivElement();
    mediaHolder.id = 'media-holder';
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