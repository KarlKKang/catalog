import { throwError, isObject, isString } from './helper';

export interface LocalImageParam {
    src: string,
    title: string,
    authenticationToken: string,
    xhrParam: string
}

export function check(param: any) {
    if (!isObject(param)) {
        throwError();
    }

    if (!isString(param.src) || !isString(param.title) || !isString(param.authenticationToken) || !isString(param.xhrParam)) {
        throwError();
    }
}