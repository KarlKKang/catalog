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

    const runAsyncModule = async (asyncModulePromise: ReturnType<typeof getAsyncModulePromise>, param: string) => {
        const currentPgid = pgid;
        const asyncModule = await asyncModulePromise;
        if (pgid !== currentPgid) {
            return;
        }
        asyncModule.default(param);
        showPage();
    };

    const param = getSearchParam('p');
    if (param === null || !/^[a-zA-Z0-9~_-]+$/.test(param)) {
        if (ENABLE_DEBUG) {
            runAsyncModule(getAsyncModulePromise(), 'test');
        } else {
            showMessage(expired);
        }
        return;
    }

    const asyncModulePromise = getAsyncModulePromise();
    sendAPIRequest('change_email', {
        [APIRequestOptionKey.CALLBACK]: (response: string) => {
            if (response === 'EXPIRED') {
                showMessage(expired);
            } else if (response === 'APPROVED') {
                runAsyncModule(asyncModulePromise, param);
            } else {
                showMessage(invalidResponse(true));
            }
        },
        [APIRequestOptionKey.CONTENT]: buildHttpForm({ p: param }),
        [APIRequestOptionKey.CLOSE_WINDOW_ON_ERROR]: true,
    });
}
