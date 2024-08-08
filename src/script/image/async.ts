import {
    removeRightClick,
} from '../module/media_helper';
import { createButtonElement, createDivElement } from '../module/dom/create_element';
import { appendChild } from '../module/dom/change_node';
import { addClass, removeClass } from '../module/dom/class';
import { body } from '../module/dom/body';
import { d, w } from '../module/dom/document';
import { addEventListener } from '../module/event_listener';
import { showMessage } from '../module/message';
import { notFound } from '../module/server/message';
import { encodeCFURIComponent } from '../module/http_form';
import { setWidth } from '../module/style';
import { CSS_UNIT } from '../module/style/value';
import * as styles from '../../css/image.module.scss';
import { imageLoader, offload as offloadImageLoader } from '../module/image_loader';
import { closeButtonText } from '../module/text/ui';
import { addTimeout, type Timeout } from '../module/timer';
import { addMouseTouchEventListener } from '../module/event_listener/mouse_touch_event';

export default function (baseURL: string, fileName: string) {
    const container = createDivElement();
    addClass(container, styles.imageContainer);
    const overlay = createDivElement();
    addClass(overlay, styles.overlay);
    appendChild(container, overlay);
    appendChild(body, container);
    removeRightClick(container);

    imageLoader(container, baseURL + encodeCFURIComponent(fileName), fileName, true, (canvas) => {
        setWidth(canvas, canvas.width / w.devicePixelRatio, CSS_UNIT.PX);
        // We won't listen to DPI change since we want to allow the user to zoom in and out.
        // This has the side effect of not updating the image size when the screen DPI actually changes.
    }, undefined, () => {
        showMessage(notFound);
    });

    const closeButton = createButtonElement(closeButtonText);
    addClass(closeButton, styles.backButton);
    addEventListener(closeButton, 'click', () => {
        w.close();
    });
    appendChild(body, closeButton);

    let inactiveTimeout: Timeout | null = null;
    const setInactive = () => {
        inactiveTimeout = null;
        addClass(closeButton, styles.inactive);
    };
    const setActive = () => {
        removeClass(closeButton, styles.inactive);
        const currentTimeout = addTimeout(() => {
            if (inactiveTimeout === currentTimeout) {
                setInactive();
            }
        }, 3000);
        inactiveTimeout = currentTimeout;
    };
    setActive();
    addMouseTouchEventListener(
        d,
        (isMouseClick) => {
            if (isMouseClick) {
                setActive();
            } else {
                if (inactiveTimeout !== null) {
                    setInactive();
                } else {
                    setActive();
                }
            }
        },
        () => {
            setActive();
        },
    );
}

export function offload() {
    offloadImageLoader();
}
