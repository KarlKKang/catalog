export function throwError(message?: string) {
    throw new Error(message);
}

export function isObject(obj: any) {
    return objectToString(obj) === '[object Object]';
}

export function isString(str: any) {
    return typeof str === 'string' || str instanceof String;
}

export function isNumber(num: any) {
    return objectToString(num) === '[object Number]';
}

export function isArray(arr: any) {
    return Array.isArray(arr);
}

export function isBoolean(bool: any) {
    return bool === true || bool === false;
}

function objectToString(obj: any) {
    return Object.prototype.toString.call(obj);
}