import {
    sendServerRequest,
} from '../module/main';
import {
    addEventListener,
    getParentElement,
    getDescendantsByClassAt,
    getByClass,
    addClass,
    containsClass,
    getDataAttribute
} from '../module/dom';

import { completeCallback, getTable } from './helper';

function newsCompleteCallback(response: string) {
    completeCallback(response, updateEventHandlers);
}

export function getNewsTable() {
    getTable('news', updateEventHandlers);
}

function modifyNews(button: Element) {
    const recordElem = getParentElement(getParentElement(button));
    const id = getDescendantsByClassAt(recordElem, 'id', 0).innerHTML;
    const title = (getDescendantsByClassAt(recordElem, 'title', 0) as HTMLTextAreaElement).value;
    const content = (getDescendantsByClassAt(recordElem, 'content', 0) as HTMLTextAreaElement).value;
    const isPublic = (getDescendantsByClassAt(recordElem, 'public', 0) as HTMLInputElement).checked;

    const record = parseNewsRecord(id, title, content, isPublic);
    if (!record) {
        return;
    }

    const contentChunks = splitContent(record.content);
    const nextChunk = contentChunks.shift();

    const parsedRecord: {
        id: string;
        title: string;
        content?: string;
        public: boolean;
        end: boolean;
    } = {
        ...record,
        end: nextChunk === undefined
    };
    delete parsedRecord.content;

    const param = {
        command: 'modify',
        type: 'news',
        ...parsedRecord
    };

    let confirm;
    do {
        confirm = prompt('Type "modify" to confirm.');
        if (confirm === null) {
            return;
        }
    } while (confirm != 'modify');

    sendServerRequest('console', {
        callback: function (response: string) {
            if (nextChunk === undefined) {
                newsCompleteCallback(response);
                return;
            }
            if (response.startsWith('ERROR:')) {
                alert(response);
                return;
            }
            appendNews(parsedRecord.id, nextChunk, contentChunks);
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

    sendServerRequest('console', {
        callback: newsCompleteCallback,
        content: 'p=' + encodeURIComponent(JSON.stringify(param))
    });
}

function addNews(button: Element) {
    const recordElem = getParentElement(getParentElement(button));
    const id = (getDescendantsByClassAt(recordElem, 'id', 0) as HTMLTextAreaElement).value;
    const title = (getDescendantsByClassAt(recordElem, 'title', 0) as HTMLTextAreaElement).value;
    const content = (getDescendantsByClassAt(recordElem, 'content', 0) as HTMLTextAreaElement).value;

    const record = parseNewsRecord(id, title, content, false);
    if (!record) {
        return;
    }

    const contentChunks = splitContent(record.content);
    const nextChunk = contentChunks.shift();

    const parsedRecord: {
        id: string;
        title: string;
        content?: string;
        public: boolean;
        end: boolean;
    } = {
        ...record,
        end: nextChunk === undefined
    };
    delete parsedRecord.content;

    const param = {
        command: 'insert',
        type: 'news',
        ...parsedRecord
    };

    let confirm;
    do {
        confirm = prompt('Type "insert" to confirm.');
        if (confirm === null) {
            return;
        }
    } while (confirm != 'insert');

    sendServerRequest('console', {
        callback: function (response: string) {
            if (nextChunk === undefined) {
                newsCompleteCallback(response);
                return;
            }
            if (response.startsWith('ERROR:')) {
                alert(response);
                return;
            }
            appendNews(parsedRecord.id, nextChunk, contentChunks);
        },
        content: 'p=' + encodeURIComponent(JSON.stringify(param))
    });
}

function parseNewsRecord(id: string, title: string, content: string, isPublic: boolean) {
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
        content: content,
        public: isPublic
    };
}

function updateNewsTime(id: string) {
    const param = {
        command: 'updatetime',
        type: 'news',
        id: id
    };

    sendServerRequest('console', {
        callback: newsCompleteCallback,
        content: 'p=' + encodeURIComponent(JSON.stringify(param))
    });
}

function getNewsContent(button: Element, id: string) {
    const contentElem = (getDescendantsByClassAt(getParentElement(button), 'content', 0) as HTMLTextAreaElement);

    const param = {
        command: 'get',
        type: 'news-content',
        id: id
    };

    sendServerRequest('console', {
        callback: function (response: string) {
            contentElem.value = response;
        },
        content: 'p=' + encodeURIComponent(JSON.stringify(param))
    });
}

import { htmlMinifyOptions } from '../../../build_config.cjs';
import type { minify } from 'html-minifier-terser/dist/htmlminifier.esm.bundle';
let htmlMinifier: typeof minify | null = null;
async function minifyNewsContent(button: Element) {
    const contentElem = (getDescendantsByClassAt(getParentElement(button), 'content', 0) as HTMLTextAreaElement);
    if (htmlMinifier === null) {
        ({ minify: htmlMinifier } = await import(
            'html-minifier-terser/dist/htmlminifier.esm.bundle'
        ));
    }

    contentElem.value = await htmlMinifier(contentElem.value, htmlMinifyOptions);
}

function updateEventHandlers() {
    let buttons = getByClass('add-news');
    for (const button of buttons) {
        if (!containsClass(button, 'initialized')) {
            addClass(button, 'initialized');
            addEventListener(button, 'click', function () {
                addNews(button);
            });
        }
    }

    buttons = getByClass('modify-news');
    for (const button of buttons) {
        if (!containsClass(button, 'initialized')) {
            addClass(button, 'initialized');
            addEventListener(button, 'click', function () {
                modifyNews(button);
            });
        }
    }

    buttons = getByClass('update-news-time');
    for (const button of (buttons as HTMLCollectionOf<HTMLElement>)) {
        if (!containsClass(button, 'initialized')) {
            addClass(button, 'initialized');
            addEventListener(button, 'click', function () {
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
            addEventListener(button, 'click', function () {
                const id = getDataAttribute(button, 'id');
                if (id === null) {
                    alert('ERROR: "id" attribute on the element is undefined.');
                    return;
                }
                deleteNews(id);
            });
        }
    }

    buttons = getByClass('get-news-content');
    for (const button of (buttons as HTMLCollectionOf<HTMLElement>)) {
        if (!containsClass(button, 'initialized')) {
            addClass(button, 'initialized');
            addEventListener(button, 'click', function () {
                const id = getDataAttribute(button, 'id');
                if (id === null) {
                    alert('ERROR: "id" attribute on the element is undefined.');
                    return;
                }
                getNewsContent(button, id);
            });
        }
    }

    buttons = getByClass('minify-news-content');
    for (const button of (buttons as HTMLCollectionOf<HTMLElement>)) {
        if (!containsClass(button, 'initialized')) {
            addClass(button, 'initialized');
            addEventListener(button, 'click', function () {
                minifyNewsContent(button);
            });
        }
    }
}

function appendNews(id: string, contentChunk: string, remainingContentChunks: string[]) {
    const nextChunk = remainingContentChunks.shift();

    const param = {
        command: 'modify',
        type: 'news-content-append',
        id: id,
        content: contentChunk,
        end: nextChunk === undefined
    };

    sendServerRequest('console', {
        callback: function (response: string) {
            if (nextChunk === undefined) {
                newsCompleteCallback(response);
                return;
            }
            if (response.startsWith('ERROR:')) {
                alert(response);
                return;
            }
            appendNews(id, nextChunk, remainingContentChunks);
        },
        content: 'p=' + encodeURIComponent(JSON.stringify(param))
    });
}

function splitContent(content: string): string[] {
    const result = [];
    const chunkSize = 800;
    while (content.length > 0) {
        result.push(content.substring(0, chunkSize));
        content = content.substring(chunkSize);
    }
    return result;
}