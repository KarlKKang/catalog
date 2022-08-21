import { throwError, isObject, isString } from './helper';

export interface LocalImageParam {
    baseURL: string,
    fileName: string,
    title: string,
    authenticationToken: string,
    xhrParam: string
}

export function check(param: any) {
    if (!isObject(param)) {
        throwError();
    }

    if (!isString(param.baseURL) || !isString(param.fileName) || !isString(param.title) || !isString(param.authenticationToken) || !isString(param.xhrParam)) {
        throwError();
    }
}