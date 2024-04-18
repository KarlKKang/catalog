import { ServerRequestOptionProp, sendServerRequest } from '../module/server';
import { addClass, containsClass, getByClass, getParentElement } from '../module/dom/element';
import { addEventListener } from '../module/dom/event_listener';
import { changed as changedClass } from '../../css/console.module.scss';

let outputElement: HTMLDivElement | null = null;
export const initializedClass = 'initialized';

export function setOutputElement(elem: HTMLDivElement | null) {
    outputElement = elem;
}

export function getTable(type: string, callback?: () => void) {
    const param = {
        command: 'get',
        type: type
    };
    const paramString = JSON.stringify(param);

    sendServerRequest('console', {
        [ServerRequestOptionProp.CALLBACK]: function (response: string) {
            setOutput(response, callback);
        },
        [ServerRequestOptionProp.CONTENT]: 'p=' + encodeURIComponent(paramString)
    });
}

export function completeCallback(response: string, callback: () => void) {
    if (setOutput(response, callback)) {
        alert('Operation completed');
    }
}

export function setOutput(response: string, callback?: () => void, outputElementOverride?: HTMLElement) {
    const error = response.startsWith('ERROR:');
    if (error) {
        alert(response);
    } else {
        const outputTarget = outputElementOverride || outputElement;
        if (outputTarget === null) {
            throw new Error('Output element not set');
        }
        outputTarget.innerHTML = response;
        if (callback !== undefined) {
            callback();
        }

        let elems = getByClass('onchange');
        for (const elem of elems) {
            if (!containsClass(elem, initializedClass)) {
                addClass(elem, initializedClass);
                addEventListener(elem, 'change', () => {
                    changed(elem);
                });
            }
        }

        elems = getByClass('oninput');
        for (const elem of elems) {
            if (!containsClass(elem, initializedClass)) {
                addClass(elem, initializedClass);
                addEventListener(elem, 'input', () => {
                    changed(elem);
                });
            }
        }
    }
    return !error;
}

function changed(elem: Element) {
    addClass(getParentElement(elem), changedClass);
}