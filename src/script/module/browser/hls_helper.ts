export function getMediaSource(): typeof MediaSource | undefined {
    if (typeof self === 'undefined') return undefined;
    return self.MediaSource || ((self as any).WebKitMediaSource as MediaSource);
}

function getSourceBuffer(): typeof self.SourceBuffer {
    return self.SourceBuffer || (self as any).WebKitSourceBuffer;
}

export function isSupported(): boolean {
    const mediaSource = getMediaSource();
    if (!mediaSource) {
        return false;
    }
    const sourceBuffer = getSourceBuffer();
    const isTypeSupported =
        mediaSource &&
        typeof mediaSource.isTypeSupported === 'function' &&
        mediaSource.isTypeSupported('video/mp4; codecs="avc1.42E01E,mp4a.40.2"');

    // if SourceBuffer is exposed ensure its API is valid
    // Older browsers do not expose SourceBuffer globally so checking SourceBuffer.prototype is impossible
    const sourceBufferValidAPI =
        !sourceBuffer ||
        (sourceBuffer.prototype &&
            typeof sourceBuffer.prototype.appendBuffer === 'function' &&
            typeof sourceBuffer.prototype.remove === 'function');
    return !!isTypeSupported && !!sourceBufferValidAPI;
}