import { ServerRequestOptionKey, sendServerRequest } from '../module/server/request';
import { getDescendantsByClass, getParentElement } from '../module/dom/get_element';
import { addClass } from '../module/dom/class/add';
import { containsClass } from '../module/dom/class/contains';
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

export function getTable(type: string, callback?: (outputElem: HTMLElement) => void) {
    const param = {
        command: 'get',
        type: type,
    };

    sendServerRequest('console', {
        [ServerRequestOptionKey.CALLBACK]: function (response: string) {
            setOutput(response, callback);
        },
        [ServerRequestOptionKey.CONTENT]: buildURLForm({ p: JSON.stringify(param) }),
    });
}

export function completeCallback(response: string, callback: (outputElem: HTMLElement) => void) {
    if (setOutput(response, callback)) {
        alert('Operation completed');
    }
}

export function setOutput(response: string, callback?: (outputElem: HTMLElement) => void, outputElementOverride?: HTMLElement) {
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
            callback(outputTarget);
        }

        let elems = getDescendantsByClass(outputTarget, 'onchange');
        for (const elem of elems) {
            if (!containsClass(elem, initializedClass)) {
                addClass(elem, initializedClass);
                addEventListener(elem, 'change', () => {
                    changed(elem);
                });
            }
        }

        elems = getDescendantsByClass(outputTarget, 'oninput');
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
