import { throwError, isObject, isString, isBoolean } from './helper';
export interface LocalMessageParam {
    message: string;
    title: string;
    color: string;
    logout: boolean;
    url: string | null;
    htmlTitle: string;
}

export function check(localMessageParam: any) {
    if (!isObject(localMessageParam)) {
        throwError();
    }

    if (!isString(localMessageParam.message) || !isString(localMessageParam.title) || !isString(localMessageParam.color) || !isBoolean(localMessageParam.logout) || !isString(localMessageParam.htmlTitle)) {
        throwError();
    }

    if (!isString(localMessageParam.url) && localMessageParam.url !== null) {
        throwError();
    }
}