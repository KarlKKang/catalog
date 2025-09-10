import { APIRequestKey, APIRequestOptionKey, sendAPIRequest } from '../module/api/request';
import { setUpSessionAuthentication } from '../module/api/session_authentication';
import { parseResponse } from '../module/api/parse_response';
import { getURI } from '../module/dom/location/get/uri';
import { showMessage } from '../module/message';
import { notFound } from '../module/message/param/not_found';
import { importAllPageModules } from './page_import_promise';
import { type ShowPageFunc } from '../module/global/type';
import { redirectSameOrigin } from '../module/global/redirect';
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
import { setHistoryState } from '../module/dom/location/set/history_state';
import { getSearch } from '../module/dom/location/get/search';
import { getHash } from '../module/dom/location/get/hash';

export default function (showPage: ShowPageFunc) {
    // Parse parameters
    const [seriesID, epIndexParam] = splitURI();
    if (seriesID === '' && epIndexParam === null) {
        redirectSameOrigin(TOP_URI, true);
        return;
    }
    if (!/^[a-zA-Z0-9~_-]{8,}$/.test(seriesID)) {
        showMessage(notFound());
        return;
    }

    // Preload modules
    addNavBar();

    // Parse other parameters
    let epIndex: number;
    if (epIndexParam === '' || epIndexParam === null) {
        epIndex = 0;
        // Preserve full search and hash because some additional parameters may be needed later besides the format parameter.
        setHistoryState(BANGUMI_ROOT_URI + seriesID + '/1' + getSearch() + getHash(), true);
    } else {
        epIndex = parseInt(epIndexParam);
        if (epIndex.toString() !== epIndexParam) {
            showMessage(notFound());
            return;
        }
        if (epIndex > 0) {
            epIndex--;
        } else {
            showMessage(notFound());
            return;
        }
    }

    // send requests
    let createMediaSessionPromise: Promise<MediaSessionInfo> | null = null;
    const createMediaSession = () => {
        importAllPageModules();
        importAllMediaModules();
        return new Promise<MediaSessionInfo>((resolve) => {
            const serverRequest = sendAPIRequest('create_media_session', {
                [APIRequestOptionKey.CALLBACK]: function (response: string) {
                    const parsedResponse = parseResponse(response, parseMediaSessionInfo);
                    setUpSessionAuthentication(parsedResponse[MediaSessionInfoKey.CREDENTIAL], serverRequest[APIRequestKey.REQUEST_START_TIME]);
                    resolve(parsedResponse);
                },
                [APIRequestOptionKey.CONTENT]: buildHttpForm({ series: seriesID, ep: epIndex }),
                [APIRequestOptionKey.TIMEOUT]: 60000,
            });
        });
    };
    const createMediaSessionTimeout = addTimeout(() => {
        createMediaSessionPromise = createMediaSession();
    }, 1000);

    const asyncModulePromise = importModule(
        () => import(
            /* webpackExports: ["default"] */
            './async',
        ),
    );
    sendAPIRequest('get_ep', {
        [APIRequestOptionKey.CALLBACK]: async function (response: string) {
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
                    showMessage(notFound());
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
        [APIRequestOptionKey.CONTENT]: buildHttpForm({ series: seriesID, ep: epIndex }),
        [APIRequestOptionKey.METHOD]: 'GET',
    });
}

function splitURI(): [string, string | null] {
    const path = getURI().slice(BANGUMI_ROOT_URI.length);
    const slashIndex = path.indexOf('/');
    if (slashIndex === -1) {
        return [path, null];
    }
    return [path.slice(0, slashIndex), path.slice(slashIndex + 1)];
}
