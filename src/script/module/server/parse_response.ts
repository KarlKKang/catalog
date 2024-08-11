import { showMessage } from '../message';
import { invalidResponse } from './message';

export function parseResponse<T>(response: string, parser: (response: unknown) => T): T {
    try {
        return parser(JSON.parse(response));
    } catch (e) {
        showMessage(invalidResponse());
        throw e;
    }
}
