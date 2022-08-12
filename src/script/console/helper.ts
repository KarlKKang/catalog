import {
    sendServerRequest,
} from '../module/main';
import {
    addEventListener,
    getById,
    removeClass,
    getParent,
    addClass,
    getByClass
} from '../module/DOM';

export function getTable(type: string, callback?: () => void) {
    let param = {
        command: 'get',
        type: type
    };
    let paramString = JSON.stringify(param);

    sendServerRequest('console.php', {
        callback: function (response: string) {
            setOutput(response, callback);
        },
        content: "p=" + encodeURIComponent(paramString)
    });
}

export function completeCallback(response: string, callback: () => void) {
    if (setOutput(response, callback)) {
        alert('Operation completed');
    }
};

export function setOutput(response: string, callback?: () => void, outputElementID?: string) {
    if (outputElementID === undefined) {
        outputElementID = 'output';
    }
    var error = response.startsWith('ERROR:');
    if (error) {
        alert(response);
    } else {
        getById(outputElementID).innerHTML = response;
        if (callback !== undefined) {
            callback();
        }

        var elems = getByClass('onchange');
        for (let elem of elems) {
            removeClass(elem, 'onchange');
            addEventListener(elem, 'change', function () {
                changed(elem);
            });
        }

        elems = getByClass('oninput');
        for (let elem of elems) {
            removeClass(elem, 'oninput');
            addEventListener(elem, 'input', function () {
                changed(elem);
            });
        }
    }
    return !error;
}

function changed(elem: Element) {
    addClass(getParent(elem), 'changed');
}