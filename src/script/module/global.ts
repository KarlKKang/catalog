let pgid: unknown = null;
export { pgid };
export function setPgid(value: unknown) {
    pgid = value;
}

let redirect = (url: string, withoutHistory: boolean | null = false): void => {
    if (DEVELOPMENT) { // Will be stripped out by Terser in production build.
        url;
        withoutHistory;
    }
    throw new Error('Not initialized.');
};
export { redirect };
export function setRedirect(func: typeof redirect) {
    redirect = func;
}

export const STATE_TRACKER = 'TRACKED'; // This will be serialized by browser, so using a string for simpler comparison.
let customPopStateHandler: (() => void) | null = null;
export { customPopStateHandler };
export function setCustomPopStateHandler(handler: (() => void) | null) {
    customPopStateHandler = handler;
}

export type ShowPageFunc = () => void;
