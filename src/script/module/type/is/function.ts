export function isFunction(val: unknown): val is Function { // eslint-disable-line @typescript-eslint/no-unsafe-function-type
    return typeof val === 'function';
}
