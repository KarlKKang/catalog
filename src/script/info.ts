// JavaScript Document
import "core-js";
import {
    DEVELOPMENT,
} from './module/env/constant';
import {
    navListeners,
    sendServerRequest,
    clearCookies,
    cssVarWrapper,
} from './module/main';
import {
    w,
    addEventListener,
    getHref,
    redirect,
    getById,
    removeClass,
    getBody,
    getHash,
    getByIdNative
} from './module/DOM';
import { show as showMessage } from './module/message';
import { invalidResponse } from './module/message/template/param/server';

addEventListener(w, 'load', function () {
    cssVarWrapper();
    clearCookies();

    if (!getHref().startsWith('https://featherine.com/info') && !DEVELOPMENT) {
        redirect('https://featherine.com/info', true);
        return;
    }

    sendServerRequest('get_info.php', {
        callback: function (response: string) {
            if (response.startsWith('INFOBODY:') && response.endsWith('EOF')) {
                getById('content').innerHTML = response.slice(9, -3);
                navListeners();
                removeClass(getBody(), "hidden");
                var scrollID = getHash();
                if (scrollID != '') {
                    var elem = getByIdNative(scrollID);
                    if (elem !== null) {
                        elem.scrollIntoView({
                            behavior: 'smooth'
                        });
                    }
                }
            } else {
                showMessage(invalidResponse);
            }
        },
        method: 'GET'
    });
});
