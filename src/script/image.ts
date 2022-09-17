// JavaScript Document
import "core-js";
import {
    DEVELOPMENT,
    TOP_URL,
} from './module/env/constant';
import {
    sendServerRequest,
    concatenateSignedURL,
    clearCookies,
    removeRightClick,
    encodeCFURIComponent,
} from './module/main';
import {
    w,
    addEventListener,
    getHref,
    redirect,
    getCookie,
    deleteCookie,
    setTitle,
    getById,
} from './module/DOM';
import { show as showMessage } from './module/message';
import { moduleImportError } from './module/message/template/param';
import { invalidResponse } from './module/message/template/param/server';
import * as LocalImageParam from './module/type/LocalImageParam';
import * as CDNCredentials from './module/type/CDNCredentials';

addEventListener(w, 'load', function () {
    if (getHref() !== TOP_URL + '/image' && !DEVELOPMENT) {
        redirect(TOP_URL + '/image', true);
        return;
    }

    clearCookies();

    let paramCookie = getCookie('local-image-param');

    if (paramCookie === null) {
        redirect(TOP_URL, true);
        return;
    }

    deleteCookie('local-image-param');

    let param: LocalImageParam.LocalImageParam;
    try {
        paramCookie = decodeURIComponent(paramCookie);
        param = JSON.parse(paramCookie);
        LocalImageParam.check(param);
    } catch (e) {
        redirect(TOP_URL, true);
        return;
    }

    const imageLoaderImportPromise = import(
        /* webpackExports: ["default"] */
        './module/image_loader'
    );

    setInterval(function () {
        sendServerRequest('device_authenticate.php', {
            callback: function (response: string) {
                if (response != 'APPROVED') {
                    showMessage();
                }
            },
            content: "token=" + param.authenticationToken
        });
    }, 60 * 1000);

    setTitle(param.title);

    const container = getById('image-container');

    removeRightClick(container);

    sendServerRequest('get_image.php', {
        callback: function (response: string) {
            let parsedResponse: CDNCredentials.CDNCredentials;
            try {
                parsedResponse = JSON.parse(response);
                CDNCredentials.check(parsedResponse);
            } catch (e) {
                showMessage(invalidResponse);
                return;
            }
            const credentials = parsedResponse;
            const url = concatenateSignedURL(param.baseURL + encodeCFURIComponent(param.fileName), credentials);

            imageLoaderImportPromise.then(({ default: imageLoader }) => {
                imageLoader(container, url, param.fileName);
            }).catch((e) => {
                showMessage(moduleImportError(e));
            });
        },
        content: "token=" + param.authenticationToken + '&p=' + param.xhrParam
    });
});