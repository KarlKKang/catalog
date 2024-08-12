import { canPlay } from '.';

export function audioCanPlay(codecs: string): boolean {
    return canPlay('audio', 'mp4', codecs);
}
