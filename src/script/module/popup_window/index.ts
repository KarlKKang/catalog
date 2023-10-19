import { show as showMessage } from '../message';
import { moduleImportError } from '../message/template/param';
import type { RedirectFunc } from '../type/RedirectFunc';

export async function popupWindowImport(redirect: RedirectFunc) {
    try {
        return await import(
            /* webpackExports: ["initializePopupWindow", "destroy"] */
            './core'
        );
    } catch (e) {
        showMessage(redirect, moduleImportError(e));
        throw e;
    }
}

export async function promptForTotpImport(redirect: RedirectFunc) {
    try {
        return await import(
            /* webpackExports: ["promptForTotp"] */
            './totp'
        );
    } catch (e) {
        showMessage(redirect, moduleImportError(e));
        throw e;
    }
}