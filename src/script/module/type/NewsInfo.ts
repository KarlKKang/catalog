import { isString } from '../main';
import { throwError, isObject, isNumber } from './helper';

export type NewsInfo = {
    title: string;
    create_time: number;
    update_time: number | null;
};

export function check(newsInfo: any) {
    if (!isObject(newsInfo)) {
        throwError();
    }

    if (!isNumber(newsInfo.create_time) || !isString(newsInfo.title)) {
        throwError();
    }

    if (!isNumber(newsInfo.update_time) && newsInfo.update_time !== null) {
        throwError();
    }
}