import { pgid } from '../global';
import type { NavBarPage } from './enum';
import { moduleImportError } from '../message/param';
import { show as showMessage } from '../message';

export async function addNavBar(page?: NavBarPage, currentPageCallback?: () => void) {
    const currentPgid = pgid;
    try {
        const module = await import(
            /* webpackExports: ["default"] */
            './nav_bar'
        );
        if (currentPgid !== pgid) {
            return;
        }
        module.default(page, currentPageCallback);
    } catch (e) {
        if (currentPgid === pgid) {
            showMessage(moduleImportError(e));
        }
        throw e;
    }
}