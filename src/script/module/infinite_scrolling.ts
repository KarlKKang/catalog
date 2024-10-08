import { d } from './dom/document';
import { html } from './dom/html';
import { w } from './dom/window';
import { addClass } from './dom/class/add';
import { addEventListener } from './event_listener/add';
import { positionDetector as positionDetectorClass } from '../../css/position_detector.module.scss';
import { max } from './math';

export const enum InfiniteScrollingProp {
    UPDATE_POSITION,
    SET_ENABLED,
}

export function initializeInfiniteScrolling(positionDetector: HTMLElement, listener: () => void, offset?: number) {
    addClass(positionDetector, positionDetectorClass);
    let isEnabled = false;

    const updatePosition = () => {
        if (!isEnabled) {
            return;
        }

        const boundingRect = positionDetector.getBoundingClientRect();
        const viewportHeight = max(html.clientHeight || 0, w.innerHeight || 0);

        if (boundingRect.top + (offset ?? 0) <= viewportHeight * 1.5) {
            isEnabled = false;
            listener();
        }
    };

    addEventListener(d, 'scroll', updatePosition);
    addEventListener(w, 'resize', updatePosition);

    return {
        [InfiniteScrollingProp.UPDATE_POSITION]: updatePosition,
        [InfiniteScrollingProp.SET_ENABLED]: function (enabled: boolean) {
            isEnabled = enabled;
        },
    };
}
