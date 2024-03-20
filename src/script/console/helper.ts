import { sendServerRequest } from '../module/server';
import {
    addEventListener,
    getParentElement,
    addClass,
    getByClass,
    containsClass
} from '../module/dom';

let outputElement: HTMLDivElement | null = null;

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
        callback: function (response: string) {
            setOutput(response, callback);
        },
        content: 'p=' + encodeURIComponent(paramString)
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
            if (!containsClass(elem, 'initialized')) {
                addClass(elem, 'initialized');
                addEventListener(elem, 'change', () => {
                    changed(elem);
                });
            }
        }

        elems = getByClass('oninput');
        for (const elem of elems) {
            if (!containsClass(elem, 'initialized')) {
                addClass(elem, 'initialized');
                addEventListener(elem, 'input', () => {
                    changed(elem);
                });
            }
        }
    }
    return !error;
}

function changed(elem: Element) {
    addClass(getParentElement(elem), 'changed');
}