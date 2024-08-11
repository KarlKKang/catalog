import { createElement } from '../internal';

export function createIframeElement() {
    return createElement('iframe') as HTMLIFrameElement;
}
