import { sendServerRequest, ServerRequestOptionProp } from './request';
import { showMessage } from '../message';
import { invalidResponse } from './message';

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
