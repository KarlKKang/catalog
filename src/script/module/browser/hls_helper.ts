import { w } from '../dom/document';

declare global {
    interface Window {
        ManagedMediaSource: typeof MediaSource | undefined;
        WebKitMediaSource: typeof MediaSource | undefined;
        WebKitSourceBuffer: typeof SourceBuffer | undefined;
    }
}

export function getManagedMediaSource(): typeof MediaSource | undefined {
    return w.ManagedMediaSource;
}

export function getMediaSource(
    preferManagedMediaSource = true,
): typeof MediaSource | undefined {
    const mms
        = (preferManagedMediaSource || !w.MediaSource)
        && getManagedMediaSource();
    return (
        mms
        || w.MediaSource
        || w.WebKitMediaSource
    );
}

function getSourceBuffer(): typeof SourceBuffer {
    return w.SourceBuffer || w.WebKitSourceBuffer;
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
        !sourceBuffer
        || (sourceBuffer.prototype
        && typeof sourceBuffer.prototype.appendBuffer === 'function'
        && typeof sourceBuffer.prototype.remove === 'function')
    );
}

export function isSupported(): boolean {
    if (!isMSESupported()) {
        return false;
    }

    const mediaSource = getMediaSource();
    return typeof mediaSource?.isTypeSupported === 'function';
}
