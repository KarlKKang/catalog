import {
    TOP_URL,
} from '../module/env/constant';
import {
    getURLParam,
} from '../module/common';
import { ServerRequestOptionProp, sendServerRequest, setUpSessionAuthentication } from '../module/server';
import {
    clearSessionStorage,
    getBaseURL,
} from '../module/dom';
import { showMessage } from '../module/message';
import { moduleImportError } from '../module/message/param';
import { invalidResponse, notFound } from '../module/server/message';
import * as BangumiInfo from '../module/type/BangumiInfo';
import { getLogoutParam } from './helper';
import { importAll } from './import_promise';
import type { ShowPageFunc } from '../module/type/ShowPageFunc';
import * as MediaSessionInfo from '../module/type/MediaSessionInfo';
import { pgid, redirect } from '../module/global';
import { addNavBar } from '../module/nav_bar';
import { addTimeout } from '../module/timer';

let updatePageModule: Awaited<typeof import(
    './update_page'
)> | null = null;

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
    let createMediaSessionPromise: Promise<MediaSessionInfo.MediaSessionInfo> | null = null;
    const createMediaSession = () => {
        importAll();
        return new Promise<MediaSessionInfo.MediaSessionInfo>((resolve) => {
            sendServerRequest('create_media_session', {
                [ServerRequestOptionProp.CALLBACK]: function (response: string) {
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
                [ServerRequestOptionProp.CONTENT]: 'series=' + seriesID + '&ep=' + epIndex,
                [ServerRequestOptionProp.LOGOUT_PARAM]: getLogoutParam(seriesID, epIndex)
            });
        });
    };
    addTimeout(() => {
        if (createMediaSessionPromise === null) {
            createMediaSessionPromise = createMediaSession();
        }
    }, 1000);

    const updatePageImportPromise = import(
        /* webpackExports: ["default", "offload"] */
        './update_page'
    );

    sendServerRequest('get_ep?series=' + seriesID + '&ep=' + epIndex, {
        [ServerRequestOptionProp.CALLBACK]: async function (response: string) {
            let parsedResponse: BangumiInfo.BangumiInfo;
            try {
                parsedResponse = JSON.parse(response);
                BangumiInfo.check(parsedResponse);
            } catch (e) {
                showMessage(invalidResponse());
                return;
            }

            const currentPgid = pgid;
            if (createMediaSessionPromise === null) {
                createMediaSessionPromise = createMediaSession();
            }
            createMediaSessionPromise.then((mediaSessionInfo) => {
                if (currentPgid !== pgid) {
                    return;
                }
                if (mediaSessionInfo.type !== parsedResponse.ep_info.type) {
                    showMessage(notFound);
                }
            });

            if (updatePageModule === null) {
                try {
                    updatePageModule = await updatePageImportPromise;
                } catch (e) {
                    if (currentPgid === pgid) {
                        showMessage(moduleImportError(e));
                    }
                    throw e;
                }
            }

            showPage();
            updatePageModule.default(
                parsedResponse,
                seriesID,
                epIndex,
                createMediaSessionPromise,
            );
        },
        [ServerRequestOptionProp.LOGOUT_PARAM]: getLogoutParam(seriesID, epIndex),
        [ServerRequestOptionProp.METHOD]: 'GET',
    });
}

function getSeriesID(): string | null {
    const start = (TOP_URL + '/bangumi/').length;
    return getBaseURL().substring(start);
}

export function offload() {
    updatePageModule?.offload();
}