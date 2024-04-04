import { parseObject, parseString } from './helper';

export type MediaSessionInfo = {
    readonly type: string;
    readonly credential: string;
};

export function parseMediaSessionInfo(mediaSessionInfo: unknown): MediaSessionInfo {
    const mediaSessionInfoObj = parseObject(mediaSessionInfo);
    return {
        type: parseString(mediaSessionInfoObj.type),
        credential: parseString(mediaSessionInfoObj.credential),
    };
}