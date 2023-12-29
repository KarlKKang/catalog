import { pgid } from '../global';
import { show as showMessage } from '../message';
import { moduleImportError } from '../message/template/param';
import { initializePopupWindow as InitializePopupWindow, onPopupWindowClosed as OnPopupWindowClosed } from './core';

let popupWindow: Awaited<typeof import(
    /* webpackExports: ["initializePopupWindow", "destroy"] */
    './core'
)> | null = null;

export async function popupWindowImport(): Promise<{
    initializePopupWindow: typeof InitializePopupWindow;
    onPopupWindowClosed: typeof OnPopupWindowClosed;
}> {
    if (popupWindow !== null) {
        return popupWindow;
    }
    const currentPgid = pgid;
    try {
        popupWindow = await import(
            /* webpackExports: ["initializePopupWindow", "destroy", "onPopupWindowClosed"] */
            './core'
        );
    } catch (e) {
        if (pgid === currentPgid) {
            showMessage(moduleImportError(e));
        }
        throw e;
    }
    return popupWindow;
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