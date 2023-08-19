// JavaScript Document
import {
    w,
    addEventListener,
    getById,
    d,
} from './dom';

let instance: {
    updatePosition: () => void;
    setEnabled: (enabled: boolean) => void;
} | null = null;

export default function (listener: () => void, offset?: number) {
    if (instance !== null) {
        return instance;
    }

    const positionDetector = getById('position-detector');
    const callback = listener;
    let isEnabled = false;

    const updatePosition = function () {
        if (!isEnabled) {
            return;
        }

        const boundingRect = positionDetector.getBoundingClientRect();
        const viewportHeight = Math.max(d.documentElement.clientHeight || 0, w.innerHeight || 0);

        if (boundingRect.top + (offset ?? 0) <= viewportHeight * 1.5) {
            isEnabled = false;
            callback();
        }
    };

    addEventListener(d, 'scroll', updatePosition);
    addEventListener(w, 'resize', updatePosition);

    instance = {
        updatePosition: updatePosition,
        setEnabled: function (enabled: boolean) {
            isEnabled = enabled;
        }
    };

    return instance;
}