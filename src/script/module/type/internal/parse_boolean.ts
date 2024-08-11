import { throwError } from './throw_error';

export function parseBoolean(bool: unknown) {
    if (bool === true || bool === false) {
        return bool;
    }
    throwError();
}
