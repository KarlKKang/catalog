import {
    TOP_URL,
} from './module/env/constant';
import {
    sendServerRequest,
    removeRightClick,
} from './module/common';
import {
    setTitle,
    getById,
    getSessionStorage,
    clearSessionStorage,
} from './module/dom';
import { show as showMessage } from './module/message';
import { moduleImportError } from './module/message/template/param';
import { invalidResponse } from './module/message/template/param/server';
import { encodeCFURIComponent } from './module/common/pure';
import { addInterval } from './module/timer';
import type { ShowPageFunc } from './module/type/ShowPageFunc';
import { pgid, redirect } from './module/global';

type ImageLoader = typeof import(
    /* webpackExports: ["clearAllImageEvents"] */
    './module/image_loader'
);
let imageLoader: ImageLoader | null = null;

export default function (showPage: ShowPageFunc) {
    const baseURL = getSessionStorage('base-url');
    const fileName = getSessionStorage('file-name');
    const xhrParam = getSessionStorage('xhr-param');
    const title = getSessionStorage('title');
    const mediaSessionCredential = getSessionStorage('media-session-credential');

    clearSessionStorage();

    if (baseURL === null || fileName === null || xhrParam === null || title === null) {
        redirect(TOP_URL, true);
        return;
    }

    const imageLoaderImportPromise = import(
        /* webpackExports: ["default"] */
        './module/image_loader'
    );

    let uri = 'get_image';
    let content = xhrParam;
    if (mediaSessionCredential === null) {
        uri = 'get_news_image';
    } else {
        content = mediaSessionCredential + '&' + content;
        addInterval(() => {
            sendServerRequest('authenticate_media_session', {
                callback: function (response: string) {
                    if (response != 'APPROVED') {
                        showMessage(invalidResponse());
                    }
                },
                content: mediaSessionCredential,
                connectionErrorRetry: 5,
                showSessionEndedMessage: true,
            });
        }, 40 * 1000);
    }

    setTitle(title);

    sendServerRequest(uri, {
        callback: function (response: string) {
            if (response !== 'APPROVED') {
                showMessage(invalidResponse());
                return;
            }
            showPage(() => {
                const container = getById('image-container');
                removeRightClick(container);
                const currentPgid = pgid;
                imageLoaderImportPromise.then((imageLoaderModule) => {
                    if (currentPgid !== pgid) {
                        return;
                    }
                    imageLoader = imageLoaderModule;
                    imageLoader.default(container, baseURL + encodeCFURIComponent(fileName), fileName, true);
                }).catch((e) => {
                    if (currentPgid !== pgid) {
                        showMessage(moduleImportError(e));
                    }
                    throw e;
                });
            });
        },
        content: content,
        showSessionEndedMessage: true,
    });
}

export function offload() {
    imageLoader?.clearAllImageEvents();
    imageLoader = null;
}