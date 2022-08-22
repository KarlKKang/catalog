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

export default function (listener: () => void) {
    positionDetector = getById('position-detector');
    callback = listener;

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

    if (boundingRect.top - 256 - 24 <= viewportHeight * 1.5 && isEnabled) {
        isEnabled = false;
        callback();
    }
}

function setEnabled(enabled: boolean) {
    isEnabled = enabled;
}