import { getServerOrigin } from '../env/origin';
import { showMessage } from '../message';
import { mediaSessionEnded, connectionError, notFound, status429, status503, status400And500, invalidResponse, sessionEnded, unknownServerError, insufficientPermissions } from './message';
import { addTimeout, removeTimeout, type Timeout } from '../timer';
import { redirect } from '../global';
import { parseMaintenanceInfo } from '../type/MaintenanceInfo';
import { LOGIN_URI } from '../env/uri';
import { abortXhr, newXHR } from '../xhr';
import { addEventListener } from '../event_listener';
import { buildURI } from '../http_form';
import { max } from '../math';
import { getHighResTimestamp, type HighResTimestamp } from '../hi_res_timestamp';

export const enum ServerRequestOptionProp {
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
    readonly [ServerRequestOptionProp.CALLBACK]?: (response: string) => void | Promise<void>;
    readonly [ServerRequestOptionProp.CONTENT]?: string;
    readonly [ServerRequestOptionProp.METHOD]?: 'POST' | 'GET';
    readonly [ServerRequestOptionProp.LOGOUT_PARAM]?: string | undefined;
    [ServerRequestOptionProp.CONNECTION_ERROR_RETRY]?: number | undefined;
    [ServerRequestOptionProp.CONNECTION_ERROR_RETRY_TIMEOUT]?: number;
    readonly [ServerRequestOptionProp.SHOW_SESSION_ENDED_MESSAGE]?: boolean;
    readonly [ServerRequestOptionProp.TIMEOUT]?: number;
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
    private [ServerRequestKey.XHR]: XMLHttpRequest;
    private [ServerRequestKey.RETRY_TIMEOUT]: Timeout | null = null;
    private [ServerRequestKey._REQUEST_START_TIME]: HighResTimestamp;
    public get [ServerRequestKey.REQUEST_START_TIME](): HighResTimestamp {
        return this[ServerRequestKey._REQUEST_START_TIME];
    }

    constructor(uri: string, options: ServerRequestOption) {
        this[ServerRequestKey.URI] = uri;
        this[ServerRequestKey.OPTIONS] = options;
        this[ServerRequestKey._REQUEST_START_TIME] = getHighResTimestamp();
        this[ServerRequestKey.XHR] = this[ServerRequestKey.SEND_REQUEST]();
    }

    public [ServerRequestKey.ABORT]() {
        const retryTimeout = this[ServerRequestKey.RETRY_TIMEOUT];
        if (retryTimeout === null) {
            abortXhr(this[ServerRequestKey.XHR]);
        } else {
            removeTimeout(retryTimeout);
        }
    }

    private [ServerRequestKey.SEND_REQUEST](this: ServerRequest) {
        let uri = this[ServerRequestKey.URI];
        const options = this[ServerRequestKey.OPTIONS];
        let content = options[ServerRequestOptionProp.CONTENT] ?? '';
        const method = options[ServerRequestOptionProp.METHOD] ?? 'POST';
        if (method === 'GET') {
            uri = buildURI(uri, content);
            content = '';
        }
        const xhr = newXHR(
            getServerOrigin() + '/' + uri,
            method,
            true,
            () => {
                if (this[ServerRequestKey.CHECK_STATUS]()) {
                    options[ServerRequestOptionProp.CALLBACK] && options[ServerRequestOptionProp.CALLBACK](xhr.responseText);
                }
            },
        );
        addEventListener(xhr, 'error', () => {
            this[ServerRequestKey.ON_ERROR_CALLBACK]();
        });
        const timeout = options[ServerRequestOptionProp.TIMEOUT];
        if (timeout !== undefined) {
            xhr.timeout = timeout;
            addEventListener(xhr, 'timeout', () => {
                this[ServerRequestKey.ON_ERROR_CALLBACK]();
            });
        }
        xhr.send(content);
        return xhr;
    }

    private [ServerRequestKey.ON_ERROR_CALLBACK](this: ServerRequest) {
        const options = this[ServerRequestKey.OPTIONS];
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
            this[ServerRequestKey.RETRY_TIMEOUT] = addTimeout(() => {
                this[ServerRequestKey.RETRY_TIMEOUT] = null;
                this[ServerRequestKey._REQUEST_START_TIME] = getHighResTimestamp();
                this[ServerRequestKey.XHR] = this[ServerRequestKey.SEND_REQUEST]();
            }, options[ServerRequestOptionProp.CONNECTION_ERROR_RETRY_TIMEOUT]);
        }
    }

    private [ServerRequestKey.CHECK_STATUS](this: ServerRequest) {
        const response = this[ServerRequestKey.XHR];
        const options = this[ServerRequestKey.OPTIONS];
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
        } else if (status === 404 && response.responseText === 'REJECTED') {
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

export function setUpSessionAuthentication(credential: string, startTime: HighResTimestamp, logoutParam?: string) {
    addTimeout(() => {
        const requestTimeout = addTimeout(() => {
            showMessage(connectionError);
        }, max(60000 - (getHighResTimestamp() - startTime), 0));
        const serverRequest = sendServerRequest('authenticate_media_session', {
            [ServerRequestOptionProp.CALLBACK]: function (response: string) {
                if (response === 'APPROVED') {
                    removeTimeout(requestTimeout);
                    setUpSessionAuthentication(credential, serverRequest[ServerRequestKey.REQUEST_START_TIME], logoutParam);
                    return;
                }
                showMessage(invalidResponse());
            },
            [ServerRequestOptionProp.CONTENT]: credential,
            [ServerRequestOptionProp.LOGOUT_PARAM]: logoutParam,
            [ServerRequestOptionProp.CONNECTION_ERROR_RETRY]: 5,
            [ServerRequestOptionProp.SHOW_SESSION_ENDED_MESSAGE]: true,
        });
    }, max(40000 - (getHighResTimestamp() - startTime), 0)); // 60 - 0.5 - 1 - 2 - 4 - 8 = 44.5
}

export function parseResponse<T>(response: string, parser: (response: unknown) => T): T {
    try {
        return parser(JSON.parse(response));
    } catch (e) {
        showMessage(invalidResponse());
        throw e;
    }
}
