export function parseOptional<T>(value: unknown, parser: (value: unknown) => T): T | undefined {
    return value === undefined ? undefined : parser(value);
}
