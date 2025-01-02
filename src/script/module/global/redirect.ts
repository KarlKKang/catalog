let redirect = (url: string, withoutHistory = false): void => {
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
