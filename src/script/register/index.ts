import { APIRequestOptionKey, sendAPIRequest } from '../module/api/request';
import { getSearchParam } from '../module/dom/location/get/search_param';
import { showMessage } from '../module/message';
import { expired } from '../module/message/param/expired';
import { type ShowPageFunc } from '../module/global/type';
import { pgid } from '../module/global/pgid';
import { invalidResponse } from '../module/message/param/invalid_response';
import { importModule } from '../module/import_module';
import { emailAlreadyRegistered } from './shared';
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
    sendAPIRequest('register', {
        [APIRequestOptionKey.CALLBACK]: function (response: string) {
            if (response === 'EXPIRED') {
                showMessage(expired);
            } else if (response === 'ALREADY REGISTERED') {
                showMessage(emailAlreadyRegistered);
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
