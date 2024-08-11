import { throwError } from './throw_error';

export function parseNumber(num: unknown) {
    if (typeof num === 'number') {
        return num;
    }
    throwError();
}
