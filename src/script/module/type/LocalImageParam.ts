import { isString } from '../main';
import { throwError, isObject } from './helper';

export interface LocalImageParam {
    baseURL: string;
    fileName: string;
    title: string;
    mediaSessionCredential: string | null;
    xhrParam: string;
}

export function check(param: any) {
    if (!isObject(param)) {
        throwError();
    }

    if (!isString(param.baseURL) || !isString(param.fileName) || !isString(param.title) || !isString(param.xhrParam)) {
        throwError();
    }

    if (!isString(param.mediaSessionCredential) && param.mediaSessionCredential !== null) {
        throwError();
    }
}