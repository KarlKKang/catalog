import { sendAPIRequest, APIRequestOptionKey } from './request';
import { showMessage } from '../message';
import { invalidResponse } from '../message/param/invalid_response';
import { buildHttpForm } from '../string/http_form/build';

export function logout(callback: () => void, accountID?: string) {
    sendAPIRequest('logout', {
        [APIRequestOptionKey.CALLBACK]: function (response: string) {
            if (response === 'PARTIAL' || response === 'DONE') {
                if (ENABLE_DEBUG) {
                    console.log(response);
                }
                callback();
            } else {
                showMessage(invalidResponse());
            }
        },
        [APIRequestOptionKey.CONTENT]: buildHttpForm({ id: accountID }),
    });
}
