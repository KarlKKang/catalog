export function getMediaSource(
    preferManagedMediaSource = true,
): typeof MediaSource | undefined {
    if (typeof self === 'undefined') return undefined;
    const mms =
        (preferManagedMediaSource || !self.MediaSource) &&
        ((self as any).ManagedMediaSource as undefined | typeof MediaSource);
    return (
        mms ||
        self.MediaSource ||
        ((self as any).WebKitMediaSource as typeof MediaSource)
    );
}

function getSourceBuffer(): typeof self.SourceBuffer {
    return self.SourceBuffer || (self as any).WebKitSourceBuffer;
}

function isMSESupported(): boolean {
    const mediaSource = getMediaSource();
    if (!mediaSource) {
        return false;
    }

    // if SourceBuffer is exposed ensure its API is valid
    // Older browsers do not expose SourceBuffer globally so checking SourceBuffer.prototype is impossible
    const sourceBuffer = getSourceBuffer();
    return (
        !sourceBuffer ||
        (sourceBuffer.prototype &&
            typeof sourceBuffer.prototype.appendBuffer === 'function' &&
            typeof sourceBuffer.prototype.remove === 'function')
    );
}

export function isSupported(): boolean {
    if (!isMSESupported()) {
        return false;
    }

    const mediaSource = getMediaSource();
    return typeof mediaSource?.isTypeSupported === 'function';
}