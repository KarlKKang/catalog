import {
    TOP_URL,
} from './module/env/constant';
import {
    SessionTypes,
    removeRightClick,
} from './module/common';
import { sendServerRequest, setUpSessionAuthentication } from './module/server';
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
import { moduleImportError } from './module/message/param';
import { invalidResponse, notFound } from './module/server/message';
import { encodeCFURIComponent } from './module/common/pure';
import type { ShowPageFunc } from './module/type/ShowPageFunc';
import { pgid, redirect } from './module/global';
import { setWidth } from './module/style';
import { CSS_UNIT } from './module/style/value';

import * as styles from '../css/image.module.scss';

type ImageLoader = typeof import(
    /* webpackExports: ["clearAllImageEvents"] */
    './module/image_loader'
);
let imageLoader: ImageLoader | null = null;

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

    const imageLoaderImportPromise = import(
        /* webpackExports: ["default"] */
        './module/image_loader'
    );

    const uri = sessionType === SessionTypes.MEDIA ? 'get_image' : 'get_news_image';
    setUpSessionAuthentication(sessionCredential);

    setTitle(title);

    sendServerRequest(uri, {
        callback: function (response: string) {
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
            const currentPgid = pgid;
            imageLoaderImportPromise.then((imageLoaderModule) => {
                if (currentPgid !== pgid) {
                    return;
                }
                imageLoader = imageLoaderModule;
                imageLoader.default(container, baseURL + encodeCFURIComponent(fileName), fileName, true, (canvas) => {
                    setWidth(canvas, canvas.width / w.devicePixelRatio, CSS_UNIT.PX);
                    // We won't listen to DPI change since we want to allow the user to zoom in and out.
                    // This has the side effect of not updating the image size when the screen DPI actually changes.
                }, undefined, () => {
                    showMessage(notFound);
                });
            }).catch((e) => {
                if (currentPgid !== pgid) {
                    showMessage(moduleImportError(e));
                }
                throw e;
            });
        },
        content: sessionCredential,
        showSessionEndedMessage: true,
    });
}

export function offload() {
    imageLoader?.clearAllImageEvents();
    imageLoader = null;
}