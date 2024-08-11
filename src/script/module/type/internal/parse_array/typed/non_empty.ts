import { throwError } from '../../throw_error';
import { parseTypedArray } from '.';

export function parseNonEmptyTypedArray<T>(arr: unknown, elementParser: (value: unknown) => T): [T, ...T[]] {
    const parsedArr = parseTypedArray(arr, elementParser);
    const firstElement = parsedArr[0];
    if (firstElement === undefined) {
        throwError();
    }
    return [firstElement, ...parsedArr.slice(1)];
}
