import { pgid } from '../global';
import { showMessage } from '../message';
import { moduleImportError } from '../message/param';
import { initializePopupWindow as InitializePopupWindow, onPopupWindowClosed as OnPopupWindowClosed, type styles as Styles } from './core';

let popupWindow: Awaited<typeof import(
    './core'
)> | null = null;

export async function popupWindowImport(): Promise<{
    styles: typeof Styles;
    initializePopupWindow: typeof InitializePopupWindow;
    onPopupWindowClosed: typeof OnPopupWindowClosed;
}> {
    if (popupWindow !== null) {
        return popupWindow;
    }
    const currentPgid = pgid;
    try {
        popupWindow = await import(
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