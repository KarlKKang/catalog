import { getServerOrigin } from '../env/origin';
import { showMessage } from '../message';
import { mediaSessionEnded, connectionError, notFound, status429, status503, status400And500, invalidResponse, sessionEnded, unknownServerError, insufficientPermissions } from './message';
import { addTimeout } from '../timer';
import { redirect } from '../global';
import { parseMaintenanceInfo } from '../type/MaintenanceInfo';
import { LOGIN_URI } from '../env/uri';
import { newXHR } from '../xhr';
import { addEventListener } from '../event_listener';
import { buildURI } from '../http_form';
import { max } from '../math';

export const enum ServerRequestOptionProp {
    CALLBACK,
    CONTENT,
    METHOD,
    LOGOUT_PARAM,
    CONNECTION_ERROR_RETRY,
    CONNECTION_ERROR_RETRY_TIMEOUT,
    SHOW_SESSION_ENDED_MESSAGE,
}
interface ServerRequestOption {
    readonly [ServerRequestOptionProp.CALLBACK]?: (response: string) => void | Promise<void>;
    readonly [ServerRequestOptionProp.CONTENT]?: string;
    readonly [ServerRequestOptionProp.METHOD]?: 'POST' | 'GET';
    readonly [ServerRequestOptionProp.LOGOUT_PARAM]?: string | undefined;
    [ServerRequestOptionProp.CONNECTION_ERROR_RETRY]?: number | undefined;
    [ServerRequestOptionProp.CONNECTION_ERROR_RETRY_TIMEOUT]?: number;
    readonly [ServerRequestOptionProp.SHOW_SESSION_ENDED_MESSAGE]?: boolean;
}
function xhrOnErrorCallback(uri: string, options: ServerRequestOption) {
    if (options[ServerRequestOptionProp.CONNECTION_ERROR_RETRY] === undefined) {
        options[ServerRequestOptionProp.CONNECTION_ERROR_RETRY] = 2;
    } else {
        options[ServerRequestOptionProp.CONNECTION_ERROR_RETRY] -= 1;
    }

    if (options[ServerRequestOptionProp.CONNECTION_ERROR_RETRY_TIMEOUT] === undefined) {
        options[ServerRequestOptionProp.CONNECTION_ERROR_RETRY_TIMEOUT] = 500;
    } else {
        options[ServerRequestOptionProp.CONNECTION_ERROR_RETRY_TIMEOUT] *= 2;
    }

    if (options[ServerRequestOptionProp.CONNECTION_ERROR_RETRY] < 0) {
        showMessage(connectionError);
    } else {
        addTimeout(() => {
            sendServerRequest(uri, options);
        }, options[ServerRequestOptionProp.CONNECTION_ERROR_RETRY_TIMEOUT]);
    }
}
function checkXHRStatus(response: XMLHttpRequest, uri: string, options: ServerRequestOption): boolean {
    const status = response.status;
    const responseText = response.responseText;
    if (status === 200) {
        return true;
    } else if (status === 403) {
        if (responseText === 'SESSION ENDED') {
            showMessage(mediaSessionEnded);
        } else if (responseText === 'INSUFFICIENT PERMISSIONS') {
            showMessage(insufficientPermissions);
        } else if (responseText === 'UNAUTHORIZED') {
            const logoutParam = options[ServerRequestOptionProp.LOGOUT_PARAM];
            const url = buildURI(LOGIN_URI, logoutParam);
            if (options[ServerRequestOptionProp.SHOW_SESSION_ENDED_MESSAGE]) {
                showMessage(sessionEnded(url));
            } else {
                redirect(url, true);
            }
        } else {
            xhrOnErrorCallback(uri, options);
        }
    } else if (status === 429) {
        showMessage(status429);
    } else if (status === 503) {
        showMessage(status503(parseResponse(responseText, parseMaintenanceInfo)));
    } else if (status === 500 || status === 400) {
        if (responseText.startsWith('500 Internal Server Error') || responseText.startsWith('400 Bad Request')) {
            showMessage(status400And500(responseText));
        } else {
            showMessage(unknownServerError());
        }
    } else if (status === 404 && response.responseText === 'REJECTED') {
        showMessage(notFound);
    } else {
        xhrOnErrorCallback(uri, options);
    }
    return false;
}

export function sendServerRequest(uri: string, options: ServerRequestOption): XMLHttpRequest {
    let content = options[ServerRequestOptionProp.CONTENT] ?? '';
    const method = options[ServerRequestOptionProp.METHOD] ?? 'POST';
    let realUri = uri;
    if (method === 'GET') {
        realUri = buildURI(uri, content);
        content = '';
    }
    const xhr = newXHR(
        getServerOrigin() + '/' + realUri,
        method,
        true,
        () => {
            if (checkXHRStatus(xhr, uri, options)) {
                options[ServerRequestOptionProp.CALLBACK] && options[ServerRequestOptionProp.CALLBACK](xhr.responseText);
            }
        },
    );
    addEventListener(xhr, 'error', () => {
        xhrOnErrorCallback(uri, options);
    });
    xhr.send(content);
    return xhr;
}

export function logout(callback: () => void) {
    sendServerRequest('logout', {
        [ServerRequestOptionProp.CALLBACK]: function (response: string) {
            if (response === 'PARTIAL' || response === 'DONE') {
                if (DEVELOPMENT) {
                    console.log(response);
                }
                callback();
            } else {
                showMessage(invalidResponse());
            }
        },
    });
}

export function setUpSessionAuthentication(credential: string, startTime: ReturnType<typeof performance.now>, logoutParam?: string) {
    addTimeout(() => {
        const newStartTime = performance.now();
        sendServerRequest('authenticate_media_session', {
            [ServerRequestOptionProp.CALLBACK]: function (response: string) {
                if (response === 'APPROVED') {
                    setUpSessionAuthentication(credential, newStartTime, logoutParam);
                    return;
                }
                showMessage(invalidResponse());
            },
            [ServerRequestOptionProp.CONTENT]: credential,
            [ServerRequestOptionProp.LOGOUT_PARAM]: logoutParam,
            [ServerRequestOptionProp.CONNECTION_ERROR_RETRY]: 5,
            [ServerRequestOptionProp.SHOW_SESSION_ENDED_MESSAGE]: true,
        });
    }, max(40000 - (performance.now() - startTime), 0)); // 60 - 0.5 - 1 - 2 - 4 - 8 = 44.5
}

export function parseResponse<T>(response: string, parser: (response: unknown) => T): T {
    try {
        return parser(JSON.parse(response));
    } catch (e) {
        showMessage(invalidResponse());
        throw e;
    }
}
