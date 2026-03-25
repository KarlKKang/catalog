import { isString } from '../is/string';
import { throwError } from './throw_error';

export function parseString(str: unknown) {
    if (isString(str)) {
        return str;
    }
    throwError();
}
