import { createElement } from '../internal';

export function createVideoElement() {
    return createElement('video') as HTMLVideoElement;
}
