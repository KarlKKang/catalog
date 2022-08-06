export function throwError(message?: string) {
    throw new Error(message);
}

export function isObject(obj: any) {
    return (obj instanceof Object);
}

export function isString(str: any) {
    return (typeof (str) === 'string');
}

export function isNumber(num: any) {
    return (typeof (num) === 'number');
}

export function isArray(arr: any) {
    return (arr instanceof Array);
}

export function isBoolean(bool: any) {
    return bool === true || bool === false;
}