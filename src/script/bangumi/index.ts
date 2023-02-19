// JavaScript Document
import 'core-js';
import {
    TOP_URL,
} from '../module/env/constant';
import {
    sendServerRequest,
    getURLParam,
    clearCookies,
} from '../module/main';
import {
    w,
    addEventListener,
    getBaseURL,
    redirect,
} from '../module/dom';
import { show as showMessage } from '../module/message';
import { moduleImportError } from '../module/message/template/param';
import { invalidResponse } from '../module/message/template/param/server';
import * as BangumiInfo from '../module/type/BangumiInfo';
import { getLogoutParam, getFormatIndex } from './helper';
import { default as getImportPromises } from './get_import_promises';
import type { default as updatePageType } from './update_page';

addEventListener(w, 'load', function () {
    if (!getBaseURL().startsWith(TOP_URL + '/bangumi/')) {
        redirect(TOP_URL, true);
        return;
    }

    clearCookies();

    // Parse parameters
    const seriesIDParam = getSeriesID();
    if (seriesIDParam === null || !/^[a-zA-Z0-9~_-]{8,}$/.test(seriesIDParam)) {
        redirect(TOP_URL, true);
        return;
    }
    const seriesID = seriesIDParam;

    // Preload modules
    const importPromises = getImportPromises();

    // Parse other parameters
    const epIndexParam = getURLParam('ep');
    let epIndex: number;
    if (epIndexParam === null) {
        epIndex = 0;
    } else {
        epIndex = parseInt(epIndexParam);
        if (isNaN(epIndex) || epIndex < 1) {
            epIndex = 0;
        } else {
            epIndex--;
        }
    }

    //send requests
    sendServerRequest('get_ep.php', {
        callback: async function (response: string) {
            let parsedResponse: BangumiInfo.BangumiInfo;
            try {
                parsedResponse = JSON.parse(response);
                BangumiInfo.check(parsedResponse);
            } catch (e) {
                showMessage(invalidResponse);
                return;
            }

            let updatePage: typeof updatePageType;
            try {
                updatePage = (await importPromises.updatePage).default;
            } catch (e) {
                showMessage(moduleImportError(e));
                throw e;
            }
            updatePage(
                parsedResponse,
                seriesID,
                epIndex,
                importPromises.video,
                importPromises.audio,
                importPromises.image,
                importPromises.nativePlayer,
                importPromises.hlsPlayer,
                importPromises.videojsPlayer,
                importPromises.lazyload
            );
        },
        content: 'series=' + seriesID + '&ep=' + epIndex + '&format=' + getFormatIndex(),
        logoutParam: getLogoutParam(seriesID, epIndex)
    });
});

function getSeriesID(): string | null {
    const start = (TOP_URL + '/bangumi/').length;
    return getBaseURL().substring(start);
}