import { w } from '../../../dom/window';
import { getMediaSource } from './get_media_source';

declare global {
    interface Window {
        WebKitSourceBuffer: typeof SourceBuffer | undefined;
    }
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
