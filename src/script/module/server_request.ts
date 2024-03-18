import { SERVER_URL, LOGIN_URL } from './env/constant';
import { show as showMessage } from './message';
import { insufficientPermissions } from './message/template/param';
import { mediaSessionEnded, connectionError, notFound, status429, status503, status400And500, invalidResponse, sessionEnded, unknownServerError } from './message/template/param/server';
import { addEventListener, removeAllEventListeners } from './dom';
import * as MaintenanceInfo from './type/MaintenanceInfo';
import { addTimeout } from './timer';
import { redirect } from './global';

interface SendServerRequestOption {
    callback?: (response: string) => void | Promise<void>;
    content?: string;
    method?: 'POST' | 'GET';
    logoutParam?: string | undefined;
    connectionErrorRetry?: number | undefined;
    connectionErrorRetryTimeout?: number;
    showSessionEndedMessage?: boolean;
}
function xhrOnErrorCallback(uri: string, options: SendServerRequestOption) {
    if (options.connectionErrorRetry === undefined) {
        options.connectionErrorRetry = 2;
    } else {
        options.connectionErrorRetry -= 1;
    }

    if (options.connectionErrorRetryTimeout === undefined) {
        options.connectionErrorRetryTimeout = 500;
    } else {
        options.connectionErrorRetryTimeout *= 2;
    }

    if (options.connectionErrorRetry < 0) {
        showMessage(connectionError);
    } else {
        addTimeout(() => {
            sendServerRequest(uri, options);
        }, options.connectionErrorRetryTimeout);
    }
}
function checkXHRStatus(response: XMLHttpRequest, uri: string, options: SendServerRequestOption): boolean {
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
            const logoutParam = options.logoutParam;
            const url = LOGIN_URL + ((logoutParam === undefined || logoutParam === '') ? '' : ('?' + logoutParam));
            if (options.showSessionEndedMessage) {
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
        let parsedResponse: MaintenanceInfo.MaintenanceInfo;
        try {
            parsedResponse = JSON.parse(responseText);
            MaintenanceInfo.check(parsedResponse);
        } catch (e) {
            showMessage(invalidResponse());
            return false;
        }
        showMessage(status503(parsedResponse));
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

export function sendServerRequest(uri: string, options: SendServerRequestOption): XMLHttpRequest {
    const xmlhttp = new XMLHttpRequest();
    xmlhttp.open(options.method ?? 'POST', SERVER_URL + '/' + uri, true);
    xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xmlhttp.withCredentials = true;

    addEventListener(xmlhttp, 'error', () => {
        removeAllEventListeners(xmlhttp);
        xhrOnErrorCallback(uri, options);
    });
    addEventListener(xmlhttp, 'abort', () => {
        removeAllEventListeners(xmlhttp);
    });
    addEventListener(xmlhttp, 'load', () => {
        removeAllEventListeners(xmlhttp);
        if (checkXHRStatus(xmlhttp, uri, options)) {
            options.callback && options.callback(xmlhttp.responseText);
        }
    });

    xmlhttp.send(options.content ?? '');
    return xmlhttp;
}

export function authenticate(callback: { successful?: () => void; failed?: () => void }) {
    sendServerRequest('get_authentication_state', {
        callback: function (response: string) {
            if (response === 'APPROVED') {
                callback.successful && callback.successful();
            } else if (response === 'FAILED') {
                callback.failed && callback.failed();
            } else {
                showMessage(invalidResponse());
            }
        }
    });
}

export function logout(callback: () => void) {
    sendServerRequest('logout', {
        callback: function (response: string) {
            if (response === 'PARTIAL' || response === 'DONE') {
                if (DEVELOPMENT) {
                    console.log(response);
                }
                callback();
            } else {
                showMessage(invalidResponse());
            }
        }
    });
}

export function setUpSessionAuthentication(credential: string, logoutParam?: string) {
    addTimeout(() => {
        sendServerRequest('authenticate_media_session', {
            callback: function (response: string) {
                if (response === 'APPROVED') {
                    setUpSessionAuthentication(credential, logoutParam);
                    return;
                }
                showMessage(invalidResponse());
            },
            content: credential,
            logoutParam: logoutParam,
            connectionErrorRetry: 5,
            showSessionEndedMessage: true,
        });
    }, 40 * 1000); // 60 - 0.5 - 1 - 2 - 4 - 8 = 44.5
}