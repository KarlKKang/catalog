import { parseNumber, parseObject, parseString } from './helper';

export type NewsInfo = {
    readonly title: string;
    readonly create_time: number;
    readonly update_time: number | null;
    readonly credential: string;
};

export function parseNewsInfo(newsInfo: unknown): NewsInfo {
    const newsInfoObj = parseObject(newsInfo);
    const updateTime = newsInfoObj.update_time;
    return {
        title: parseString(newsInfoObj.title),
        create_time: parseNumber(newsInfoObj.create_time),
        update_time: updateTime === null ? null : parseNumber(updateTime),
        credential: parseString(newsInfoObj.credential),
    };
}