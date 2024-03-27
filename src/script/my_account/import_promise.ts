import { popupWindowImport, promptForTotpImport } from '../module/popup_window';

export let basicImportPromise: Promise<typeof import(
    './basic'
)>;
export let mfaImportPromise: Promise<typeof import(
    './mfa'
)>;
export let popupWindowImportPromise: ReturnType<typeof popupWindowImport>;
export let promptForTotpImportPromise: ReturnType<typeof promptForTotpImport>;

export function importAll() {
    basicImportPromise = import(
        './basic'
    );
    mfaImportPromise = import(
        './mfa'
    );
    popupWindowImportPromise = popupWindowImport();
    promptForTotpImportPromise = promptForTotpImport();
}