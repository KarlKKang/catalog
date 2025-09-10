import { getAPIOrigin } from '../env/location/get/origin/server';
import { showMessage } from '../message';
import { connectionError } from './internal/message/connection_error';
import { unknownServerError } from './internal/message/unknown_server_error';
import { status400And500 } from './internal/message/status_400_and_500';
import { status503 } from './internal/message/status_503';
import { unauthorized } from './internal/message/unauthorized';
import { status429 } from './internal/message/status_429';
import { sessionEnded } from './internal/message/session_ended';
import { notFound } from '../message/param/not_found';
import { insufficientPermissions } from './internal/message/insufficient_permissions';
import { type Timeout } from '../timer/type';
import { removeTimeout } from '../timer/remove/timeout';
import { addTimeout } from '../timer/add/timeout';
import { redirectSameOrigin } from '../global/redirect';
import { parseMaintenanceInfo } from '../type/MaintenanceInfo';
import { LOGIN_URI, TOP_URI } from '../env/uri';
import { newXhr } from '../xhr/new';
import { abortXhr } from '../xhr/abort';
import { addEventListener } from '../event_listener/add';
import { buildURI } from '../string/uri/build';
import { getHighResTimestamp, type HighResTimestamp } from '../time/hi_res';
import { parseResponse } from './parse_response';
import { newFileReader } from '../file_reader/new';
import { abortFileReader } from '../file_reader/abort';
import { getFullPath } from '../dom/location/get/full_path';
import { buildHttpForm } from '../string/http_form/build';
import { invalidResponse } from '../message/param/invalid_response';
import { min } from '../math';

export const enum APIRequestOptionKey {
    CALLBACK,
    CONTENT,
    METHOD,
    ALLOW_CREDENTIALS,
    CONNECTION_ERROR_RETRY,
    CONNECTION_ERROR_RETRY_TIMEOUT,
    SHOW_UNAUTHORIZED_MESSAGE,
    TIMEOUT,
    CLOSE_WINDOW_ON_ERROR,
}
interface APIRequestOption<T extends string | Blob> {
    readonly [APIRequestOptionKey.CALLBACK]?: (response: T, xhr: XMLHttpRequest) => void | Promise<void>;
    readonly [APIRequestOptionKey.CONTENT]?: string;
    readonly [APIRequestOptionKey.METHOD]?: 'POST' | 'GET';
    readonly [APIRequestOptionKey.ALLOW_CREDENTIALS]?: boolean;
    [APIRequestOptionKey.CONNECTION_ERROR_RETRY]?: number | undefined;
    [APIRequestOptionKey.CONNECTION_ERROR_RETRY_TIMEOUT]?: number;
    readonly [APIRequestOptionKey.SHOW_UNAUTHORIZED_MESSAGE]?: boolean;
    readonly [APIRequestOptionKey.TIMEOUT]?: number;
    readonly [APIRequestOptionKey.CLOSE_WINDOW_ON_ERROR]?: true | string;
}

export const enum APIRequestKey {
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
abstract class APIRequest<T extends string | Blob> {
    private readonly [APIRequestKey.URI]: string;
    private readonly [APIRequestKey.OPTIONS]: APIRequestOption<T>;
    private [APIRequestKey.XHR]: XMLHttpRequest | null = null;
    private [APIRequestKey.RETRY_TIMEOUT]: Timeout | null = null;
    private [APIRequestKey._REQUEST_START_TIME] = getHighResTimestamp();
    private [APIRequestKey.SENT] = false;
    protected abstract readonly [APIRequestKey.RESPONSE_TYPE]: XMLHttpRequestResponseType;
    public get [APIRequestKey.REQUEST_START_TIME](): HighResTimestamp {
        return this[APIRequestKey._REQUEST_START_TIME];
    }

    constructor(uri: string, options: APIRequestOption<T>) {
        this[APIRequestKey.URI] = uri;
        this[APIRequestKey.OPTIONS] = options;
    }

    public [APIRequestKey.START_REQUEST](this: APIRequest<T>) {
        if (!this[APIRequestKey.SENT]) {
            this[APIRequestKey.SENT] = true;
            this[APIRequestKey._REQUEST_START_TIME] = getHighResTimestamp();
            this[APIRequestKey.SEND_REQUEST]();
        }
    }

    public [APIRequestKey.ABORT](this: APIRequest<T>) {
        const retryTimeout = this[APIRequestKey.RETRY_TIMEOUT];
        if (retryTimeout !== null) {
            removeTimeout(retryTimeout);
            this[APIRequestKey.RETRY_TIMEOUT] = null;
        }
        const xhr = this[APIRequestKey.XHR];
        if (xhr !== null) {
            abortXhr(xhr);
            this[APIRequestKey.XHR] = null;
        }
    }

    private [APIRequestKey.SEND_REQUEST](this: APIRequest<T>) {
        let uri = this[APIRequestKey.URI];
        const options = this[APIRequestKey.OPTIONS];
        let content = options[APIRequestOptionKey.CONTENT] ?? '';
        const method = options[APIRequestOptionKey.METHOD] ?? 'POST';
        if (method === 'GET') {
            uri = buildURI(uri, content);
            content = '';
        }
        const xhr = newXhr(
            getAPIOrigin() + '/' + uri,
            method,
            options[APIRequestOptionKey.ALLOW_CREDENTIALS] ?? true,
            () => {
                this[APIRequestKey.XHR] = null;
                const status = xhr.status;
                if (status === 200) {
                    options[APIRequestOptionKey.CALLBACK] && options[APIRequestOptionKey.CALLBACK](xhr.response, xhr);
                } else {
                    this[APIRequestKey.GET_RESPONSE_TEXT](xhr, (response: string) => {
                        this[APIRequestKey.HANDLE_ERROR](xhr.status, response);
                    });
                }
            },
        );
        xhr.responseType = this[APIRequestKey.RESPONSE_TYPE];
        addEventListener(xhr, 'error', () => {
            this[APIRequestKey.XHR] = null;
            this[APIRequestKey.RETRY]();
        });
        const timeout = options[APIRequestOptionKey.TIMEOUT];
        if (timeout !== undefined) {
            xhr.timeout = timeout;
            addEventListener(xhr, 'timeout', () => {
                this[APIRequestKey.XHR] = null;
                this[APIRequestKey.RETRY](true);
            });
        }
        xhr.send(content);
        this[APIRequestKey.XHR] = xhr;
    }

    private [APIRequestKey.RETRY](this: APIRequest<T>, noDelay?: boolean) {
        const options = this[APIRequestKey.OPTIONS];
        if (options[APIRequestOptionKey.CONNECTION_ERROR_RETRY] === undefined) {
            options[APIRequestOptionKey.CONNECTION_ERROR_RETRY] = 2;
        } else {
            options[APIRequestOptionKey.CONNECTION_ERROR_RETRY] -= 1;
        }

        let retryTimeout = 0;
        if (noDelay !== true) {
            const previousRetryTimeout = options[APIRequestOptionKey.CONNECTION_ERROR_RETRY_TIMEOUT];
            if (previousRetryTimeout === undefined) {
                retryTimeout = 500;
            } else {
                retryTimeout = min(previousRetryTimeout * 2, 8000);
            }
            options[APIRequestOptionKey.CONNECTION_ERROR_RETRY_TIMEOUT] = retryTimeout;
        }

        if (options[APIRequestOptionKey.CONNECTION_ERROR_RETRY] < 0) {
            showMessage(connectionError(options[APIRequestOptionKey.CLOSE_WINDOW_ON_ERROR]));
        } else {
            this[APIRequestKey.RETRY_TIMEOUT] = addTimeout(() => {
                this[APIRequestKey.RETRY_TIMEOUT] = null;
                this[APIRequestKey._REQUEST_START_TIME] = getHighResTimestamp();
                this[APIRequestKey.SEND_REQUEST]();
            }, retryTimeout);
        }
    }

    private [APIRequestKey.HANDLE_ERROR](this: APIRequest<T>, status: number, responseText: string) {
        const options = this[APIRequestKey.OPTIONS];
        const closeWindowOnError = options[APIRequestOptionKey.CLOSE_WINDOW_ON_ERROR];
        if (status === 403) {
            if (responseText === 'SESSION ENDED') {
                showMessage(sessionEnded(closeWindowOnError));
            } else if (responseText === 'INSUFFICIENT PERMISSIONS') {
                showMessage(insufficientPermissions(closeWindowOnError));
            } else if (responseText === 'UNAUTHORIZED') {
                let url = LOGIN_URI;
                const redirectPath = getFullPath();
                if (redirectPath !== TOP_URI) {
                    url = buildURI(url, buildHttpForm({ redirect: redirectPath }));
                }
                if (options[APIRequestOptionKey.SHOW_UNAUTHORIZED_MESSAGE]) {
                    showMessage(unauthorized(url, closeWindowOnError));
                } else {
                    redirectSameOrigin(url, true);
                }
            } else {
                this[APIRequestKey.RETRY]();
            }
        } else if (status === 429) {
            showMessage(status429);
        } else if (status === 503) {
            showMessage(
                status503(
                    parseResponse(responseText, parseMaintenanceInfo, invalidResponse(closeWindowOnError)),
                ),
            );
        } else if (status === 500 || status === 400) {
            if (responseText.startsWith('500 Internal Server Error') || responseText.startsWith('400 Bad Request')) {
                showMessage(status400And500(responseText, closeWindowOnError));
            } else {
                showMessage(unknownServerError(closeWindowOnError));
            }
        } else if (status === 404 && responseText === 'REJECTED') {
            showMessage(notFound(closeWindowOnError));
        } else {
            this[APIRequestKey.RETRY]();
        }
        return false;
    }

    protected abstract [APIRequestKey.GET_RESPONSE_TEXT](this: APIRequest<T>, xhr: XMLHttpRequest, callback: (response: string) => void): void;
}
export type { APIRequest };

class StringAPIRequest extends APIRequest<string> {
    protected readonly [APIRequestKey.RESPONSE_TYPE] = 'text';
    protected [APIRequestKey.GET_RESPONSE_TEXT](this: StringAPIRequest, xhr: XMLHttpRequest, callback: (response: string) => void) { // eslint-disable-line class-methods-use-this
        callback(xhr.responseText);
    }
}

const enum BlobAPIRequestKey {
    FILE_READER = APIRequestKey.__LENGTH, // eslint-disable-line @typescript-eslint/prefer-literal-enum-member
}
class BlobAPIRequest extends APIRequest<Blob> {
    private [BlobAPIRequestKey.FILE_READER]: FileReader | null = null;
    protected readonly [APIRequestKey.RESPONSE_TYPE] = 'blob';

    protected [APIRequestKey.GET_RESPONSE_TEXT](this: BlobAPIRequest, xhr: XMLHttpRequest, callback: (response: string) => void) {
        const fileReader = newFileReader();
        this[BlobAPIRequestKey.FILE_READER] = fileReader;
        addEventListener(fileReader, 'load', () => {
            this[BlobAPIRequestKey.FILE_READER] = null;
            callback(fileReader.result as string);
        });
        addEventListener(fileReader, 'error', () => {
            this[BlobAPIRequestKey.FILE_READER] = null;
            callback('');
        });
        fileReader.readAsText(xhr.response);
    }

    public override[APIRequestKey.ABORT](this: BlobAPIRequest) {
        super[APIRequestKey.ABORT]();
        const fileReader = this[BlobAPIRequestKey.FILE_READER];
        if (fileReader !== null) {
            abortFileReader(fileReader);
            this[BlobAPIRequestKey.FILE_READER] = null;
        }
    }
}

export function sendAPIRequest(uri: string, options: APIRequestOption<string>) {
    const request = new StringAPIRequest(uri, options);
    request[APIRequestKey.START_REQUEST]();
    return request;
}

export function sendBlobAPIRequest(uri: string, options: APIRequestOption<Blob>) {
    const request = new BlobAPIRequest(uri, options);
    request[APIRequestKey.START_REQUEST]();
    return request;
}
