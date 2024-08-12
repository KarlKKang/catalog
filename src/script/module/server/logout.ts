import { sendServerRequest, ServerRequestOptionKey } from './request';
import { showMessage } from '../message';
import { invalidResponse } from '../message/param/invalid_response';

export function logout(callback: () => void) {
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
    });
}
