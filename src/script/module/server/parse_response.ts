import { showMessage } from '../message';
import { invalidResponse } from '../message/param/invalid_response';

export function parseResponse<T>(response: string, parser: (response: unknown) => T): T {
    try {
        return parser(JSON.parse(response));
    } catch (e) {
        showMessage(invalidResponse());
        throw e;
    }
}
