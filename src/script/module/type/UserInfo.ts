import {throwError, isObject, isString, isNumber} from './helper'

export interface UserInfo {
	email: string,
	username: string,
	invite_quota: number
};

export function check (userInfo: any) {
    if (!isObject(userInfo)) {
        throwError();
    }

    if (!isString(userInfo.email) || !isString(userInfo.username) || !isNumber(userInfo.invite_quota)) {
        throwError();
    }
}