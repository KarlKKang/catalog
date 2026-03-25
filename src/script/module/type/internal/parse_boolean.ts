import { isBoolean } from '../is/boolean';
import { throwError } from './throw_error';

export function parseBoolean(bool: unknown) {
    if (isBoolean(bool)) {
        return bool;
    }
    throwError();
}
