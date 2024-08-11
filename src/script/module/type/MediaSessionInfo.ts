import { parseObject } from './internal/parse_object';
import { parseString } from './internal/parse_string';

export const enum MediaSessionInfoKey {
    TYPE,
    CREDENTIAL,
}
export interface MediaSessionInfo {
    readonly [MediaSessionInfoKey.TYPE]: string;
    readonly [MediaSessionInfoKey.CREDENTIAL]: string;
}

export function parseMediaSessionInfo(mediaSessionInfo: unknown): MediaSessionInfo {
    const mediaSessionInfoObj = parseObject(mediaSessionInfo);
    return {
        [MediaSessionInfoKey.TYPE]: parseString(mediaSessionInfoObj.type),
        [MediaSessionInfoKey.CREDENTIAL]: parseString(mediaSessionInfoObj.credential),
    };
}
