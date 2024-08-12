import { canPlay } from '.';

export function videoCanPlay(codecs: string): boolean {
    return canPlay('video', 'mp4', codecs);
}
