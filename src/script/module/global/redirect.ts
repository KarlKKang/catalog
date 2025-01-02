let redirectSameOrigin = (url: string, withoutHistory = false): void => {
    if (DEVELOPMENT) { // Will be stripped out by Terser in production build.
        url;
        withoutHistory;
    }
    throw new Error('Not initialized.');
};

export { redirectSameOrigin };

export function setSameOriginRedirectFunc(func: typeof redirectSameOrigin) {
    redirectSameOrigin = func;
}
