import { parseObject } from './internal/parse_object';
import { parseNumber } from './internal/parse_number';
import { parseTypedArray } from './internal/parse_array/typed';
import { parseString } from './internal/parse_string';
import { parseOptional } from './internal/parse_optional';

export const enum SessionKey {
    ID,
    UA,
    IP,
    COUNTRY,
    LAST_ACTIVE_TIME,
    LOGIN_TIME,
}
interface Session {
    readonly [SessionKey.ID]: string | undefined;
    readonly [SessionKey.UA]: string;
    readonly [SessionKey.IP]: string;
    readonly [SessionKey.COUNTRY]: string;
    readonly [SessionKey.LAST_ACTIVE_TIME]: number;
    readonly [SessionKey.LOGIN_TIME]: number;
}
export type Sessions = readonly Session[];

export function parseSession(sessions: unknown): Sessions {
    return parseTypedArray(sessions, (session): Session => {
        const sessionObj = parseObject(session);
        return {
            [SessionKey.ID]: parseOptional(sessionObj.id, parseString),
            [SessionKey.UA]: parseString(sessionObj.ua),
            [SessionKey.IP]: parseString(sessionObj.ip),
            [SessionKey.COUNTRY]: parseString(sessionObj.country),
            [SessionKey.LAST_ACTIVE_TIME]: parseNumber(sessionObj.last_active_time),
            [SessionKey.LOGIN_TIME]: parseNumber(sessionObj.login_time),
        };
    });
}
