import { sendServerRequest, ServerRequestOptionProp, ServerRequestKey } from './request';
import { type HighResTimestamp, getHighResTimestamp } from '../hi_res_timestamp';
import { max } from '../math';
import { showMessage } from '../message';
import { addTimeout, removeTimeout } from '../timer';
import { connectionError, invalidResponse } from './message';

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
