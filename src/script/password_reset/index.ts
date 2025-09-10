import { APIRequestOptionKey, sendAPIRequest } from '../module/server/request';
import { getSearchParam } from '../module/dom/location/get/search_param';
import { showMessage } from '../module/message';
import { expired } from '../module/message/param/expired';
import { type ShowPageFunc } from '../module/global/type';
import { pgid } from '../module/global/pgid';
import { invalidResponse } from '../module/message/param/invalid_response';
import { importModule } from '../module/import_module';
import { buildHttpForm } from '../module/string/http_form/build';

export default function (showPage: ShowPageFunc) {
    const getAsyncModulePromise = () => importModule(
        () => import(
            /* webpackExports: ["default"] */
            './async',
        ),
    );
    const runAsyncModule = async (asyncModulePromise: ReturnType<typeof getAsyncModulePromise>, user: string, signature: string, expires: string) => {
        const currentPgid = pgid;
        const asyncModule = await asyncModulePromise;
        if (pgid !== currentPgid) {
            return;
        }
        asyncModule.default(user, signature, expires);
        showPage();
    };

    const user = getSearchParam('user');
    const signature = getSearchParam('signature');
    const expires = getSearchParam('expires');

    if (user === null || !/^[a-zA-Z0-9~_-]+$/.test(user)) {
        if (ENABLE_DEBUG) {
            runAsyncModule(getAsyncModulePromise(), 'test', 'test', 'test');
        } else {
            showMessage(expired);
        }
        return;
    }

    if (signature === null || !/^[a-zA-Z0-9~_-]+$/.test(signature)) {
        showMessage(expired);
        return;
    }

    if (expires === null || !/^[0-9]+$/.test(expires)) {
        showMessage(expired);
        return;
    }

    const asyncModulePromise = getAsyncModulePromise();
    sendAPIRequest('reset_password', {
        [APIRequestOptionKey.CALLBACK]: function (response: string) {
            if (response === 'EXPIRED') {
                showMessage(expired);
                return;
            } else if (response !== 'APPROVED') {
                showMessage(invalidResponse(true));
                return;
            }
            runAsyncModule(asyncModulePromise, user, signature, expires);
        },
        [APIRequestOptionKey.CONTENT]: buildHttpForm({ user: user, signature: signature, expires: expires }),
        [APIRequestOptionKey.CLOSE_WINDOW_ON_ERROR]: true,
    });
}
