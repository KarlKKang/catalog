import { addEventListener } from '.';
import { addTimeout } from '../timer';

export function addMouseTouchEventListener(elem: EventTarget, onClickCallback: (isMouseClick: boolean) => void, onMouseMoveCallback: () => void) {
    let touchClick = 0;
    addEventListener(elem, 'touchend', () => {
        touchClick++;
        addTimeout(() => {
            touchClick--;
        }, 300); // https://web.dev/mobile-touchandmouse/
    });
    addEventListener(elem, 'click', () => {
        onClickCallback(touchClick === 0);
    });
    addEventListener(elem, 'mousemove', () => {
        if (touchClick === 0) {
            onMouseMoveCallback();
        }
    }, { passive: true });
}
