import { w } from '../../../dom/window';

declare global {
    interface Window {
        ManagedMediaSource: typeof MediaSource | undefined;
    }
}

export function getManagedMediaSource(): typeof MediaSource | undefined {
    return w.ManagedMediaSource;
}
