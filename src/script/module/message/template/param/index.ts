import {
    LOGIN_URL
} from '../../../env/constant';

import * as body from "../body";
import * as title from "../title";

export const moduleImportError = function (e: unknown) {
    return {
        message: body.moduleImportError(e)
    };
};
export const cssVarError = function (e: string) {
    return {
        message: body.cssVarError(e)
    };
};
export const expired = {
    title: title.expired,
    message: body.expired,
    url: LOGIN_URL
};
export const emailAlreadyRegistered = {
    title: title.failed,
    message: body.emailAlreadyRegistered,
    url: LOGIN_URL
}
export const emailChanged = {
    title: title.completed,
    message: body.emailChanged,
    color: 'green',
    url: LOGIN_URL
};
export const registerComplete = {
    title: title.completed,
    message: body.registerComplete,
    color: 'green',
    url: LOGIN_URL
};
export const emailSent = function (url: string) {
    return {
        title: title.emailSent,
        message: body.emailSent,
        color: 'green',
        url: url
    };
};
export const passwordChanged = {
    title: title.completed,
    message: body.passwordChanged,
    color: 'green',
    url: LOGIN_URL
};
export const unrecommendedBrowser = function (redirectURL: string) {
    return {
        title: title.unrecommendedBrowser,
        message: body.unrecommendedBrowser,
        color: 'orange',
        url: redirectURL
    } as const;
};