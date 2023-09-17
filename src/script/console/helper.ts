import {
    sendServerRequest,
} from '../module/main';
import {
    addEventListener,
    getById,
    getParentElement,
    addClass,
    getByClass,
    containsClass
} from '../module/dom';

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

export function setOutput(response: string, callback?: () => void, outputElementID?: string) {
    if (outputElementID === undefined) {
        outputElementID = 'output';
    }
    const error = response.startsWith('ERROR:');
    if (error) {
        alert(response);
    } else {
        getById(outputElementID).innerHTML = response;
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