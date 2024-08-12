import { createElement } from '../internal/create_element';

export function createAudioElement() {
    return createElement('audio') as HTMLAudioElement;
}
