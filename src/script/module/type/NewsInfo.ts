import { parseNumber, parseObject, parseOptional, parseString } from './helper';

export type NewsInfo = {
    readonly title: string;
    readonly create_time: number;
    readonly update_time: number | undefined;
    readonly credential: string;
};

export function parseNewsInfo(newsInfo: unknown): NewsInfo {
    const newsInfoObj = parseObject(newsInfo);
    return {
        title: parseString(newsInfoObj.title),
        create_time: parseNumber(newsInfoObj.create_time),
        update_time: parseOptional(newsInfoObj.update_time, parseNumber),
        credential: parseString(newsInfoObj.credential),
    };
}