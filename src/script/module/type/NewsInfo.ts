import { throwError, isObject, isString, isNumber } from './helper';

export type NewsInfo = {
    title: string,
    content: string,
    create_time: number,
    update_time: number | null
}

export function check(newsInfo: any) {
    if (!isObject(newsInfo)) {
        throwError();
    }

    if (!isNumber(newsInfo.create_time) || !isString(newsInfo.title) || !isString(newsInfo.content)) {
        throwError();
    }

    if (!isNumber(newsInfo.update_time) && newsInfo.update_time !== null) {
        throwError();
    }
}