import {
    addNavBar,
} from '../module/nav_bar';
import { NavBarPage } from '../module/nav_bar/enum';
import {
    sendServerRequest,
    ServerRequestOptionKey,
} from '../module/server/request';
import { parseResponse } from '../module/server/parse_response';
import { type ShowPageFunc } from '../module/global/type';
import { pgid } from '../module/global/pgid';
import { addTimeout } from '../module/timer/add/timeout';
import { AccountInfoKey, parseAccountInfo } from '../module/type/AccountInfo';
import { parseSession } from '../module/type/Sessions';
import { importModule } from '../module/import_module';
import { removeTimeout } from '../module/timer/remove/timeout';

export default function (showPage: ShowPageFunc) {
    addNavBar(NavBarPage.MY_ACCOUNT);
    const currentPgid = pgid;

    let getSessionsStarted = false;
    let sessionsModuleCallback: ((accountID: string, sessionsContainer: HTMLElement) => void) | null = null;
    let sessionsParameters: [string, HTMLElement] | null = null;
    const getSessions = () => {
        const sessionsModuleImport = importModule(
            () => import(
                /* webpackExports: ["default"] */
                './sessions'
            ),
        );
        sendServerRequest('get_sessions', {
            [ServerRequestOptionKey.CALLBACK]: async (response: string) => {
                const sessionsModule = await sessionsModuleImport;
                if (sessionsParameters !== null) {
                    sessionsModule.default(parseResponse(response, parseSession), ...sessionsParameters);
                } else {
                    sessionsModuleCallback = (accountID: string, sessionsContainer: HTMLElement) => {
                        sessionsModule.default(parseResponse(response, parseSession), accountID, sessionsContainer);
                    };
                }
            },
        });
    };
    const getSessionStartTimeout = addTimeout(() => {
        getSessionsStarted = true;
        getSessions();
    }, 1000); // In case the network latency is high, we might as well start the request early

    const asyncModulePromise = importModule(
        () => import(
            /* webpackExports: ["default"] */
            './async'
        ),
    );

    sendServerRequest('get_account', {
        [ServerRequestOptionKey.CALLBACK]: async (response: string) => {
            const accountInfo = parseResponse(response, parseAccountInfo);
            const asyncModule = await asyncModulePromise;
            if (currentPgid !== pgid) {
                return;
            }
            asyncModule.default(accountInfo, (_sessionsContainer: HTMLElement) => {
                if (sessionsModuleCallback !== null) {
                    sessionsModuleCallback(accountInfo[AccountInfoKey.ID], _sessionsContainer);
                } else {
                    sessionsParameters = [accountInfo[AccountInfoKey.ID], _sessionsContainer];
                }
            });
            showPage();
            if (!getSessionsStarted) {
                removeTimeout(getSessionStartTimeout);
                getSessions();
            }
        },
        [ServerRequestOptionKey.METHOD]: 'GET',
    });
}
