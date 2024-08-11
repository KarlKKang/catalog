import { throwError } from './throw_error';

export function parseString(str: unknown) {
    if (typeof str === 'string') {
        return str;
    }
    throwError();
}
