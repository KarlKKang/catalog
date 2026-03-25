import { isObject } from '../is/object';
import { throwError } from './throw_error';

export function parseObject(obj: unknown) {
    if (isObject(obj)) {
        return obj;
    }
    throwError();
}
