import {
    w,
    addEventListener,
    d,
    html,
    addClass,
} from './dom';
import { positionDetector as positionDetectorClass } from '../../css/position_detector.module.scss';

let instance: {
    updatePosition: () => void;
    setEnabled: (enabled: boolean) => void;
} | null = null;

export function initializeInfiniteScrolling(positionDetector: HTMLElement, listener: () => void, offset?: number) {
    if (instance !== null) {
        throw new Error('Instance already initialized.');
    }

    addClass(positionDetector, positionDetectorClass);
    let isEnabled = false;

    const updatePosition = () => {
        if (!isEnabled) {
            return;
        }

        const boundingRect = positionDetector.getBoundingClientRect();
        const viewportHeight = Math.max(html.clientHeight || 0, w.innerHeight || 0);

        if (boundingRect.top + (offset ?? 0) <= viewportHeight * 1.5) {
            isEnabled = false;
            listener();
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
}

export function getInfiniteScrolling() {
    if (instance === null) {
        throw new Error('Instance not initialized');
    }
    return instance;
}

export function destroy() {
    instance = null;
}