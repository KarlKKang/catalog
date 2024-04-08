import {
    addNavBar
} from '../module/nav_bar';
import { NavBarPage } from '../module/nav_bar/enum';
import {
    sendServerRequest,
    ServerRequestOptionProp,
    parseResponse
} from '../module/server';
import {
    clearSessionStorage,
} from '../module/dom';
import { showMessage } from '../module/message';
import { pgid, type ShowPageFunc } from '../module/global';
import { moduleImportError } from '../module/message/param';
import { addTimeout } from '../module/timer';
import { parseAccountInfo } from '../module/type/AccountInfo';
import { parseSession } from '../module/type/Sessions';

let offloadModule: (() => void) | null = null;

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
        const sessionsModuleImport = getModulePromise(
            import(
                /* webpackExports: ["default"] */
                './sessions'
            )
        );
        sendServerRequest('get_sessions', {
            [ServerRequestOptionProp.CALLBACK]: async (response: string) => {
                const sessionsModule = await sessionsModuleImport;
                await uiInitPromise;
                if (currentPgid !== pgid) {
                    return;
                }
                sessionsModule.default(parseResponse(response, parseSession));
            }
        });
    };
    addTimeout(getSessions, 1000); // In case the network latency is high, we might as well start the request early

    const asyncModulePromise = getModulePromise(
        import(
            /* webpackExports: ["default", "offload"] */
            './async'
        )
    );

    sendServerRequest('get_account', {
        [ServerRequestOptionProp.CALLBACK]: async (response: string) => {
            const userInfo = parseResponse(response, parseAccountInfo);
            const asyncModule = await asyncModulePromise;
            if (currentPgid !== pgid) {
                return;
            }
            offloadModule = asyncModule.offload;
            asyncModule.default(userInfo);
            resolveUIInit();
            showPage();
            getSessions();
        },
        [ServerRequestOptionProp.METHOD]: 'GET',
    });
}

async function getModulePromise<T>(importPromise: Promise<T>) {
    const currentPgid = pgid;
    let module: T;
    try {
        module = await importPromise;
    } catch (e) {
        if (currentPgid === pgid) {
            showMessage(moduleImportError);
        }
        throw e;
    }
    return module;
}

export function offload() {
    if (offloadModule !== null) {
        offloadModule();
        offloadModule = null;
    }
}