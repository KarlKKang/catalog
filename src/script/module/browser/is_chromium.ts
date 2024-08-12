import { w } from '../dom/window';

declare global {
    interface Window {
        chrome: any;
    }
}

export const IS_CHROMIUM = !!w.chrome;
