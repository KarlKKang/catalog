import { throwError, isObject, isString } from './helper';

export type MediaSessionInfo = {
    type: string;
    credential: string;
};

export function check(mediaSessionInfo: any) {
    if (!isObject(mediaSessionInfo)) {
        throwError();
    }

    if (!isString(mediaSessionInfo.type) || !isString(mediaSessionInfo.credential)) {
        throwError();
    }
}