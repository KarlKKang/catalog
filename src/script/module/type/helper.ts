export function throwError(message?: string): never {
    throw new Error(message);
}

export function parseObject(obj: unknown): { [key: string]: unknown } {
    if (obj instanceof Object && obj.constructor === Object) {
        return obj as { [key: string]: unknown };
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