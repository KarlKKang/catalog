import { parseArray, parseNumber, parseObject, parseString } from './helper';

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
    const sessionArr = parseArray(sessions);
    const sessionArrParsed: Session[] = [];
    for (const session of sessionArr) {
        const sessionObj = parseObject(session);
        const id = sessionObj.id;
        sessionArrParsed.push({
            id: id === undefined ? undefined : parseString(id),
            ua: parseString(sessionObj.ua),
            ip: parseString(sessionObj.ip),
            country: parseString(sessionObj.country),
            last_active_time: parseNumber(sessionObj.last_active_time),
            login_time: parseNumber(sessionObj.login_time),
        });
    }
    return sessionArrParsed;
}