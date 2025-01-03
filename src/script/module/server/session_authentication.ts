import { sendServerRequest, ServerRequestOptionKey, ServerRequestKey } from './request';
import { type HighResTimestamp, getHighResTimestamp } from '../time/hi_res';
import { showMessage } from '../message';
import { removeTimeout } from '../timer/remove/timeout';
import { addTimeout } from '../timer/add/timeout';
import { connectionError } from './internal/message/connection_error';
import { invalidResponse } from '../message/param/invalid_response';
import { max } from '../math';

export function setUpSessionAuthentication(credential: string, startTime: HighResTimestamp, closeWindowOnError?: true | string) {
    addTimeout(() => {
        const requestTimeout = addTimeout(() => {
            showMessage(connectionError(closeWindowOnError));
        }, max(60000 - (getHighResTimestamp() - startTime), 0));
        const serverRequest = sendServerRequest('authenticate_media_session', {
            [ServerRequestOptionKey.CALLBACK]: function (response: string) {
                if (response === 'APPROVED') {
                    removeTimeout(requestTimeout);
                    setUpSessionAuthentication(credential, serverRequest[ServerRequestKey.REQUEST_START_TIME]);
                    return;
                }
                showMessage(invalidResponse(closeWindowOnError));
            },
            [ServerRequestOptionKey.CONTENT]: credential,
            [ServerRequestOptionKey.CONNECTION_ERROR_RETRY]: 5,
            [ServerRequestOptionKey.SHOW_UNAUTHORIZED_MESSAGE]: true,
            ...closeWindowOnError !== undefined && { [ServerRequestOptionKey.CLOSE_WINDOW_ON_ERROR]: closeWindowOnError },
        });
    }, max(40000 - (getHighResTimestamp() - startTime), 0)); // 60 - 0.5 - 1 - 2 - 4 - 8 = 44.5
}
