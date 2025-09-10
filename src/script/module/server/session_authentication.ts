import { sendAPIRequest, APIRequestOptionKey, APIRequestKey } from './request';
import { type HighResTimestamp, getHighResTimestamp } from '../time/hi_res';
import { showMessage } from '../message';
import { addTimeout } from '../timer/add/timeout';
import { invalidResponse } from '../message/param/invalid_response';
import { max } from '../math';

export function setUpSessionAuthentication(credential: string, startTime: HighResTimestamp, closeWindowOnError?: true | string) {
    addTimeout(() => {
        const serverRequest = sendAPIRequest('authenticate_media_session', {
            [APIRequestOptionKey.CALLBACK]: function (response: string) {
                if (response === 'APPROVED') {
                    setUpSessionAuthentication(credential, serverRequest[APIRequestKey.REQUEST_START_TIME]);
                    return;
                }
                showMessage(invalidResponse(closeWindowOnError));
            },
            [APIRequestOptionKey.CONTENT]: credential,
            [APIRequestOptionKey.CONNECTION_ERROR_RETRY]: Infinity,
            [APIRequestOptionKey.SHOW_UNAUTHORIZED_MESSAGE]: true,
            ...closeWindowOnError !== undefined && { [APIRequestOptionKey.CLOSE_WINDOW_ON_ERROR]: closeWindowOnError },
        });
    }, max(40000 - (getHighResTimestamp() - startTime), 0)); // 60 - 0.5 - 1 - 2 - 4 - 8 = 44.5
}
