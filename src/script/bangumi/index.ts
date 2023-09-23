// JavaScript Document
import {
    TOP_URL,
} from '../module/env/constant';
import {
    sendServerRequest,
    getURLParam,
} from '../module/common';
import {
    clearSessionStorage,
    getBaseURL,
} from '../module/dom';
import { show as showMessage } from '../module/message';
import { moduleImportError } from '../module/message/template/param';
import { invalidResponse } from '../module/message/template/param/server';
import * as BangumiInfo from '../module/type/BangumiInfo';
import { getLogoutParam, getFormatIndex } from './helper';
import { default as getImportPromises } from './get_import_promises';
import type { UpdatePageImportPromise } from './get_import_promises';
import type { ShowPageFunc } from '../module/type/ShowPageFunc';
import type { RedirectFunc } from '../module/type/RedirectFunc';

let updatePageModule: Awaited<UpdatePageImportPromise> | null = null;

export default function (showPage: ShowPageFunc, redirect: RedirectFunc) {
    clearSessionStorage();

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
    sendServerRequest(redirect, 'get_ep', {
        callback: async function (response: string) {
            let parsedResponse: BangumiInfo.BangumiInfo;
            try {
                parsedResponse = JSON.parse(response);
                BangumiInfo.check(parsedResponse);
            } catch (e) {
                showMessage(redirect, invalidResponse);
                return;
            }

            let updatePage: Awaited<UpdatePageImportPromise>;
            try {
                updatePageModule = await importPromises.updatePage;
                updatePage = updatePageModule;
            } catch (e) {
                showMessage(redirect, moduleImportError(e));
                throw e;
            }

            showPage(() => {
                updatePage.reload();
                updatePage.default(
                    redirect,
                    parsedResponse,
                    seriesID,
                    epIndex,
                    importPromises.video,
                    importPromises.audio,
                    importPromises.image,
                    importPromises.nativePlayer,
                    importPromises.hlsPlayer,
                    importPromises.videojsPlayer,
                    importPromises.lazyload,
                    importPromises.imageLoader,
                );
            });
        },
        content: 'series=' + seriesID + '&ep=' + epIndex + '&format=' + getFormatIndex(),
        logoutParam: getLogoutParam(seriesID, epIndex)
    });
}

function getSeriesID(): string | null {
    const start = (TOP_URL + '/bangumi/').length;
    return getBaseURL().substring(start);
}

export function offload() {
    updatePageModule?.offload();
}