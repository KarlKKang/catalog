import { isArray, isNumber, isObject, isString, throwError } from './helper';

export type Sessions = {
    id?: string;
    ua: string;
    ip: string;
    country: string;
    last_active_time: number;
    login_time: number;
}[];

export function check(sessions: any) {
    if (!isArray(sessions)) {
        throwError();
    }

    for (const session of sessions) {
        if (!isObject(session)) {
            throwError();
        }

        if (!isString(session.ua) || !isString(session.ip) || !isString(session.country) || !isNumber(session.last_active_time) || !isNumber(session.login_time)) {
            throwError();
        }

        if (session.id !== undefined && !isString(session.id)) {
            throwError();
        }
    }
}