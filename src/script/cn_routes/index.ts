import { clearSessionStorage } from '../module/session_storage/clear';
import { ShowPageFunc, pgid } from '../module/global';
import { addNavBar } from '../module/nav_bar';
import { ServerRequestOptionProp, parseResponse, sendServerRequest } from '../module/server';
import { parseRouteList } from '../module/type/RouteList';
import { importModule } from '../module/import_module';

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();
    addNavBar();

    const asyncModulePromise = importModule(
        () => import(
            /* webpackExports: ["default"] */
            './async'
        ),
    );

    sendServerRequest('list_cn_routes', {
        [ServerRequestOptionProp.CALLBACK]: async (response: string) => {
            const routeList = parseResponse(response, parseRouteList);

            const currentPgid = pgid;
            const asyncModule = await asyncModulePromise;
            if (pgid !== currentPgid) {
                return;
            }
            asyncModule.default(routeList);
            showPage();
        },
        [ServerRequestOptionProp.METHOD]: 'GET',
    });
}
