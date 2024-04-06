import { parseNumber, parseObject, parseString, parseTypedArray } from './helper';

type AllNewsInfoEntry = {
    readonly id: string;
    readonly title: string;
    readonly update_time: number;
};
export type AllNewsInfoEntries = readonly AllNewsInfoEntry[];
export type Pivot = 'EOF' | number;
export type AllNewsInfo = {
    readonly news: AllNewsInfoEntries;
    readonly pivot: Pivot;
};

export function parseAllNewsInfo(allNewsInfo: unknown): AllNewsInfo {
    const allNewsInfoObj = parseObject(allNewsInfo);
    const news = parseTypedArray(allNewsInfoObj.news, (allNewsEntry): AllNewsInfoEntry => {
        const allNewsInfoEntryObj = parseObject(allNewsEntry);
        return {
            id: parseString(allNewsInfoEntryObj.id),
            title: parseString(allNewsInfoEntryObj.title),
            update_time: parseNumber(allNewsInfoEntryObj.update_time),
        };
    });
    const pivot = allNewsInfoObj.pivot;
    return {
        news: news,
        pivot: pivot === 'EOF' ? pivot : parseNumber(pivot),
    };
}