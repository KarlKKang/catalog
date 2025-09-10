import {
    addNavBar,
} from '../module/nav_bar';
import { NavBarPage } from '../module/nav_bar/enum';
import {
    sendAPIRequest,
    APIRequestOptionKey,
} from '../module/server/request';
import { parseResponse } from '../module/server/parse_response';
import { type ShowPageFunc } from '../module/global/type';
import { pgid } from '../module/global/pgid';
import { parseAccountInfo } from '../module/type/AccountInfo';
import { importModule } from '../module/import_module';

export default function (showPage: ShowPageFunc) {
    addNavBar(NavBarPage.MY_ACCOUNT);

    const asyncModulePromise = importModule(
        () => import(
            /* webpackExports: ["default"] */
            './async',
        ),
    );

    const currentPgid = pgid;
    sendAPIRequest('get_account', {
        [APIRequestOptionKey.CALLBACK]: async (response: string) => {
            const accountInfo = parseResponse(response, parseAccountInfo);
            const asyncModule = await asyncModulePromise;
            if (currentPgid !== pgid) {
                return;
            }
            asyncModule.default(accountInfo);
            showPage();
        },
        [APIRequestOptionKey.METHOD]: 'GET',
    });
}
