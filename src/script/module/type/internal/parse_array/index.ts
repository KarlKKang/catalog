import { throwError } from '../throw_error';

export function parseArray(arr: unknown): unknown[] {
    if (Array.isArray(arr)) {
        return arr;
    }
    throwError();
}
