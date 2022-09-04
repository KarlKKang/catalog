// JavaScript Document
import {
    w,
    addEventListener,
    getById,
    d,
} from './DOM';

let positionDetector: HTMLElement;
let callback: () => void;
let isEnabled = false;
let _offset = 0;

export default function (listener: () => void, offset?: number) {
    positionDetector = getById('position-detector');
    callback = listener;
    if (offset !== undefined) {
        _offset = offset;
    }

    addEventListener(d, 'scroll', updatePosition);
    addEventListener(w, 'resize', updatePosition);

    return {
        updatePosition: updatePosition,
        setEnabled: setEnabled
    };
}

function updatePosition() {
    if (!isEnabled) {
        return;
    }

    const boundingRect = positionDetector.getBoundingClientRect();
    const viewportHeight = Math.max(d.documentElement.clientHeight || 0, w.innerHeight || 0);

    console.log(boundingRect.top);
    if (boundingRect.top + _offset <= viewportHeight * 1.5) {
        isEnabled = false;
        callback();
    }
}

function setEnabled(enabled: boolean) {
    isEnabled = enabled;
}