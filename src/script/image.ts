// JavaScript Document
import {
    TOP_URL,
} from './module/env/constant';
import {
    sendServerRequest,
    removeRightClick,
    showPage,
} from './module/common';
import {
    redirect,
    setTitle,
    getById,
    getSessionStorage,
    clearSessionStorage,
} from './module/dom';
import { show as showMessage } from './module/message';
import { moduleImportError } from './module/message/template/param';
import { invalidResponse } from './module/message/template/param/server';
import { encodeCFURIComponent } from './module/common/pure';
import type { HTMLImport } from './module/type/HTMLImport';

export default function (styleImportPromises: Promise<any>[], htmlImportPromises: HTMLImport) {
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
        setInterval(() => {
            sendServerRequest('authenticate_media_session', {
                callback: function (response: string) {
                    if (response != 'APPROVED') {
                        showMessage(invalidResponse);
                    }
                },
                content: mediaSessionCredential,
                connectionErrorRetry: 5
            });
        }, 30 * 1000);
    }

    setTitle(title);

    sendServerRequest(uri, {
        callback: function (response: string) {
            if (response !== 'APPROVED') {
                showMessage(invalidResponse);
                return;
            }
            showPage(styleImportPromises, htmlImportPromises, () => {
                const container = getById('image-container');
                removeRightClick(container);

                imageLoaderImportPromise.then(({ default: imageLoader }) => {
                    imageLoader(container, baseURL + encodeCFURIComponent(fileName), fileName, true);
                }).catch((e) => {
                    showMessage(moduleImportError(e));
                });
            });
        },
        content: content
    });
}