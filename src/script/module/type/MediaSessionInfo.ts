import { parseObject, parseString } from './helper';

export const enum MediaSessionInfoKey {
    TYPE,
    CREDENTIAL,
}
export type MediaSessionInfo = {
    readonly [MediaSessionInfoKey.TYPE]: string;
    readonly [MediaSessionInfoKey.CREDENTIAL]: string;
};

export function parseMediaSessionInfo(mediaSessionInfo: unknown): MediaSessionInfo {
    const mediaSessionInfoObj = parseObject(mediaSessionInfo);
    return {
        [MediaSessionInfoKey.TYPE]: parseString(mediaSessionInfoObj.type),
        [MediaSessionInfoKey.CREDENTIAL]: parseString(mediaSessionInfoObj.credential),
    };
}