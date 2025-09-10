import { ShowPageFunc } from '../module/global/type';
import { pgid } from '../module/global/pgid';
import { addNavBar } from '../module/nav_bar';
import { APIRequestOptionKey, sendAPIRequest } from '../module/api/request';
import { parseResponse } from '../module/api/parse_response';
import { parseRouteList } from '../module/type/RouteList';
import { importModule } from '../module/import_module';

export default function (showPage: ShowPageFunc) {
    addNavBar();

    const asyncModulePromise = importModule(
        () => import(
            /* webpackExports: ["default"] */
            './async',
        ),
    );

    sendAPIRequest('list_cn_routes', {
        [APIRequestOptionKey.CALLBACK]: async (response: string) => {
            const routeList = parseResponse(response, parseRouteList);

            const currentPgid = pgid;
            const asyncModule = await asyncModulePromise;
            if (pgid !== currentPgid) {
                return;
            }
            asyncModule.default(routeList);
            showPage();
        },
        [APIRequestOptionKey.METHOD]: 'GET',
        [APIRequestOptionKey.ALLOW_CREDENTIALS]: false,
    });
}
