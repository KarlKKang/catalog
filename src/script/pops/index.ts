import { clearSessionStorage } from '../module/dom/document';
import { ShowPageFunc, pgid } from '../module/global';
import { addNavBar } from '../module/nav_bar';
import { ServerRequestOptionProp, parseResponse, sendServerRequest } from '../module/server';
import { parsePopsList } from '../module/type/PopsList';
import { importModule } from '../module/import_module';

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();
    addNavBar();

    const asyncModulePromise = import(
        /* webpackExports: ["default"] */
        './async'
    );

    sendServerRequest('list_pops', {
        [ServerRequestOptionProp.CALLBACK]: async (response: string) => {
            const popsList = parseResponse(response, parsePopsList);

            const currentPgid = pgid;
            const asyncModule = await importModule(asyncModulePromise);
            if (pgid !== currentPgid) {
                return;
            }
            asyncModule.default(popsList);
            showPage();
        },
        [ServerRequestOptionProp.METHOD]: 'GET',
    });
}