import { popupWindowImport, promptForTotpImport } from '../module/popup_window';

export let popupWindowImportPromise: ReturnType<typeof popupWindowImport>;
export let promptForTotpImportPromise: ReturnType<typeof promptForTotpImport>;

export function importAll() {
    popupWindowImportPromise = popupWindowImport();
    promptForTotpImportPromise = promptForTotpImport();
}