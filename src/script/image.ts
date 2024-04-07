import {
    TOP_URL,
} from './module/env/constant';
import {
    SessionTypes,
    removeRightClick,
} from './module/common';
import { ServerRequestOptionProp, sendServerRequest, setUpSessionAuthentication } from './module/server';
import {
    setTitle,
    getSessionStorage,
    clearSessionStorage,
    w,
    createDivElement,
    addClass,
    appendChild,
    body,
} from './module/dom';
import { showMessage } from './module/message';
import { invalidResponse, notFound } from './module/server/message';
import { encodeCFURIComponent } from './module/common/pure';
import { redirect, type ShowPageFunc } from './module/global';
import { setWidth } from './module/style';
import { CSS_UNIT } from './module/style/value';
import * as styles from '../css/image.module.scss';
import { imageLoader, offload as offloadImageLoader } from './module/image_loader';

export default function (showPage: ShowPageFunc) {
    const baseURL = getSessionStorage('base-url');
    const fileName = getSessionStorage('file-name');
    const title = getSessionStorage('title');
    const sessionCredential = getSessionStorage('session-credential');
    const sessionType = getSessionStorage('session-type');

    clearSessionStorage();

    if (baseURL === null || fileName === null || title === null || sessionCredential === null || sessionType === null) {
        redirect(TOP_URL, true);
        return;
    }

    const uri = sessionType === SessionTypes.MEDIA ? 'get_image' : 'get_news_image';
    setUpSessionAuthentication(sessionCredential);

    setTitle(title);

    sendServerRequest(uri, {
        [ServerRequestOptionProp.CALLBACK]: function (response: string) {
            if (response !== 'APPROVED') {
                showMessage(invalidResponse());
                return;
            }
            showPage();

            const flexContainer = createDivElement();
            addClass(flexContainer, styles.flexContainer);
            const container = createDivElement();
            addClass(container, styles.imageContainer);
            const overlay = createDivElement();
            addClass(overlay, styles.overlay);
            appendChild(container, overlay);
            appendChild(flexContainer, container);
            appendChild(body, flexContainer);
            removeRightClick(container);

            imageLoader(container, baseURL + encodeCFURIComponent(fileName), fileName, true, (canvas) => {
                setWidth(canvas, canvas.width / w.devicePixelRatio, CSS_UNIT.PX);
                // We won't listen to DPI change since we want to allow the user to zoom in and out.
                // This has the side effect of not updating the image size when the screen DPI actually changes.
            }, undefined, () => {
                showMessage(notFound);
            });
        },
        [ServerRequestOptionProp.CONTENT]: sessionCredential,
        [ServerRequestOptionProp.SHOW_SESSION_ENDED_MESSAGE]: true,
    });
}

export function offload() {
    offloadImageLoader();
}