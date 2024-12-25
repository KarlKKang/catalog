import { pgid } from '../global/pgid';
import type { NavBarPage } from './enum';
import type { default as NavBarFunc } from './internal/nav_bar';
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
            './internal/nav_bar',
        ),
    ));
    if (currentPgid === pgid) {
        navBarFunc(page, currentPageCallback);
    }
}
