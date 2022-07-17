import {
	DEVELOPMENT,
    LOGIN_URL
} from '../../../env/constant';
import { paramWithRedirect } from "./helper";

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
export const lazyloadSrcMissing = paramWithRedirect(body.lazyloadSrcMissing);
export const javascriptError = function(e: string) {
    return paramWithRedirect(body.javascriptError(e))
};
export const expired = {
    title: title.expired,
    message: body.expired,
    url: LOGIN_URL
};
export const emailChanged = {
    title: title.completed,
    message: body.emailChanged,
    color: 'green',
    url: LOGIN_URL
};
export const incompletedInvitation = {
    title: title.rejected,
    message: body.incompletedInvitation,
    url: LOGIN_URL
};
export const invitationOnly = {
    title: title.rejected,
    message: body.invitationOnly,
    url: LOGIN_URL
};
export const registerComplete = {
    title: title.completed,
    message: body.registerComplete,
    color: 'green',
    url: LOGIN_URL
};
export const emailSent = {
    title: title.emailSent,
    message: body.emailSent,
    color: 'green',
    url: LOGIN_URL
};
export const passwordChanged = {
    title: title.completed,
    message: body.passwordChanged,
    color: 'green',
    url: LOGIN_URL
};
export const specialRegistrationOnly = {
    title: title.rejected,
    message: body.specialRegistrationOnly,
    url: 'special_register'+(DEVELOPMENT?'.html':'')
};
export const unrecommendedBrowser = function (redirectURL: string) {
    return {
        title: title.unrecommendedBrowser,
        message: body.unrecommendedBrowser,
        color: 'orange', 
        url: redirectURL
    } as const;
};

export * as server from "./server";