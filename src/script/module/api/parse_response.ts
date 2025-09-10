import { showMessage } from '../message';
import { invalidResponse } from '../message/param/invalid_response';
import { type MessageParam } from '../message/type';

export function parseResponse<T>(response: string, parser: (response: unknown) => T, errorMessage?: MessageParam): T {
    try {
        return parser(JSON.parse(response));
    } catch (e) {
        showMessage(errorMessage ?? invalidResponse());
        throw e;
    }
}
