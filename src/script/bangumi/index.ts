import {
    TOP_URL,
} from '../module/env/constant';
import {
    getURLParam,
} from '../module/common';
import { sendServerRequest, setUpSessionAuthentication } from '../module/server';
import {
    clearSessionStorage,
    getBaseURL,
} from '../module/dom';
import { showMessage } from '../module/message';
import { moduleImportError } from '../module/message/param';
import { invalidResponse, notFound } from '../module/server/message';
import * as BangumiInfo from '../module/type/BangumiInfo';
import { getLogoutParam } from './helper';
import { importAll, updatePageImportPromise } from './import_promise';
import type { ShowPageFunc } from '../module/type/ShowPageFunc';
import * as MediaSessionInfo from '../module/type/MediaSessionInfo';
import { pgid, redirect } from '../module/global';
import { addNavBar } from '../module/nav_bar';

let updatePageModule: Awaited<typeof updatePageImportPromise> | null = null;

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();

    // Parse parameters
    const seriesIDParam = getSeriesID();
    if (seriesIDParam === null || !/^[a-zA-Z0-9~_-]{8,}$/.test(seriesIDParam)) {
        redirect(TOP_URL, true);
        return;
    }
    const seriesID = seriesIDParam;

    // Preload modules
    addNavBar();
    importAll();

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
    const createMediaSessionPromise = new Promise<MediaSessionInfo.MediaSessionInfo>((resolve) => {
        sendServerRequest('create_media_session', {
            callback: function (response: string) {
                let parsedResponse: MediaSessionInfo.MediaSessionInfo;
                try {
                    parsedResponse = JSON.parse(response);
                    MediaSessionInfo.check(parsedResponse);
                } catch (e) {
                    showMessage(invalidResponse());
                    return;
                }
                setUpSessionAuthentication(parsedResponse.credential, getLogoutParam(seriesID, epIndex));
                resolve(parsedResponse);
            },
            content: 'series=' + seriesID + '&ep=' + epIndex,
            logoutParam: getLogoutParam(seriesID, epIndex)
        });
    });

    sendServerRequest('get_ep?series=' + seriesID + '&ep=' + epIndex, {
        callback: async function (response: string) {
            let parsedResponse: BangumiInfo.BangumiInfo;
            try {
                parsedResponse = JSON.parse(response);
                BangumiInfo.check(parsedResponse);
            } catch (e) {
                showMessage(invalidResponse());
                return;
            }

            const currentPgid = pgid;
            createMediaSessionPromise.then((mediaSessionInfo) => {
                if (currentPgid !== pgid) {
                    return;
                }
                if (mediaSessionInfo.type !== parsedResponse.ep_info.type) {
                    showMessage(notFound);
                }
            });

            let updatePage: Awaited<typeof updatePageImportPromise>;
            try {
                updatePageModule = await updatePageImportPromise;
                updatePage = updatePageModule;
            } catch (e) {
                if (currentPgid === pgid) {
                    showMessage(moduleImportError(e));
                }
                throw e;
            }

            showPage();
            updatePage.default(
                parsedResponse,
                seriesID,
                epIndex,
                createMediaSessionPromise,
            );
        },
        logoutParam: getLogoutParam(seriesID, epIndex),
        method: 'GET',
    });
}

function getSeriesID(): string | null {
    const start = (TOP_URL + '/bangumi/').length;
    return getBaseURL().substring(start);
}

export function offload() {
    updatePageModule?.offload();
}