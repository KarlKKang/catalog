import { ServerRequestOptionProp, sendServerRequest } from '../module/server';
import { addClass, containsClass, getByClass, getDataAttribute, getDescendantsByClassAt, getParentElement } from '../module/dom/element';
import { addEventListener } from '../module/event_listener';
import { completeCallback, getTable, initializedClass } from './helper';
import { buildURLForm } from '../module/common/pure';

export function getNewsTable() {
    getTable('news', updateEventHandlers);
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
        ...record,
    };

    let confirm;
    do {
        confirm = prompt('Type "modify" to confirm.');
        if (confirm === null) {
            return;
        }
    } while (confirm !== 'modify');

    sendServerRequest('console', {
        [ServerRequestOptionProp.CALLBACK]: function (response: string) {
            completeCallback(response, updateEventHandlers);
        },
        [ServerRequestOptionProp.CONTENT]: buildURLForm({ p: JSON.stringify(param) }),
    });
}

function deleteNews(id: string) {
    let confirm;
    do {
        confirm = prompt('Type "delete" to confirm.');
        if (confirm === null) {
            return;
        }
    } while (confirm !== 'delete');

    const param = {
        command: 'delete',
        type: 'news',
        id: id,
    };

    sendServerRequest('console', {
        [ServerRequestOptionProp.CALLBACK]: (response) => { completeCallback(response, updateEventHandlers); },
        [ServerRequestOptionProp.CONTENT]: buildURLForm({ p: JSON.stringify(param) }),
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
        ...record,
    };

    let confirm;
    do {
        confirm = prompt('Type "insert" to confirm.');
        if (confirm === null) {
            return;
        }
    } while (confirm !== 'insert');

    sendServerRequest('console', {
        [ServerRequestOptionProp.CALLBACK]: function (response: string) {
            completeCallback(response, updateEventHandlers);
        },
        [ServerRequestOptionProp.CONTENT]: buildURLForm({ p: JSON.stringify(param) }),
    });
}

function parseNewsRecord(id: string, title: string, isPublic: boolean) {
    if (id === '') {
        alert('ERROR: "id" is required');
        return false;
    }

    if (!/^[a-zA-Z0-9~_-]+$/.test(id)) {
        alert('ERROR: Invalid value for "id"');
        return false;
    }

    if (title === '') {
        alert('ERROR: "title" is required');
        return false;
    }

    return {
        id: id,
        title: title,
        public: isPublic,
    };
}

function updateNewsTime(id: string) {
    const param = {
        command: 'updatetime',
        type: 'news',
        id: id,
    };

    sendServerRequest('console', {
        [ServerRequestOptionProp.CALLBACK]: (response) => { completeCallback(response, updateEventHandlers); },
        [ServerRequestOptionProp.CONTENT]: buildURLForm({ p: JSON.stringify(param) }),
    });
}

function updateEventHandlers() {
    let buttons = getByClass('add-news');
    for (const button of buttons) {
        if (!containsClass(button, initializedClass)) {
            addClass(button, initializedClass);
            addEventListener(button, 'click', () => {
                addNews(button);
            });
        }
    }

    buttons = getByClass('modify-news');
    for (const button of buttons) {
        if (!containsClass(button, initializedClass)) {
            addClass(button, initializedClass);
            addEventListener(button, 'click', () => {
                modifyNews(button);
            });
        }
    }

    buttons = getByClass('update-news-time');
    for (const button of (buttons as HTMLCollectionOf<HTMLElement>)) {
        if (!containsClass(button, initializedClass)) {
            addClass(button, initializedClass);
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
        if (!containsClass(button, initializedClass)) {
            addClass(button, initializedClass);
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
