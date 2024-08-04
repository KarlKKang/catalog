export function throwError(message?: string): never {
    throw new Error(message);
}

export function parseObject(obj: unknown) {
    if (obj instanceof Object) {
        return obj as { [key: string | number]: unknown };
    }
    throwError();
}

export function parseNumber(num: unknown) {
    if (typeof num === 'number') {
        return num;
    }
    throwError();
}

export function parseArray(arr: unknown): unknown[] {
    if (Array.isArray(arr)) {
        return arr;
    }
    throwError();
}

export function parseTypedArray<T>(arr: unknown, elementParser: (value: unknown) => T): T[] {
    const untypedArr = parseArray(arr);
    const parsedArr: T[] = [];
    for (const element of untypedArr) {
        parsedArr.push(elementParser(element));
    }
    return parsedArr;
}

export function parseNonEmptyTypedArray<T>(arr: unknown, elementParser: (value: unknown) => T): [T, ...T[]] {
    const parsedArr = parseTypedArray(arr, elementParser);
    const firstElement = parsedArr[0];
    if (firstElement === undefined) {
        throwError();
    }
    return [firstElement, ...parsedArr.slice(1)];
}

export function parseBoolean(bool: unknown) {
    if (bool === true || bool === false) {
        return bool;
    }
    throwError();
}

export function parseString(str: unknown) {
    if (typeof str === 'string') {
        return str;
    }
    throwError();
}

export function parseOptional<T>(value: unknown, parser: (value: unknown) => T): T | undefined {
    return value === undefined ? undefined : parser(value);
}
