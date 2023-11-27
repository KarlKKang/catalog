import { getById } from '../module/dom';

let sharedElementVars: HTMLElement[] = [];

const enum SharedElementVarsIdx {
    contentContainer,
    mediaHolder,
}

export const SHARED_VAR_IDX_CONTENT_CONTAINER = SharedElementVarsIdx.contentContainer;
export const SHARED_VAR_IDX_MEDIA_HOLDER = SharedElementVarsIdx.mediaHolder;

export function initializeSharedVars() {
    sharedElementVars = [
        getById('content'),
        getById('media-holder'),
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