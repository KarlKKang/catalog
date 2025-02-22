let redirectSameOrigin = (url: string, withoutHistory = false): void => {
    if (ENABLE_DEBUG) { // Will be stripped out by Terser in production build.
        url;
        withoutHistory;
        console.error('Redirect function is not initialized.');
    }
};

export { redirectSameOrigin };

export function setSameOriginRedirectFunc(func: typeof redirectSameOrigin) {
    redirectSameOrigin = func;
}
