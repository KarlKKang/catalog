import { sendServerRequest } from '../module/server';
import {
    addEventListener,
    appendChild,
    appendChildren,
    appendText,
    body,
    clearSessionStorage,
    createBRElement,
    createDivElement,
    createElement,
    createParagraphElement,
    createTextAreaElement,
} from '../module/dom';
import { show as showMessage } from '../module/message';
import { moduleImportError } from '../module/message/param';
import { invalidResponse } from '../module/server/message';
import { getTable, setOutput, setOutputElement } from './helper';
import type { ShowPageFunc } from '../module/type/ShowPageFunc';
import { pgid } from '../module/global';

import '../../font/dist/NotoSansTC/NotoSansTC-Light.css';
import '../../font/dist/NotoSansSC/NotoSansSC-Light.css';
import '../../css/console.scss';

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();

    sendServerRequest('console', {
        callback: function (response: string) {
            if (response !== 'APPROVED') {
                showMessage(invalidResponse());
                return;
            }
            const currentPgid = pgid;
            Promise.all([
                import(
                    /* webpackExports: ["getSeriesTable"] */
                    './series'
                ),
                import(
                    /* webpackExports: ["getAccountTable"] */
                    './account'
                ),
                import(
                    /* webpackExports: ["getNewsTable"] */
                    './news'
                ),
            ]).then(([{ getSeriesTable }, { getAccountTable }, { getNewsTable }]) => {
                showPage();

                const output = createDivElement();
                setOutputElement(output);

                appendButton('Get Series Table', getSeriesTable);
                appendButton('Get Account Table', getAccountTable);
                appendButton('Get Invite Table', () => {
                    getTable('invite');
                });
                appendButton('Get Email Change Table', () => {
                    getTable('email_change');
                });
                appendButton('Get News Table', getNewsTable);
                appendButton('Get Log Table', () => {
                    getTable('log');
                });
                appendChildren(body, createBRElement(), createBRElement());

                const idOutput = createParagraphElement();
                appendButton('Generate ID', () => {
                    generate('id', idOutput);
                });
                appendButton('Generate Series ID', () => {
                    generate('series_id', idOutput);
                });
                appendButton('Generate News ID', () => {
                    generate('news_id', idOutput);
                });
                appendChildren(body, idOutput, createBRElement(), createBRElement());

                const clearCacheDir = createTextAreaElement(1, 30);
                appendChild(body, clearCacheDir);
                appendButton('Clear CDN Cache', () => {
                    clearCDNCache(clearCacheDir.value);
                });
                appendButton('Clear Key Cache', clearKeyCache);
                appendButton('Rebuild Series Search Index', () => {
                    rebuild('series_search');
                });
                appendChildren(body, createBRElement(), createBRElement());

                const verifyId = createTextAreaElement(1, 30);
                appendChild(body, verifyId);
                appendButton('Verify', () => {
                    verify(verifyId.value);
                });
                appendChildren(body, createBRElement(), createBRElement());

                appendButton('Show Database Column', () => {
                    getTable('all_column');
                });
                appendButton('Show Database Index', () => {
                    getTable('all_index');
                });
                appendButton('Show Create Table', () => {
                    getTable('create_table');
                });
                appendButton('Run Debug', () => {
                    misc('run', 'debug');
                });
                appendButton('Run Benchmark Hash', () => {
                    misc('benchmark', 'hash');
                });
                appendButton('Run Benchmark HMAC', () => {
                    misc('benchmark', 'hmac');
                });
                appendButton('Run Benchmark Signature', () => {
                    misc('benchmark', 'signature');
                });
                appendButton('Run Benchmark Key Pair', () => {
                    misc('benchmark', 'key_pair');
                });
                appendButton('Run Benchmark Match Str', () => {
                    misc('benchmark', 'match_str');
                });
                appendButton('Run Benchmark Generate Random', () => {
                    misc('benchmark', 'random');
                });
                appendButton('Run Benchmark Password Hash', () => {
                    misc('benchmark', 'password_hash');
                });
                appendChildren(body, createBRElement(), createBRElement());

                appendChild(body, output);
            }).catch((e) => {
                if (currentPgid === pgid) {
                    showMessage(moduleImportError(e));
                }
            });
        },
        content: 'p=' + encodeURIComponent(JSON.stringify({ command: 'authenticate' }))
    });

    function generate(type: string, idOutput: HTMLParagraphElement) {
        const param = {
            command: 'generate',
            type: type
        };

        sendServerRequest('console', {
            callback: function (response: string) {
                setOutput(response, undefined, idOutput);
            },
            content: 'p=' + encodeURIComponent(JSON.stringify(param))
        });
    }

    function misc(command: string, type: string) {
        const param = {
            command: command,
            type: type
        };

        sendServerRequest('console', {
            callback: function (response: string) {
                setOutput(response);
            },
            content: 'p=' + encodeURIComponent(JSON.stringify(param))
        });
    }

    function clearCDNCache(dir: string) {
        if (!dir.startsWith('/') || dir.includes('..')) {
            alert('ERROR: Invalid format for dir');
            return;
        }

        let confirm;
        do {
            confirm = prompt('Type "clear" to confirm deleting cache for the following directory: ' + dir);
            if (confirm === null) {
                return;
            }
        } while (confirm !== 'clear');

        const param = {
            command: 'clear',
            type: 'cdn_cache',
            dir: dir
        };

        sendServerRequest('console', {
            callback: function (response: string) {
                alert(response);
            },
            content: 'p=' + encodeURIComponent(JSON.stringify(param))
        });
    }

    function clearKeyCache() {
        let confirm;
        do {
            confirm = prompt('Type "clear" to confirm deleting expired key cache');
            if (confirm === null) {
                return;
            }
        } while (confirm !== 'clear');

        const param = {
            command: 'clear',
            type: 'key_cache'
        };

        sendServerRequest('console', {
            callback: function (response: string) {
                alert(response);
            },
            content: 'p=' + encodeURIComponent(JSON.stringify(param))
        });
    }

    function rebuild(type: string) {
        let confirm;
        do {
            confirm = prompt('Type "rebuild" to confirm rebuilding the index.');
            if (confirm === null) {
                return;
            }
        } while (confirm !== 'rebuild');

        const param = {
            command: 'rebuild',
            type: type
        };

        sendServerRequest('console', {
            callback: function (response: string) {
                alert(response);
            },
            content: 'p=' + encodeURIComponent(JSON.stringify(param))
        });
    }

    function verify(id: string) {
        if (!/^[a-zA-Z0-9~_-]+$/.test(id)) {
            alert('ERROR: Invalid value for "id"');
            return;
        }

        let confirm;
        do {
            confirm = prompt('Type "verify" to confirm verifying the series: ' + id);
            if (confirm === null) {
                return;
            }
        } while (confirm !== 'verify');

        const param = {
            command: 'verify',
            series: id
        };

        sendServerRequest('console', {
            callback: function (response: string) {
                alert(response);
            },
            content: 'p=' + encodeURIComponent(JSON.stringify(param))
        });
    }
}

function appendButton(text: string, onclick: () => void) {
    const button = createElement('button') as HTMLButtonElement;
    appendText(button, text);
    appendChild(body, button);
    addEventListener(button, 'click', onclick);
}

export function offload() {
    setOutputElement(null);
}