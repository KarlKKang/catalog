import { parseObject, parseString, parseTypedArray } from './helper';

export const enum PopInfoKey {
    LOCATION,
    COUNTRY,
    CODE,
}
export type PopInfo = {
    readonly [PopInfoKey.LOCATION]: string;
    readonly [PopInfoKey.COUNTRY]: string;
    readonly [PopInfoKey.CODE]: string;
};
export type PopsList = PopInfo[];

export function parsePopsList(popsList: unknown): PopsList {
    return parseTypedArray(popsList, (popInfo): PopInfo => {
        const popInfoObj = parseObject(popInfo);
        return {
            [PopInfoKey.LOCATION]: parseString(popInfoObj.location),
            [PopInfoKey.COUNTRY]: parseString(popInfoObj.country),
            [PopInfoKey.CODE]: parseString(popInfoObj.code),
        };
    });
}