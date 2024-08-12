import {
    addNavBar,
} from '../module/nav_bar';
import { NavBarPage } from '../module/nav_bar/enum';
import {
    sendServerRequest,
    ServerRequestOptionKey,
} from '../module/server/request';
import { parseResponse } from '../module/server/parse_response';
import { clearSessionStorage } from '../module/session_storage/clear';
import { pgid, type ShowPageFunc } from '../module/global';
import { addTimeout } from '../module/timer/add/timeout';
import { parseAccountInfo } from '../module/type/AccountInfo';
import { parseSession } from '../module/type/Sessions';
import { importModule } from '../module/import_module';

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();

    addNavBar(NavBarPage.MY_ACCOUNT);
    let resolveUIInit: () => void;
    const uiInitPromise = new Promise<void>((resolve) => {
        resolveUIInit = resolve;
    });
    const currentPgid = pgid;

    let getSessionsStarted = false;
    const getSessions = () => {
        if (getSessionsStarted) {
            return;
        }
        getSessionsStarted = true;
        const sessionsModuleImport = importModule(
            () => import(
                /* webpackExports: ["default"] */
                './sessions'
            ),
        );
        sendServerRequest('get_sessions', {
            [ServerRequestOptionKey.CALLBACK]: async (response: string) => {
                const sessionsModule = await sessionsModuleImport;
                await uiInitPromise;
                if (currentPgid !== pgid) {
                    return;
                }
                sessionsModule.default(parseResponse(response, parseSession));
            },
        });
    };
    addTimeout(getSessions, 1000); // In case the network latency is high, we might as well start the request early

    const asyncModulePromise = importModule(
        () => import(
            /* webpackExports: ["default"] */
            './async'
        ),
    );

    sendServerRequest('get_account', {
        [ServerRequestOptionKey.CALLBACK]: async (response: string) => {
            const userInfo = parseResponse(response, parseAccountInfo);
            const asyncModule = await asyncModulePromise;
            if (currentPgid !== pgid) {
                return;
            }
            asyncModule.default(userInfo);
            resolveUIInit();
            showPage();
            getSessions();
        },
        [ServerRequestOptionKey.METHOD]: 'GET',
    });
}
