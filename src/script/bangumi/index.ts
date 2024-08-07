import { ServerRequestOptionProp, parseResponse, sendServerRequest, setUpSessionAuthentication } from '../module/server';
import { clearSessionStorage, getSearchParam, getURI } from '../module/dom/document';
import { showMessage } from '../module/message';
import { notFound } from '../module/server/message';
import { getLogoutParam } from './helper';
import { importAllPageModules } from './page_import_promise';
import { pgid, redirect, type ShowPageFunc } from '../module/global';
import { addNavBar } from '../module/nav_bar';
import { addTimeout } from '../module/timer';
import { type MediaSessionInfo, MediaSessionInfoKey, parseMediaSessionInfo } from '../module/type/MediaSessionInfo';
import { BangumiInfoKey, EPInfoKey, parseBangumiInfo } from '../module/type/BangumiInfo';
import { importModule } from '../module/import_module';
import { BANGUMI_ROOT_URI, TOP_URI } from '../module/env/uri';
import { importAllMediaModules } from './media_import_promise';

let offloadModule: (() => void) | null = null;

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();

    // Parse parameters
    const seriesIDParam = getSeriesID();
    if (seriesIDParam === null || !/^[a-zA-Z0-9~_-]{8,}$/.test(seriesIDParam)) {
        redirect(TOP_URI, true);
        return;
    }
    const seriesID = seriesIDParam;

    // Preload modules
    addNavBar();

    // Parse other parameters
    const epIndexParam = getSearchParam('ep');
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
    let createMediaSessionPromise: Promise<MediaSessionInfo> | null = null;
    const createMediaSession = () => {
        importAllPageModules();
        importAllMediaModules();
        return new Promise<MediaSessionInfo>((resolve) => {
            sendServerRequest('create_media_session', {
                [ServerRequestOptionProp.CALLBACK]: function (response: string) {
                    const parsedResponse = parseResponse(response, parseMediaSessionInfo);
                    setUpSessionAuthentication(parsedResponse[MediaSessionInfoKey.CREDENTIAL], getLogoutParam(seriesID, epIndex));
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

    const asyncModulePromise = import(
        /* webpackExports: ["default", "offload"] */
        './async'
    );
    sendServerRequest('get_ep?series=' + seriesID + '&ep=' + epIndex, {
        [ServerRequestOptionProp.CALLBACK]: async function (response: string) {
            const parsedResponse = parseResponse(response, parseBangumiInfo);
            const currentPgid = pgid;
            if (createMediaSessionPromise === null) {
                createMediaSessionPromise = createMediaSession();
            }
            createMediaSessionPromise.then((mediaSessionInfo) => {
                if (currentPgid !== pgid) {
                    return;
                }
                if (mediaSessionInfo[MediaSessionInfoKey.TYPE] !== parsedResponse[BangumiInfoKey.EP_INFO][EPInfoKey.TYPE]) {
                    showMessage(notFound);
                }
            });

            const asyncModule = await importModule(asyncModulePromise);
            if (currentPgid !== pgid) {
                return;
            }
            offloadModule = asyncModule.offload;
            asyncModule.default(
                parsedResponse,
                seriesID,
                epIndex,
                createMediaSessionPromise,
            );
            showPage();
        },
        [ServerRequestOptionProp.LOGOUT_PARAM]: getLogoutParam(seriesID, epIndex),
        [ServerRequestOptionProp.METHOD]: 'GET',
    });
}

function getSeriesID(): string | null {
    return getURI().substring(BANGUMI_ROOT_URI.length);
}

export function offload() {
    if (offloadModule !== null) {
        offloadModule();
        offloadModule = null;
    }
}