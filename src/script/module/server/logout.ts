import { sendServerRequest, ServerRequestOptionKey } from './request';
import { showMessage } from '../message';
import { invalidResponse } from '../message/param/invalid_response';
import { buildHttpForm } from '../string/http_form/build';

export function logout(callback: () => void, accountID?: string) {
    sendServerRequest('logout', {
        [ServerRequestOptionKey.CALLBACK]: function (response: string) {
            if (response === 'PARTIAL' || response === 'DONE') {
                if (DEVELOPMENT) {
                    console.log(response);
                }
                callback();
            } else {
                showMessage(invalidResponse());
            }
        },
        [ServerRequestOptionKey.CONTENT]: buildHttpForm({ id: accountID }),
    });
}
