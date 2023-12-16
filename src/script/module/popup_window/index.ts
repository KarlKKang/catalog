import { pgid } from '../global';
import { show as showMessage } from '../message';
import { moduleImportError } from '../message/template/param';

let popupWindow: Awaited<typeof import(
    /* webpackExports: ["initializePopupWindow", "destroy"] */
    './core'
)> | null = null;

export async function popupWindowImport() {
    if (popupWindow !== null) {
        return popupWindow.initializePopupWindow;
    }
    const currentPgid = pgid;
    try {
        popupWindow = await import(
            /* webpackExports: ["initializePopupWindow", "destroy"] */
            './core'
        );
    } catch (e) {
        if (pgid === currentPgid) {
            showMessage(moduleImportError(e));
        }
        throw e;
    }
    return popupWindow.initializePopupWindow;
}

export async function promptForTotpImport() {
    const currentPgid = pgid;
    try {
        return await import(
            './totp'
        );
    } catch (e) {
        if (pgid === currentPgid) {
            showMessage(moduleImportError(e));
        }
        throw e;
    }
}

export function destroy() {
    popupWindow?.destroy();
}