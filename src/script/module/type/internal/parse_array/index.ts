import { isArray } from '../../is/array';
import { throwError } from '../throw_error';

export function parseArray(arr: unknown): unknown[] {
    if (isArray(arr)) {
        return arr;
    }
    throwError();
}
