import { pgid } from '../global';
import type { NavBarPage } from './enum';
import { moduleImportError } from '../message/param';
import { showMessage } from '../message';
import { default as NavBarFunc } from './nav_bar';

let navBarFunc: typeof NavBarFunc | null = null;
export async function addNavBar(page?: NavBarPage, currentPageCallback?: () => void) {
    if (navBarFunc !== null) {
        navBarFunc(page, currentPageCallback);
        return;
    }
    const currentPgid = pgid;
    try {
        ({ default: navBarFunc } = await import(
            './nav_bar'
        ));
        if (currentPgid !== pgid) {
            return;
        }
        navBarFunc(page, currentPageCallback);
    } catch (e) {
        if (currentPgid === pgid) {
            showMessage(moduleImportError(e));
        }
        throw e;
    }
}