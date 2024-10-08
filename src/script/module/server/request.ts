import { getServerOrigin } from '../env/location/get/origin/server';
import { showMessage } from '../message';
import { connectionError } from '../message/param/connection_error';
import { unknownServerError } from './internal/message/unknown_server_error';
import { status400And500 } from './internal/message/status_400_and_500';
import { status503 } from './internal/message/status_503';
import { sessionEnded } from './internal/message/session_ended';
import { status429 } from './internal/message/status_429';
import { mediaSessionEnded } from './internal/message/media_session_ended';
import { notFound } from '../message/param/not_found';
import { insufficientPermissions } from './internal/message/insufficient_permissions';
import { type Timeout } from '../timer/type';
import { removeTimeout } from '../timer/remove/timeout';
import { addTimeout } from '../timer/add/timeout';
import { redirect } from '../global/redirect';
import { parseMaintenanceInfo } from '../type/MaintenanceInfo';
import { LOGIN_URI } from '../env/uri';
import { newXhr } from '../xhr/new';
import { abortXhr } from '../xhr/abort';
import { addEventListener } from '../event_listener/add';
import { buildURI } from '../string/uri/build';
import { getHighResTimestamp, type HighResTimestamp } from '../time/hi_res';
import { parseResponse } from './parse_response';
import { newFileReader } from '../file_reader/new';
import { abortFileReader } from '../file_reader/abort';

export const enum ServerRequestOptionKey {
    CALLBACK,
    CONTENT,
    METHOD,
    ALLOW_CREDENTIALS,
    LOGOUT_PARAM,
    CONNECTION_ERROR_RETRY,
    CONNECTION_ERROR_RETRY_TIMEOUT,
    SHOW_SESSION_ENDED_MESSAGE,
    TIMEOUT,
}
interface ServerRequestOption<T extends string | Blob> {
    readonly [ServerRequestOptionKey.CALLBACK]?: (response: T, xhr: XMLHttpRequest) => void | Promise<void>;
    readonly [ServerRequestOptionKey.CONTENT]?: string;
    readonly [ServerRequestOptionKey.METHOD]?: 'POST' | 'GET';
    readonly [ServerRequestOptionKey.ALLOW_CREDENTIALS]?: boolean;
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
    SENT,
    START_REQUEST,
    ABORT,
    SEND_REQUEST,
    RETRY,
    HANDLE_ERROR,
    RESPONSE_TYPE,
    GET_RESPONSE,
    GET_RESPONSE_TEXT,

    __LENGTH,
}
abstract class ServerRequest<T extends string | Blob> {
    private readonly [ServerRequestKey.URI]: string;
    private readonly [ServerRequestKey.OPTIONS]: ServerRequestOption<T>;
    private [ServerRequestKey.XHR]: XMLHttpRequest | null = null;
    private [ServerRequestKey.RETRY_TIMEOUT]: Timeout | null = null;
    private [ServerRequestKey._REQUEST_START_TIME] = getHighResTimestamp();
    private [ServerRequestKey.SENT] = false;
    protected abstract readonly [ServerRequestKey.RESPONSE_TYPE]: XMLHttpRequestResponseType;
    public get [ServerRequestKey.REQUEST_START_TIME](): HighResTimestamp {
        return this[ServerRequestKey._REQUEST_START_TIME];
    }

    constructor(uri: string, options: ServerRequestOption<T>) {
        this[ServerRequestKey.URI] = uri;
        this[ServerRequestKey.OPTIONS] = options;
    }

    public [ServerRequestKey.START_REQUEST](this: ServerRequest<T>) {
        if (!this[ServerRequestKey.SENT]) {
            this[ServerRequestKey.SENT] = true;
            this[ServerRequestKey._REQUEST_START_TIME] = getHighResTimestamp();
            this[ServerRequestKey.SEND_REQUEST]();
        }
    }

    public [ServerRequestKey.ABORT](this: ServerRequest<T>) {
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

    private [ServerRequestKey.SEND_REQUEST](this: ServerRequest<T>) {
        let uri = this[ServerRequestKey.URI];
        const options = this[ServerRequestKey.OPTIONS];
        let content = options[ServerRequestOptionKey.CONTENT] ?? '';
        const method = options[ServerRequestOptionKey.METHOD] ?? 'POST';
        if (method === 'GET') {
            uri = buildURI(uri, content);
            content = '';
        }
        const xhr = newXhr(
            getServerOrigin() + '/' + uri,
            method,
            options[ServerRequestOptionKey.ALLOW_CREDENTIALS] ?? true,
            () => {
                this[ServerRequestKey.XHR] = null;
                const status = xhr.status;
                if (status === 200) {
                    options[ServerRequestOptionKey.CALLBACK] && options[ServerRequestOptionKey.CALLBACK](xhr.response, xhr);
                } else {
                    this[ServerRequestKey.GET_RESPONSE_TEXT](xhr, (response: string) => {
                        this[ServerRequestKey.HANDLE_ERROR](xhr.status, response);
                    });
                }
            },
        );
        xhr.responseType = this[ServerRequestKey.RESPONSE_TYPE];
        addEventListener(xhr, 'error', () => {
            this[ServerRequestKey.XHR] = null;
            this[ServerRequestKey.RETRY]();
        });
        const timeout = options[ServerRequestOptionKey.TIMEOUT];
        if (timeout !== undefined) {
            xhr.timeout = timeout;
            addEventListener(xhr, 'timeout', () => {
                this[ServerRequestKey.XHR] = null;
                this[ServerRequestKey.RETRY]();
            });
        }
        xhr.send(content);
        this[ServerRequestKey.XHR] = xhr;
    }

    private [ServerRequestKey.RETRY](this: ServerRequest<T>) {
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
            showMessage(connectionError());
        } else {
            this[ServerRequestKey.RETRY_TIMEOUT] = addTimeout(() => {
                this[ServerRequestKey.RETRY_TIMEOUT] = null;
                this[ServerRequestKey._REQUEST_START_TIME] = getHighResTimestamp();
                this[ServerRequestKey.SEND_REQUEST]();
            }, options[ServerRequestOptionKey.CONNECTION_ERROR_RETRY_TIMEOUT]);
        }
    }

    private [ServerRequestKey.HANDLE_ERROR](this: ServerRequest<T>, status: number, responseText: string) {
        const options = this[ServerRequestKey.OPTIONS];
        if (status === 403) {
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
                this[ServerRequestKey.RETRY]();
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
            this[ServerRequestKey.RETRY]();
        }
        return false;
    }

    protected abstract [ServerRequestKey.GET_RESPONSE_TEXT](this: ServerRequest<T>, xhr: XMLHttpRequest, callback: (response: string) => void): void;
}
export type { ServerRequest };

class StringServerRequest extends ServerRequest<string> {
    protected readonly [ServerRequestKey.RESPONSE_TYPE] = 'text';
    protected [ServerRequestKey.GET_RESPONSE_TEXT](this: StringServerRequest, xhr: XMLHttpRequest, callback: (response: string) => void) { // eslint-disable-line class-methods-use-this
        callback(xhr.responseText);
    }
}

const enum BlobServerRequestKey {
    FILE_READER = ServerRequestKey.__LENGTH, // eslint-disable-line @typescript-eslint/prefer-literal-enum-member
}
class BlobServerRequest extends ServerRequest<Blob> {
    private [BlobServerRequestKey.FILE_READER]: FileReader | null = null;
    protected readonly [ServerRequestKey.RESPONSE_TYPE] = 'blob';

    protected [ServerRequestKey.GET_RESPONSE_TEXT](this: BlobServerRequest, xhr: XMLHttpRequest, callback: (response: string) => void) {
        const fileReader = newFileReader();
        this[BlobServerRequestKey.FILE_READER] = fileReader;
        addEventListener(fileReader, 'load', () => {
            this[BlobServerRequestKey.FILE_READER] = null;
            callback(fileReader.result as string);
        });
        addEventListener(fileReader, 'error', () => {
            this[BlobServerRequestKey.FILE_READER] = null;
            callback('');
        });
        fileReader.readAsText(xhr.response);
    }

    public override[ServerRequestKey.ABORT](this: BlobServerRequest) {
        super[ServerRequestKey.ABORT]();
        const fileReader = this[BlobServerRequestKey.FILE_READER];
        if (fileReader !== null) {
            abortFileReader(fileReader);
            this[BlobServerRequestKey.FILE_READER] = null;
        }
    }
}

export function sendServerRequest(uri: string, options: ServerRequestOption<string>) {
    const request = new StringServerRequest(uri, options);
    request[ServerRequestKey.START_REQUEST]();
    return request;
}

export function sendBlobServerRequest(uri: string, options: ServerRequestOption<Blob>) {
    const request = new BlobServerRequest(uri, options);
    request[ServerRequestKey.START_REQUEST]();
    return request;
}
