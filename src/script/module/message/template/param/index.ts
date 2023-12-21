import {
    LOGIN_URL, TOP_URL
} from '../../../env/constant';

import * as body from '../body';
import { MessageParam, nextButtonText } from '../comm';
import * as title from '../title';

export const moduleImportError = (e: unknown) => ({
    message: body.moduleImportError(e)
});
export const expired = {
    title: title.expired,
    message: body.expired,
    buttonText: null
};
export const emailAlreadyRegistered = {
    title: title.failed,
    message: body.emailAlreadyRegistered,
    buttonText: null
};
export const emailChanged = {
    title: title.completed,
    message: body.emailChanged,
    color: 'green',
    url: TOP_URL,
    buttonText: 'トップページへ'
};
export const registerComplete = {
    title: title.completed,
    message: body.registerComplete,
    color: 'green',
    url: LOGIN_URL,
    buttonText: nextButtonText
};
export const emailSent = (goBackUrl?: string) => {
    const param: MessageParam = {
        title: title.emailSent,
        message: body.emailSent,
        color: 'green',
    };
    if (goBackUrl === undefined) {
        param.buttonText = null;
    } else {
        param.url = goBackUrl;
    }
    return param;
};
export const passwordChanged = {
    title: title.completed,
    message: body.passwordChanged,
    color: 'green',
    url: LOGIN_URL,
    buttonText: nextButtonText
};
export const unrecommendedBrowser = (redirectURL: string) => ({
    title: title.unrecommendedBrowser,
    message: body.unrecommendedBrowser,
    color: 'orange',
    url: redirectURL,
    buttonText: nextButtonText
} as const);
export const insufficientPermissions = {
    title: title.insufficientPermissions,
    message: body.insufficientPermissions,
    color: 'red',
    url: TOP_URL
};