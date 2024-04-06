import { parseNumber, parseObject, parseOptional, parseString, parseTypedArray } from './helper';

type Session = {
    readonly id: string | undefined;
    readonly ua: string;
    readonly ip: string;
    readonly country: string;
    readonly last_active_time: number;
    readonly login_time: number;
};
export type Sessions = readonly Session[];

export function parseSession(sessions: unknown): Sessions {
    return parseTypedArray(sessions, (session): Session => {
        const sessionObj = parseObject(session);
        return {
            id: parseOptional(sessionObj.id, parseString),
            ua: parseString(sessionObj.ua),
            ip: parseString(sessionObj.ip),
            country: parseString(sessionObj.country),
            last_active_time: parseNumber(sessionObj.last_active_time),
            login_time: parseNumber(sessionObj.login_time),
        };
    });
}