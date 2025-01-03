import { removeRightClick } from '../module/dom/element/remove_right_click';
import { createStyledButtonElement } from '../module/dom/element/button/styled/create';
import { createDivElement } from '../module/dom/element/div/create';
import { appendChild } from '../module/dom/node/append_child';
import { addClass } from '../module/dom/class/add';
import { removeClass } from '../module/dom/class/remove';
import { body } from '../module/dom/body';
import { d } from '../module/dom/document';
import { w } from '../module/dom/window';
import { addEventListener } from '../module/event_listener/add';
import { showMessage } from '../module/message';
import { encodeCloudfrontURIComponent } from '../module/string/uri/cloudfront/encode_component';
import { setWidth } from '../module/style/width';
import { CSS_UNIT } from '../module/style/value/unit';
import * as styles from '../../css/image.module.scss';
import { imageLoader, offload as offloadImageLoader } from '../module/image/loader';
import { closeButtonText } from '../module/text/button/close';
import { type Timeout } from '../module/timer/type';
import { addTimeout } from '../module/timer/add/timeout';
import { addMouseTouchEventListener } from '../module/event_listener/add/mouse_touch_event';
import { getHighResTimestamp, type HighResTimestamp } from '../module/time/hi_res';
import { mediaLoadError } from '../module/message/param/media_load_error';
import { MessageParamKey } from '../module/message/type';
import { mediaIncompatibleSuffix } from '../module/text/media/incompatible_suffix';
import { addOffloadCallback } from '../module/global/offload';
import { removeTimeout } from '../module/timer/remove/timeout';
import { closeWindow } from '../module/dom/window/close';

export default function (baseURL: string, fileName: string, startTime: HighResTimestamp) {
    const container = createDivElement();
    addClass(container, styles.imageContainer);
    const overlay = createDivElement();
    addClass(overlay, styles.overlay);
    appendChild(container, overlay);
    appendChild(body, container);
    removeRightClick(container);

    addOffloadCallback(offloadImageLoader);
    loadImage(container, baseURL, fileName, startTime);

    const closeButton = createStyledButtonElement(closeButtonText);
    addClass(closeButton, styles.backButton);
    addEventListener(closeButton, 'click', () => {
        closeWindow();
    });
    appendChild(body, closeButton);

    let inactiveTimeout: Timeout | null = null;
    const setInactive = () => {
        addClass(closeButton, styles.inactive);
    };
    const setActive = () => {
        removeClass(closeButton, styles.inactive);
        inactiveTimeout = addTimeout(() => {
            inactiveTimeout = null;
            setInactive();
        }, 3000);
    };
    const cleanupAndSetActive = () => {
        if (inactiveTimeout !== null) {
            removeTimeout(inactiveTimeout);
        }
        setActive();
    };
    setActive();
    addMouseTouchEventListener(
        d,
        (isMouseClick) => {
            if (isMouseClick) {
                cleanupAndSetActive();
            } else {
                if (inactiveTimeout !== null) {
                    removeTimeout(inactiveTimeout);
                    inactiveTimeout = null;
                    setInactive();
                } else {
                    setActive();
                }
            }
        },
        cleanupAndSetActive,
    );
}

function loadImage(container: HTMLElement, baseURL: string, fileName: string, startTime: HighResTimestamp, retryCount = 3, retryTimeout = 500) {
    const errorMessage = mediaLoadError(null);
    if (getHighResTimestamp() - startTime >= 30000) {
        showMessage(errorMessage);
        return;
    }
    imageLoader(
        container,
        baseURL + encodeCloudfrontURIComponent(fileName),
        fileName,
        true,
        (canvas) => {
            setWidth(canvas, canvas.width / w.devicePixelRatio, CSS_UNIT.PX);
            // We won't listen to DPI change since we want to allow the user to zoom in and out.
            // This has the side effect of not updating the image size when the screen DPI actually changes.
        },
        undefined,
        () => {
            retryCount--;
            if (retryCount < 0) {
                showMessage(errorMessage);
                return;
            }
            addTimeout(() => {
                loadImage(container, baseURL, fileName, startTime, retryCount, retryTimeout * 2);
            }, retryTimeout);
        },
        () => {
            showMessage({
                [MessageParamKey.TITLE]: '画像を表示できません',
                [MessageParamKey.MESSAGE]: mediaIncompatibleSuffix,
                [MessageParamKey.BUTTON]: null,
            });
        },
    );
}
