import { getServerOrigin } from '../env/origin';
import { showMessage } from '../message';
import { mediaSessionEnded, connectionError, notFound, status429, status503, status400And500, sessionEnded, unknownServerError, insufficientPermissions } from './message';
import { addTimeout, removeTimeout, type Timeout } from '../timer';
import { redirect } from '../global';
import { parseMaintenanceInfo } from '../type/MaintenanceInfo';
import { LOGIN_URI } from '../env/uri';
import { abortXhr, newXHR } from '../xhr';
import { addEventListener } from '../event_listener';
import { buildURI } from '../http_form';
import { getHighResTimestamp, type HighResTimestamp } from '../hi_res_timestamp';
import { parseResponse } from './parse_response';

export const enum ServerRequestOptionKey {
    CALLBACK,
    CONTENT,
    METHOD,
    LOGOUT_PARAM,
    CONNECTION_ERROR_RETRY,
    CONNECTION_ERROR_RETRY_TIMEOUT,
    SHOW_SESSION_ENDED_MESSAGE,
    TIMEOUT,
}
interface ServerRequestOption {
    readonly [ServerRequestOptionKey.CALLBACK]?: (response: string) => void | Promise<void>;
    readonly [ServerRequestOptionKey.CONTENT]?: string;
    readonly [ServerRequestOptionKey.METHOD]?: 'POST' | 'GET';
    readonly [ServerRequestOptionKey.LOGOUT_PARAM]?: string | undefined;
    [ServerRequestOptionKey.CONNECTION_ERROR_RETRY]?: number | undefined;
    [ServerRequestOptionKey.CONNECTION_ERROR_RETRY_TIMEOUT]?: number;
    readonly [ServerRequestOptionKey.SHOW_SESSION_ENDED_MESSAGE]?: boolean;
    readonly [ServerRequestOptionKey.TIMEOUT]?: number;
}

export const enum ServerRequestKey {
    URI,
    OPTIONS,
    XHR,
    RETRY_TIMEOUT,
    _REQUEST_START_TIME,
    REQUEST_START_TIME,
    ABORT,
    SEND_REQUEST,
    ON_ERROR_CALLBACK,
    CHECK_STATUS,
}
class ServerRequest {
    private readonly [ServerRequestKey.URI]: string;
    private readonly [ServerRequestKey.OPTIONS]: ServerRequestOption;
    private [ServerRequestKey.XHR]: XMLHttpRequest | null = null;
    private [ServerRequestKey.RETRY_TIMEOUT]: Timeout | null = null;
    private [ServerRequestKey._REQUEST_START_TIME]: HighResTimestamp;
    public get [ServerRequestKey.REQUEST_START_TIME](): HighResTimestamp {
        return this[ServerRequestKey._REQUEST_START_TIME];
    }

    constructor(uri: string, options: ServerRequestOption) {
        this[ServerRequestKey.URI] = uri;
        this[ServerRequestKey.OPTIONS] = options;
        this[ServerRequestKey._REQUEST_START_TIME] = getHighResTimestamp();
        this[ServerRequestKey.SEND_REQUEST]();
    }

    public [ServerRequestKey.ABORT]() {
        const retryTimeout = this[ServerRequestKey.RETRY_TIMEOUT];
        if (retryTimeout !== null) {
            removeTimeout(retryTimeout);
            this[ServerRequestKey.RETRY_TIMEOUT] = null;
        }
        const xhr = this[ServerRequestKey.XHR];
        if (xhr !== null) {
            abortXhr(xhr);
            this[ServerRequestKey.XHR] = null;
        }
    }

    private [ServerRequestKey.SEND_REQUEST](this: ServerRequest) {
        let uri = this[ServerRequestKey.URI];
        const options = this[ServerRequestKey.OPTIONS];
        let content = options[ServerRequestOptionKey.CONTENT] ?? '';
        const method = options[ServerRequestOptionKey.METHOD] ?? 'POST';
        if (method === 'GET') {
            uri = buildURI(uri, content);
            content = '';
        }
        const xhr = newXHR(
            getServerOrigin() + '/' + uri,
            method,
            true,
            () => {
                this[ServerRequestKey.XHR] = null;
                if (this[ServerRequestKey.CHECK_STATUS](xhr)) {
                    options[ServerRequestOptionKey.CALLBACK] && options[ServerRequestOptionKey.CALLBACK](xhr.responseText);
                }
            },
        );
        addEventListener(xhr, 'error', () => {
            this[ServerRequestKey.XHR] = null;
            this[ServerRequestKey.ON_ERROR_CALLBACK]();
        });
        const timeout = options[ServerRequestOptionKey.TIMEOUT];
        if (timeout !== undefined) {
            xhr.timeout = timeout;
            addEventListener(xhr, 'timeout', () => {
                this[ServerRequestKey.XHR] = null;
                this[ServerRequestKey.ON_ERROR_CALLBACK]();
            });
        }
        xhr.send(content);
        this[ServerRequestKey.XHR] = xhr;
    }

    private [ServerRequestKey.ON_ERROR_CALLBACK](this: ServerRequest) {
        const options = this[ServerRequestKey.OPTIONS];
        if (options[ServerRequestOptionKey.CONNECTION_ERROR_RETRY] === undefined) {
            options[ServerRequestOptionKey.CONNECTION_ERROR_RETRY] = 2;
        } else {
            options[ServerRequestOptionKey.CONNECTION_ERROR_RETRY] -= 1;
        }

        if (options[ServerRequestOptionKey.CONNECTION_ERROR_RETRY_TIMEOUT] === undefined) {
            options[ServerRequestOptionKey.CONNECTION_ERROR_RETRY_TIMEOUT] = 500;
        } else {
            options[ServerRequestOptionKey.CONNECTION_ERROR_RETRY_TIMEOUT] *= 2;
        }

        if (options[ServerRequestOptionKey.CONNECTION_ERROR_RETRY] < 0) {
            showMessage(connectionError);
        } else {
            this[ServerRequestKey.RETRY_TIMEOUT] = addTimeout(() => {
                this[ServerRequestKey.RETRY_TIMEOUT] = null;
                this[ServerRequestKey._REQUEST_START_TIME] = getHighResTimestamp();
                this[ServerRequestKey.SEND_REQUEST]();
            }, options[ServerRequestOptionKey.CONNECTION_ERROR_RETRY_TIMEOUT]);
        }
    }

    private [ServerRequestKey.CHECK_STATUS](this: ServerRequest, xhr: XMLHttpRequest) {
        const options = this[ServerRequestKey.OPTIONS];
        const status = xhr.status;
        const responseText = xhr.responseText;
        if (status === 200) {
            return true;
        } else if (status === 403) {
            if (responseText === 'SESSION ENDED') {
                showMessage(mediaSessionEnded);
            } else if (responseText === 'INSUFFICIENT PERMISSIONS') {
                showMessage(insufficientPermissions);
            } else if (responseText === 'UNAUTHORIZED') {
                const logoutParam = options[ServerRequestOptionKey.LOGOUT_PARAM];
                const url = buildURI(LOGIN_URI, logoutParam);
                if (options[ServerRequestOptionKey.SHOW_SESSION_ENDED_MESSAGE]) {
                    showMessage(sessionEnded(url));
                } else {
                    redirect(url, true);
                }
            } else {
                this[ServerRequestKey.ON_ERROR_CALLBACK]();
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
        } else if (status === 404 && responseText === 'REJECTED') {
            showMessage(notFound);
        } else {
            this[ServerRequestKey.ON_ERROR_CALLBACK]();
        }
        return false;
    }
}
export type { ServerRequest };

export function sendServerRequest(uri: string, options: ServerRequestOption) {
    return new ServerRequest(uri, options);
}