import {
    sendServerRequest,
} from '../module/common';
import {
    addEventListener,
    getParentElement,
    getDescendantsByClassAt,
    getByClass,
    addClass,
    containsClass,
    getDataAttribute
} from '../module/dom';
import type { RedirectFunc } from '../module/type/RedirectFunc';

import { completeCallback, getTable } from './helper';

let redirect: RedirectFunc;

export function getNewsTable(_redirect: RedirectFunc) {
    redirect = _redirect;
    getTable(redirect, 'news', updateEventHandlers);
}

function modifyNews(button: Element) {
    const recordElem = getParentElement(getParentElement(button));
    const id = getDescendantsByClassAt(recordElem, 'id', 0).innerHTML;
    const title = (getDescendantsByClassAt(recordElem, 'title', 0) as HTMLTextAreaElement).value;
    const isPublic = (getDescendantsByClassAt(recordElem, 'public', 0) as HTMLInputElement).checked;

    const record = parseNewsRecord(id, title, isPublic);
    if (!record) {
        return;
    }

    const param = {
        command: 'modify',
        type: 'news',
        ...record
    };

    let confirm;
    do {
        confirm = prompt('Type "modify" to confirm.');
        if (confirm === null) {
            return;
        }
    } while (confirm != 'modify');

    sendServerRequest(redirect, 'console', {
        callback: function (response: string) {
            completeCallback(response, updateEventHandlers);
        },
        content: 'p=' + encodeURIComponent(JSON.stringify(param))
    });
}

function deleteNews(id: string) {

    let confirm;
    do {
        confirm = prompt('Type "delete" to confirm.');
        if (confirm === null) {
            return;
        }
    } while (confirm != 'delete');

    const param = {
        command: 'delete',
        type: 'news',
        id: id
    };

    sendServerRequest(redirect, 'console', {
        callback: (response) => { completeCallback(response, updateEventHandlers); },
        content: 'p=' + encodeURIComponent(JSON.stringify(param))
    });
}

function addNews(button: Element) {
    const recordElem = getParentElement(getParentElement(button));
    const id = (getDescendantsByClassAt(recordElem, 'id', 0) as HTMLTextAreaElement).value;
    const title = (getDescendantsByClassAt(recordElem, 'title', 0) as HTMLTextAreaElement).value;

    const record = parseNewsRecord(id, title, false);
    if (!record) {
        return;
    }

    const param = {
        command: 'insert',
        type: 'news',
        ...record
    };

    let confirm;
    do {
        confirm = prompt('Type "insert" to confirm.');
        if (confirm === null) {
            return;
        }
    } while (confirm != 'insert');

    sendServerRequest(redirect, 'console', {
        callback: function (response: string) {
            completeCallback(response, updateEventHandlers);
        },
        content: 'p=' + encodeURIComponent(JSON.stringify(param))
    });
}

function parseNewsRecord(id: string, title: string, isPublic: boolean) {
    if (id == '') {
        alert('ERROR: "id" is required');
        return false;
    }

    if (!/^[a-zA-Z0-9~_-]+$/.test(id)) {
        alert('ERROR: Invalid value for "id"');
        return false;
    }

    if (title == '') {
        alert('ERROR: "title" is required');
        return false;
    }

    return {
        id: id,
        title: title,
        public: isPublic
    };
}

function updateNewsTime(id: string) {
    const param = {
        command: 'updatetime',
        type: 'news',
        id: id
    };

    sendServerRequest(redirect, 'console', {
        callback: (response) => { completeCallback(response, updateEventHandlers); },
        content: 'p=' + encodeURIComponent(JSON.stringify(param))
    });
}

function updateEventHandlers() {
    let buttons = getByClass('add-news');
    for (const button of buttons) {
        if (!containsClass(button, 'initialized')) {
            addClass(button, 'initialized');
            addEventListener(button, 'click', () => {
                addNews(button);
            });
        }
    }

    buttons = getByClass('modify-news');
    for (const button of buttons) {
        if (!containsClass(button, 'initialized')) {
            addClass(button, 'initialized');
            addEventListener(button, 'click', () => {
                modifyNews(button);
            });
        }
    }

    buttons = getByClass('update-news-time');
    for (const button of (buttons as HTMLCollectionOf<HTMLElement>)) {
        if (!containsClass(button, 'initialized')) {
            addClass(button, 'initialized');
            addEventListener(button, 'click', () => {
                const id = getDataAttribute(button, 'id');
                if (id === null) {
                    alert('ERROR: "id" attribute on the element is undefined.');
                    return;
                }
                updateNewsTime(id);
            });
        }
    }

    buttons = getByClass('delete-news');
    for (const button of (buttons as HTMLCollectionOf<HTMLElement>)) {
        if (!containsClass(button, 'initialized')) {
            addClass(button, 'initialized');
            addEventListener(button, 'click', () => {
                const id = getDataAttribute(button, 'id');
                if (id === null) {
                    alert('ERROR: "id" attribute on the element is undefined.');
                    return;
                }
                deleteNews(id);
            });
        }
    }
}