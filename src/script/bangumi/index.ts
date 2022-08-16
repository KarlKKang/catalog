// JavaScript Document
import "core-js";
import {
    DEVELOPMENT,
    TOP_URL,
} from '../module/env/constant';
import {
    sendServerRequest,
    getURLParam,
    clearCookies,
    cssVarWrapper,
} from '../module/main';
import {
    w,
    addEventListener,
    getHref,
    redirect,
} from '../module/DOM';
import { show as showMessage } from '../module/message';
import { moduleImportError } from '../module/message/template/param';
import { invalidResponse } from '../module/message/template/param/server';
import { BangumiInfo } from '../module/type';
import { getLogoutParam, getFormatIndex } from './helper';

addEventListener(w, 'load', function () {
    cssVarWrapper();
    clearCookies();

    if (!getHref().startsWith(TOP_URL + '/bangumi/') && !DEVELOPMENT) {
        redirect(TOP_URL, true);
        return;
    }

    // Parse parameters
    const seriesIDParam = getSeriesID();
    if (seriesIDParam === null || !/^[a-zA-Z0-9~_-]{8,}$/.test(seriesIDParam)) {
        redirect(TOP_URL, true);
        return;
    }
    const seriesID = seriesIDParam;

    // Preload modules
    let updatePageImportPromise = import(
        /* webpackExports: ["default"] */
        './update_page'
    );
    let imageImportPromise = import(
        /* webpackExports: ["default"] */
        './image'
    );
    let videoImportPromise = import(
        /* webpackExports: ["default"] */
        './video'
    );
    let audioImportPromise = import(
        /* webpackExports: ["default"] */
        './audio'
    );

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
        callback: function (response: string) {
            let parsedResponse: any;
            try {
                parsedResponse = JSON.parse(response);
                BangumiInfo.check(parsedResponse);
            } catch (e) {
                showMessage(invalidResponse);
                return;
            }
            updatePageImportPromise.then(({ default: updatePage }) => {
                updatePage(
                    parsedResponse,
                    seriesID,
                    epIndex,
                    videoImportPromise,
                    audioImportPromise,
                    imageImportPromise
                );
            }).catch((e) => {
                showMessage(moduleImportError(e));
            });
        },
        content: 'series=' + seriesID + '&ep=' + epIndex + '&format=' + getFormatIndex(),
        logoutParam: getLogoutParam(seriesID, epIndex)
    });
});

function getSeriesID(): string | null {
    if (DEVELOPMENT) {
        return getURLParam('series');
    } else {
        const url = getHref() + '?';
        const start = (TOP_URL + '/bangumi/').length;
        const end = url.indexOf('?');
        return url.slice(start, end);
    }
}