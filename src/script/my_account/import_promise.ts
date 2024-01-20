import { popupWindowImport, promptForTotpImport } from '../module/popup_window';

export let popupWindowImportPromise: ReturnType<typeof popupWindowImport>;
export let promptForTotpImportPromise: ReturnType<typeof promptForTotpImport>;
export let basicImportPromise: Promise<typeof import(
    './basic'
)>;
export let mfaImportPromise: Promise<typeof import(
    './mfa'
)>;

export function importAll() {
    popupWindowImportPromise = popupWindowImport();
    promptForTotpImportPromise = promptForTotpImport();
    basicImportPromise = import(
        './basic'
    );
    mfaImportPromise = import(
        './mfa'
    );
}