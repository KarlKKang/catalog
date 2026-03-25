import { isNumber } from '../is/number';
import { throwError } from './throw_error';

export function parseNumber(num: unknown) {
    if (isNumber(num)) {
        return num;
    }
    throwError();
}
