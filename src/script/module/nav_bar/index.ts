import { pgid } from '../global';
import type { NavBarPage } from './enum';
import type { default as NavBarFunc } from './nav_bar';
import { importModule } from '../import_module';

let navBarFunc: typeof NavBarFunc | null = null;
export async function addNavBar(page?: NavBarPage, currentPageCallback?: () => void) {
    if (navBarFunc !== null) {
        navBarFunc(page, currentPageCallback);
        return;
    }
    const currentPgid = pgid;
    ({ default: navBarFunc } = await importModule(
        () => import(
            /* webpackExports: ["default"] */
            './nav_bar'
        ),
    ));
    if (currentPgid === pgid) {
        navBarFunc(page, currentPageCallback);
    }
}
