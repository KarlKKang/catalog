import { show as showMessage } from '../message';
import { moduleImportError } from '../message/template/param';

export async function popupWindowImport() {
    try {
        return await import(
            /* webpackExports: ["initializePopupWindow", "destroy"] */
            './core'
        );
    } catch (e) {
        showMessage(moduleImportError(e));
        throw e;
    }
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