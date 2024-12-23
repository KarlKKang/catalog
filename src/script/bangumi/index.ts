import { ServerRequestKey, ServerRequestOptionKey, sendServerRequest } from '../module/server/request';
import { setUpSessionAuthentication } from '../module/server/session_authentication';
import { parseResponse } from '../module/server/parse_response';
import { getURI } from '../module/dom/location/get/uri';
import { getSearchParam } from '../module/dom/location/get/search_param';
import { showMessage } from '../module/message';
import { notFound } from '../module/message/param/not_found';
import { getLogoutParam } from './helper';
import { importAllPageModules } from './page_import_promise';
import { type ShowPageFunc } from '../module/global/type';
import { redirect } from '../module/global/redirect';
import { pgid } from '../module/global/pgid';
import { addNavBar } from '../module/nav_bar';
import { addTimeout } from '../module/timer/add/timeout';
import { type MediaSessionInfo, MediaSessionInfoKey, parseMediaSessionInfo } from '../module/type/MediaSessionInfo';
import { EPInfoKey, FileInfoKey, parseEPInfo } from '../module/type/EPInfo';
import { importModule } from '../module/import_module';
import { BANGUMI_ROOT_URI, TOP_URI } from '../module/env/uri';
import { importAllMediaModules } from './media_import_promise';
import { buildHttpForm } from '../module/string/http_form/build';
import { removeTimeout } from '../module/timer/remove/timeout';

export default function (showPage: ShowPageFunc) {
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

    // send requests
    let createMediaSessionPromise: Promise<MediaSessionInfo> | null = null;
    const createMediaSession = () => {
        importAllPageModules();
        importAllMediaModules();
        return new Promise<MediaSessionInfo>((resolve) => {
            const serverRequest = sendServerRequest('create_media_session', {
                [ServerRequestOptionKey.CALLBACK]: function (response: string) {
                    const parsedResponse = parseResponse(response, parseMediaSessionInfo);
                    setUpSessionAuthentication(parsedResponse[MediaSessionInfoKey.CREDENTIAL], serverRequest[ServerRequestKey.REQUEST_START_TIME], getLogoutParam(seriesID, epIndex));
                    resolve(parsedResponse);
                },
                [ServerRequestOptionKey.CONTENT]: buildHttpForm({ series: seriesID, ep: epIndex }),
                [ServerRequestOptionKey.LOGOUT_PARAM]: getLogoutParam(seriesID, epIndex),
                [ServerRequestOptionKey.TIMEOUT]: 60000,
            });
        });
    };
    const createMediaSessionTimeout = addTimeout(() => {
        createMediaSessionPromise = createMediaSession();
    }, 1000);

    const asyncModulePromise = importModule(
        () => import(
            /* webpackExports: ["default"] */
            './async'
        ),
    );
    sendServerRequest('get_ep', {
        [ServerRequestOptionKey.CALLBACK]: async function (response: string) {
            const parsedResponse = parseResponse(response, parseEPInfo);
            const currentPgid = pgid;
            if (createMediaSessionPromise === null) {
                removeTimeout(createMediaSessionTimeout);
                createMediaSessionPromise = createMediaSession();
            }
            createMediaSessionPromise.then((mediaSessionInfo) => {
                if (currentPgid !== pgid) {
                    return;
                }
                if (mediaSessionInfo[MediaSessionInfoKey.TYPE] !== parsedResponse[EPInfoKey.FILE_INFO][FileInfoKey.TYPE]) {
                    showMessage(notFound);
                }
            });

            const asyncModule = await asyncModulePromise;
            if (currentPgid !== pgid) {
                return;
            }
            asyncModule.default(
                parsedResponse,
                seriesID,
                epIndex,
                createMediaSessionPromise,
            );
            showPage();
        },
        [ServerRequestOptionKey.CONTENT]: buildHttpForm({ series: seriesID, ep: epIndex }),
        [ServerRequestOptionKey.LOGOUT_PARAM]: getLogoutParam(seriesID, epIndex),
        [ServerRequestOptionKey.METHOD]: 'GET',
    });
}

function getSeriesID(): string | null {
    return getURI().substring(BANGUMI_ROOT_URI.length);
}
