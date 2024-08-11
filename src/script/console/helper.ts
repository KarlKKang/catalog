import { ServerRequestOptionProp, sendServerRequest } from '../module/server';
import { getByClass, getParentElement } from '../module/dom/get_element';
import { addClass, containsClass } from '../module/dom/class';
import { addEventListener } from '../module/event_listener';
import { changed as changedClass } from '../../css/console.module.scss';
import { buildURLForm } from '../module/http_form';
import { addOffloadCallback } from '../module/global';

let outputElement: HTMLDivElement | null = null;
export const initializedClass = 'initialized';

export function setOutputElement(elem: HTMLDivElement) {
    addOffloadCallback(dereferenceOutputElement);
    outputElement = elem;
}

function dereferenceOutputElement() {
    outputElement = null;
}

export function getTable(type: string, callback?: () => void) {
    const param = {
        command: 'get',
        type: type,
    };

    sendServerRequest('console', {
        [ServerRequestOptionProp.CALLBACK]: function (response: string) {
            setOutput(response, callback);
        },
        [ServerRequestOptionProp.CONTENT]: buildURLForm({ p: JSON.stringify(param) }),
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
