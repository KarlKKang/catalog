import { w } from '../../../dom/window';
import { getManagedMediaSource } from './get_managed_media_source';

declare global {
    interface Window {
        WebKitMediaSource: typeof MediaSource | undefined;
    }
}

export function getMediaSource(
    preferManagedMediaSource = true,
): typeof MediaSource | undefined {
    const mms = (preferManagedMediaSource || !w.MediaSource)
        && getManagedMediaSource();
    return (
        mms
        || w.MediaSource
        || w.WebKitMediaSource
    );
}
