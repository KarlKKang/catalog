let pgid: unknown = null;

export { pgid };

export function setPgid(value: unknown) {
    const oldPgid = pgid;
    pgid = value;
    return oldPgid;
}