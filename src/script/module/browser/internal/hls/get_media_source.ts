import { w } from '../../../dom/window';
import { getManagedMediaSource } from './get_managed_media_source';

declare global {
    interface Window {
        WebKitMediaSource: typeof MediaSource | undefined;
    }
}

export function getMediaSource(): typeof MediaSource | undefined {
    const mms = !w.MediaSource && getManagedMediaSource();
    return (
        mms
        || w.MediaSource
        || w.WebKitMediaSource
    );
}
