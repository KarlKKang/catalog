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
    try {
        popupWindow = await import(
            /* webpackExports: ["initializePopupWindow", "destroy"] */
            './core'
        );
    } catch (e) {
        showMessage(moduleImportError(e));
        throw e;
    }
    return popupWindow.initializePopupWindow;
}

export async function promptForTotpImport() {
    try {
        return await import(
            /* webpackExports: ["promptForTotp"] */
            './totp'
        );
    } catch (e) {
        showMessage(moduleImportError(e));
        throw e;
    }
}

export function destroy() {
    popupWindow?.destroy();
}