import { throwError } from './throw_error';

export function parseObject(obj: unknown) {
    if (obj instanceof Object) {
        return obj as Record<string | number, unknown>;
    }
    throwError();
}
