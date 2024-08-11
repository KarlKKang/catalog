import { parseArray } from '..';

export function parseTypedArray<T>(arr: unknown, elementParser: (value: unknown) => T): T[] {
    const untypedArr = parseArray(arr);
    const parsedArr: T[] = [];
    for (const element of untypedArr) {
        parsedArr.push(elementParser(element));
    }
    return parsedArr;
}
