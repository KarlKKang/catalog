import { ShowPageFunc } from '../module/global/type';
import { pgid } from '../module/global/pgid';
import { addNavBar } from '../module/nav_bar';
import { ServerRequestOptionKey, sendServerRequest } from '../module/server/request';
import { parseResponse } from '../module/server/parse_response';
import { parseRouteList } from '../module/type/RouteList';
import { importModule } from '../module/import_module';

export default function (showPage: ShowPageFunc) {
    addNavBar();

    const asyncModulePromise = importModule(
        () => import(
            /* webpackExports: ["default"] */
            './async'
        ),
    );

    sendServerRequest('list_cn_routes', {
        [ServerRequestOptionKey.CALLBACK]: async (response: string) => {
            const routeList = parseResponse(response, parseRouteList);

            const currentPgid = pgid;
            const asyncModule = await asyncModulePromise;
            if (pgid !== currentPgid) {
                return;
            }
            asyncModule.default(routeList);
            showPage();
        },
        [ServerRequestOptionKey.METHOD]: 'GET',
        [ServerRequestOptionKey.ALLOW_CREDENTIALS]: false,
    });
}
