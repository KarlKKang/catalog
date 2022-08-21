import {
    sendServerRequest,
} from '../module/main';
import {
    addEventListener,
    getParent,
    getDescendantsByClassAt,
    getByClass,
    addClass,
    containsClass,
    getDataAttribute
} from '../module/DOM';

import { completeCallback, getTable } from './helper';

function newsCompleteCallback(response: string) {
    completeCallback(response, updateEventHandlers);
}

export function getNewsTable() {
    getTable('news', updateEventHandlers);
}

function modifyNews(button: Element) {
    var recordElem = getParent(getParent(button));
    var id = getDescendantsByClassAt(recordElem, 'id', 0).innerHTML;
    var title = (getDescendantsByClassAt(recordElem, 'title', 0) as HTMLTextAreaElement).value;
    var content = (getDescendantsByClassAt(recordElem, 'content', 0) as HTMLTextAreaElement).value;
    var isPublic = (getDescendantsByClassAt(recordElem, 'public', 0) as HTMLInputElement).checked;

    const record = parseNewsRecord(id, title, content, isPublic);
    if (!record) {
        return;
    }

    const contentChunks = splitContent(record.content);

    const parsedRecord: {
        id: string,
        title: string,
        content?: string,
        public: boolean,
        end: boolean
    } = {
        ...record,
        end: contentChunks.length === 0
    };
    delete parsedRecord.content;

    const param = {
        command: 'modify',
        type: 'news',
        ...parsedRecord
    };

    var confirm;
    do {
        confirm = prompt('Type "modify" to confirm.');
        if (confirm === null) {
            return;
        }
    } while (confirm != "modify");

    sendServerRequest('console.php', {
        callback: function (response: string) {
            if (contentChunks.length === 0) {
                newsCompleteCallback(response);
                return;
            }
            if (response.startsWith('ERROR:')) {
                alert(response);
                return;
            }
            appendNews(parsedRecord.id, contentChunks);
        },
        content: "p=" + encodeURIComponent(JSON.stringify(param))
    });
}

function deleteNews(id: string) {

    var confirm;
    do {
        confirm = prompt('Type "delete" to confirm.');
        if (confirm === null) {
            return;
        }
    } while (confirm != "delete");

    var param = {
        command: 'delete',
        type: 'news',
        id: id
    };

    sendServerRequest('console.php', {
        callback: newsCompleteCallback,
        content: "p=" + encodeURIComponent(JSON.stringify(param))
    });
}

function addNews(button: Element) {
    var recordElem = getParent(getParent(button));
    var id = (getDescendantsByClassAt(recordElem, 'id', 0) as HTMLTextAreaElement).value;
    var title = (getDescendantsByClassAt(recordElem, 'title', 0) as HTMLTextAreaElement).value;
    var content = (getDescendantsByClassAt(recordElem, 'content', 0) as HTMLTextAreaElement).value;

    const record = parseNewsRecord(id, title, content, false);
    if (!record) {
        return;
    }

    const contentChunks = splitContent(record.content);

    const parsedRecord: {
        id: string,
        title: string,
        content?: string,
        public: boolean,
        end: boolean
    } = {
        ...record,
        end: contentChunks.length === 0
    };;
    delete parsedRecord.content;

    const param = {
        command: 'insert',
        type: 'news',
        ...parsedRecord
    }

    var confirm;
    do {
        confirm = prompt('Type "insert" to confirm.');
        if (confirm === null) {
            return;
        }
    } while (confirm != "insert");

    sendServerRequest('console.php', {
        callback: function (response: string) {
            if (contentChunks.length === 0) {
                newsCompleteCallback(response);
                return;
            }
            if (response.startsWith('ERROR:')) {
                alert(response);
                return;
            }
            appendNews(parsedRecord.id, contentChunks);
        },
        content: "p=" + encodeURIComponent(JSON.stringify(param))
    });
}

function parseNewsRecord(id: string, title: string, content: string, isPublic: boolean) {
    if (id == '') {
        alert("ERROR: 'id' is required");
        return false;
    }

    if (!/^[a-zA-Z0-9~_-]+$/.test(id)) {
        alert("ERROR: Invalid value for 'id'");
        return false;
    }

    if (title == '') {
        alert("ERROR: 'title' is required");
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
    var param = {
        command: 'updatetime',
        type: 'news',
        id: id
    };

    sendServerRequest('console.php', {
        callback: newsCompleteCallback,
        content: "p=" + encodeURIComponent(JSON.stringify(param))
    });
}

function getNewsContent(button: Element, id: string) {
    var contentElem = (getDescendantsByClassAt(getParent(button), 'content', 0) as HTMLTextAreaElement);

    var param = {
        command: 'get',
        type: 'news-content',
        id: id
    };

    sendServerRequest('console.php', {
        callback: function (response: string) {
            contentElem.value = response;
        },
        content: "p=" + encodeURIComponent(JSON.stringify(param))
    });
}

import type { minify } from 'html-minifier-terser';
var htmlMinifier: typeof minify | null = null;
async function minifyNewsContent(button: Element) {
    var contentElem = (getDescendantsByClassAt(getParent(button), 'content', 0) as HTMLTextAreaElement);
    if (htmlMinifier === null) {
        ({ minify: htmlMinifier } = await import(
            /* webpackExports: ["minify"] */
            'html-minifier-terser/dist/htmlminifier.esm.bundle'
        ));
    }

    contentElem.value = await htmlMinifier(contentElem.value, {
        collapseBooleanAttributes: true,
        collapseWhitespace: true,
        keepClosingSlash: false,
        quoteCharacter: '"',
        removeAttributeQuotes: true,
        removeComments: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        sortAttributes: true,
        sortClassName: true
    });
}

function updateEventHandlers() {
    var buttons = getByClass('add-news');
    for (let button of buttons) {
        if (!containsClass(button, 'initialized')) {
            addClass(button, 'initialized');
            addEventListener(button, 'click', function () {
                addNews(button);
            });
        }
    }

    buttons = getByClass('modify-news');
    for (let button of buttons) {
        if (!containsClass(button, 'initialized')) {
            addClass(button, 'initialized');
            addEventListener(button, 'click', function () {
                modifyNews(button);
            });
        }
    }

    buttons = getByClass('update-news-time');
    for (let button of (buttons as HTMLCollectionOf<HTMLElement>)) {
        if (!containsClass(button, 'initialized')) {
            addClass(button, 'initialized');
            addEventListener(button, 'click', function () {
                const id = getDataAttribute(button, 'id');
                if (id === null) {
                    alert("ERROR: 'id' attribute on the element is undefined.");
                    return;
                }
                updateNewsTime(id);
            });
        }
    }

    buttons = getByClass('delete-news');
    for (let button of (buttons as HTMLCollectionOf<HTMLElement>)) {
        if (!containsClass(button, 'initialized')) {
            addClass(button, 'initialized');
            addEventListener(button, 'click', function () {
                const id = getDataAttribute(button, 'id');
                if (id === null) {
                    alert("ERROR: 'id' attribute on the element is undefined.");
                    return;
                }
                deleteNews(id);
            });
        }
    }

    buttons = getByClass('get-news-content');
    for (let button of (buttons as HTMLCollectionOf<HTMLElement>)) {
        if (!containsClass(button, 'initialized')) {
            addClass(button, 'initialized');
            addEventListener(button, 'click', function () {
                const id = getDataAttribute(button, 'id');
                if (id === null) {
                    alert("ERROR: 'id' attribute on the element is undefined.");
                    return;
                }
                getNewsContent(button, id);
            });
        }
    }

    buttons = getByClass('minify-news-content');
    for (let button of (buttons as HTMLCollectionOf<HTMLElement>)) {
        if (!containsClass(button, 'initialized')) {
            addClass(button, 'initialized');
            addEventListener(button, 'click', function () {
                minifyNewsContent(button);
            });
        }
    }
}

function appendNews(id: string, contentChunks: string[]) {
    let content = contentChunks.shift()!;
    let param = {
        command: 'modify',
        type: 'news-content-append',
        id: id,
        content: content,
        end: contentChunks.length === 0
    }

    sendServerRequest('console.php', {
        callback: function (response: string) {
            if (contentChunks.length === 0) {
                newsCompleteCallback(response);
                return;
            }
            if (response.startsWith('ERROR:')) {
                alert(response);
                return;
            }
            appendNews(id, contentChunks);
        },
        content: "p=" + encodeURIComponent(JSON.stringify(param))
    });
}

function splitContent(content: string): string[] {
    var result = [];
    const chunkSize = 800;
    while (content.length > 0) {
        result.push(content.substring(0, chunkSize));
        content = content.substring(chunkSize);
    }
    return result
}