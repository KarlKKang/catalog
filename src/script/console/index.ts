import { ServerRequestOptionProp, sendServerRequest } from '../module/server';
import {
    addClass,
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
import { showMessage } from '../module/message';
import { moduleImportError } from '../module/message/param';
import { invalidResponse } from '../module/server/message';
import { getTable, setOutput, setOutputElement } from './helper';
import { pgid, type ShowPageFunc } from '../module/global';

import * as styles from '../../css/console.module.scss';
import { addAutoMultiLanguageClass } from '../module/dom/create_element/multi_language';

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();

    sendServerRequest('console', {
        [ServerRequestOptionProp.CALLBACK]: function (response: string) {
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

                const container = createDivElement();
                appendChild(body, container);
                addClass(container, styles.container);
                addAutoMultiLanguageClass(container);

                const output = createDivElement();
                setOutputElement(output);

                appendButton(container, 'Get Series Table', getSeriesTable);
                appendButton(container, 'Get Account Table', getAccountTable);
                appendButton(container, 'Get Invite Table', () => {
                    getTable('invite');
                });
                appendButton(container, 'Get Email Change Table', () => {
                    getTable('email_change');
                });
                appendButton(container, 'Get News Table', getNewsTable);
                appendButton(container, 'Get Log Table', () => {
                    getTable('log');
                });
                appendChildren(container, createBRElement(), createBRElement());

                const idOutput = createParagraphElement();
                appendButton(container, 'Generate ID', () => {
                    generate('id', idOutput);
                });
                appendButton(container, 'Generate Series ID', () => {
                    generate('series_id', idOutput);
                });
                appendButton(container, 'Generate News ID', () => {
                    generate('news_id', idOutput);
                });
                appendChildren(container, idOutput, createBRElement(), createBRElement());

                const clearCacheDir = createTextAreaElement(1, 30);
                appendChild(container, clearCacheDir);
                appendButton(container, 'Clear CDN Cache', () => {
                    clearCDNCache(clearCacheDir.value);
                });
                appendButton(container, 'Clear Key Cache', clearKeyCache);
                appendButton(container, 'Rebuild Series Search Index', () => {
                    rebuild('series_search');
                });
                appendChildren(container, createBRElement(), createBRElement());

                const verifyId = createTextAreaElement(1, 30);
                appendChild(container, verifyId);
                appendButton(container, 'Verify', () => {
                    verify(verifyId.value);
                });
                appendChildren(container, createBRElement(), createBRElement());

                appendButton(container, 'Show Database Column', () => {
                    getTable('all_column');
                });
                appendButton(container, 'Show Database Index', () => {
                    getTable('all_index');
                });
                appendButton(container, 'Show Create Table', () => {
                    getTable('create_table');
                });
                appendButton(container, 'Run Debug', () => {
                    misc('run', 'debug');
                });
                appendButton(container, 'Run Benchmark Hash', () => {
                    misc('benchmark', 'hash');
                });
                appendButton(container, 'Run Benchmark HMAC', () => {
                    misc('benchmark', 'hmac');
                });
                appendButton(container, 'Run Benchmark Signature', () => {
                    misc('benchmark', 'signature');
                });
                appendButton(container, 'Run Benchmark Key Pair', () => {
                    misc('benchmark', 'key_pair');
                });
                appendButton(container, 'Run Benchmark Match Str', () => {
                    misc('benchmark', 'match_str');
                });
                appendButton(container, 'Run Benchmark Generate Random', () => {
                    misc('benchmark', 'random');
                });
                appendButton(container, 'Run Benchmark Password Hash', () => {
                    misc('benchmark', 'password_hash');
                });
                appendChildren(container, createBRElement(), createBRElement());

                appendChild(container, output);
            }).catch((e) => {
                if (currentPgid === pgid) {
                    showMessage(moduleImportError);
                }
                throw e;
            });
        },
        [ServerRequestOptionProp.CONTENT]: 'p=' + encodeURIComponent(JSON.stringify({ command: 'authenticate' }))
    });

    function generate(type: string, idOutput: HTMLParagraphElement) {
        const param = {
            command: 'generate',
            type: type
        };

        sendServerRequest('console', {
            [ServerRequestOptionProp.CALLBACK]: function (response: string) {
                setOutput(response, undefined, idOutput);
            },
            [ServerRequestOptionProp.CONTENT]: 'p=' + encodeURIComponent(JSON.stringify(param))
        });
    }

    function misc(command: string, type: string) {
        const param = {
            command: command,
            type: type
        };

        sendServerRequest('console', {
            [ServerRequestOptionProp.CALLBACK]: function (response: string) {
                setOutput(response);
            },
            [ServerRequestOptionProp.CONTENT]: 'p=' + encodeURIComponent(JSON.stringify(param))
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
            [ServerRequestOptionProp.CALLBACK]: function (response: string) {
                alert(response);
            },
            [ServerRequestOptionProp.CONTENT]: 'p=' + encodeURIComponent(JSON.stringify(param))
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
            [ServerRequestOptionProp.CALLBACK]: function (response: string) {
                alert(response);
            },
            [ServerRequestOptionProp.CONTENT]: 'p=' + encodeURIComponent(JSON.stringify(param))
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
            [ServerRequestOptionProp.CALLBACK]: function (response: string) {
                alert(response);
            },
            [ServerRequestOptionProp.CONTENT]: 'p=' + encodeURIComponent(JSON.stringify(param))
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
            [ServerRequestOptionProp.CALLBACK]: function (response: string) {
                alert(response);
            },
            [ServerRequestOptionProp.CONTENT]: 'p=' + encodeURIComponent(JSON.stringify(param))
        });
    }
}

function appendButton(container: HTMLDivElement, text: string, onclick: () => void) {
    const button = createElement('button') as HTMLButtonElement;
    appendText(button, text);
    appendChild(container, button);
    addEventListener(button, 'click', onclick);
}

export function offload() {
    setOutputElement(null);
}