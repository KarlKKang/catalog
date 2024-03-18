import { d } from './document';
import { addClass, appendChild, removeClass, replaceChildren } from './element';
import { addEventListener } from './event_listener';

export function createElement(tag: string) {
    const elem = d.createElement(tag);
    return elem;
}

export function createDivElement() {
    return createElement('div') as HTMLDivElement;
}

export function createButtonElement(text?: string) {
    const elem = createElement('button') as HTMLButtonElement;
    addClass(elem, 'button');
    text === undefined || appendText(elem, text);
    return elem;
}

export function createSpanElement(text?: string) {
    const elem = createElement('span') as HTMLSpanElement;
    text === undefined || appendText(elem, text);
    return elem;
}

export function createParagraphElement(text?: string) {
    const elem = createElement('p') as HTMLParagraphElement;
    text === undefined || appendText(elem, text);
    return elem;
}

export function createCanvasElement() {
    return createElement('canvas') as HTMLCanvasElement;
}

export function createVideoElement() {
    return createElement('video') as HTMLVideoElement;
}

export function createAudioElement() {
    return createElement('audio') as HTMLAudioElement;
}

export function createSelectElement() {
    return createElement('select') as HTMLSelectElement;
}

export function createOptionElement() {
    return createElement('option') as HTMLOptionElement;
}

export function createHRElement() {
    return createElement('hr') as HTMLHRElement;
}

export function createBRElement() {
    return createElement('br') as HTMLBRElement;
}

export function createUListElement() {
    return createElement('ul') as HTMLUListElement;
}

export function createLIElement() {
    return createElement('li') as HTMLLIElement;
}

export function createAnchorElement() {
    return createElement('a') as HTMLAnchorElement;
}

export function createInputElement(type: string) {
    const elem = createElement('input') as HTMLInputElement;
    elem.type = type;
    return elem;
}

export function createSVGElement(viewBox: string, path: string) {
    const svg = d.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', viewBox);
    addSVGPath(svg, path);
    return svg;
}

function addSVGPath(svg: SVGSVGElement, path: string) {
    const svgPath = d.createElementNS('http://www.w3.org/2000/svg', 'path');
    svgPath.setAttribute('d', path);
    appendChild(svg, svgPath);
}

export function createTextNode(text: string) {
    return d.createTextNode(text);
}

export function appendText(parent: Node, content: string) {
    appendChild(parent, createTextNode(content));
}

export function replaceText(parent: Node, content: string) {
    replaceChildren(parent, createTextNode(content));
}

export function appendListItems(list: HTMLUListElement | HTMLOListElement, ...contents: string[]): void {
    for (const content of contents) {
        const item = createLIElement();
        appendText(item, content);
        appendChild(list, item);
    }
}

export function createEmailInput(placeholder = 'メールアドレス') {
    const container = createDivElement();
    addClass(container, 'input-field');
    const input = createInputElement('email');
    input.autocomplete = 'email';
    input.placeholder = placeholder;
    input.autocapitalize = 'off';
    input.maxLength = 254;
    appendChild(container, input);
    return [container, input] as const;
}

export function createPasswordInput(newPassword: boolean, placeholder = 'パスワード') {
    const container = createDivElement();
    addClass(container, 'input-field');
    const input = createInputElement('password');
    input.autocomplete = newPassword ? 'new-password' : 'current-password';
    input.placeholder = placeholder;
    passwordStyling(input);
    appendChild(container, input);
    return [container, input] as const;
}

export function passwordStyling(element: HTMLInputElement) {
    function inputChangeHandler() {
        if (element.value === '') {
            removeClass(element, 'password-font');
        } else {
            addClass(element, 'password-font');
        }
    }

    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value'); //The object returned is mutable but mutating it has no effect on the original property's configuration.
    if (descriptor !== undefined && descriptor.configurable) { // 'undefined' in Chrome prior to Chrome 43 (https://developer.chrome.com/blog/DOM-attributes-now-on-the-prototype-chain/), not configurable in Safari 9.
        const originalSet = descriptor.set;
        if (originalSet !== undefined) {
            // define our own setter
            descriptor.set = function (...args) {
                originalSet.apply(this, args);
                inputChangeHandler();
            };
            Object.defineProperty(element, 'value', descriptor);
        }
    }

    addEventListener(element, 'input', inputChangeHandler);
    addEventListener(element, 'change', inputChangeHandler);
}

export function createTotpInput(allowRecoveryCode: boolean) {
    const container = createDivElement();
    addClass(container, 'input-field');
    const input = createInputElement('text');
    input.autocomplete = 'one-time-code';
    input.placeholder = '認証コード';
    input.maxLength = allowRecoveryCode ? 32 : 6;
    appendChild(container, input);
    return [container, input] as const;
}