import { createElement } from '../internal';

export function createAudioElement() {
    return createElement('audio') as HTMLAudioElement;
}
