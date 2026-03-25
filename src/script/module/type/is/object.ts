export function isObject(val: unknown): val is Record<string | number, unknown> {
    return val instanceof Object;
}
