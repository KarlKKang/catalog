// JavaScript Document
import {
    sendServerRequest,
} from '../module/common';
import {
    addEventListener,
    getById,
    clearSessionStorage,
} from '../module/dom';
import { show as showMessage } from '../module/message';
import { moduleImportError } from '../module/message/template/param';
import { invalidResponse } from '../module/message/template/param/server';
import { getTable, setOutput } from './helper';
import type { ShowPageFunc } from '../module/type/ShowPageFunc';
import type { RedirectFunc } from '../module/type/RedirectFunc';

export default function (showPage: ShowPageFunc, redirect: RedirectFunc) {
    clearSessionStorage();

    sendServerRequest(redirect, 'console', {
        callback: function (response: string) {
            if (response != 'APPROVED') {
                showMessage(redirect, invalidResponse);
                return;
            }
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
                showPage(() => {
                    addEventListener(getById('get-series-table'), 'click', () => {
                        getSeriesTable(redirect);
                    });
                    addEventListener(getById('get-account-table'), 'click', () => {
                        getAccountTable(redirect);
                    });
                    addEventListener(getById('get-invite-table'), 'click', () => {
                        getTable(redirect, 'invite');
                    });
                    addEventListener(getById('get-email-change-table'), 'click', () => {
                        getTable(redirect, 'email_change');
                    });
                    addEventListener(getById('get-news-table'), 'click', () => {
                        getNewsTable(redirect);
                    });
                    addEventListener(getById('get-log-table'), 'click', () => {
                        getTable(redirect, 'log');
                    });
                    addEventListener(getById('generate-id'), 'click', () => {
                        generate('id');
                    });
                    addEventListener(getById('generate-series-id'), 'click', () => {
                        generate('series_id');
                    });
                    addEventListener(getById('generate-news-id'), 'click', () => {
                        generate('news_id');
                    });
                    addEventListener(getById('clear-cdn-cache'), 'click', () => {
                        clearCDNCache();
                    });
                    addEventListener(getById('clear-key-cache'), 'click', () => {
                        clearKeyCache();
                    });
                    addEventListener(getById('rebuild-series-search'), 'click', () => {
                        rebuild('series_search');
                    });
                    addEventListener(getById('verify'), 'click', () => {
                        verify();
                    });
                    addEventListener(getById('show-all-column'), 'click', () => {
                        getTable(redirect, 'all_column');
                    });
                    addEventListener(getById('show-all-index'), 'click', () => {
                        getTable(redirect, 'all_index');
                    });
                    addEventListener(getById('show-create-table'), 'click', () => {
                        getTable(redirect, 'create_table');
                    });
                    addEventListener(getById('run-debug'), 'click', () => {
                        misc('run', 'debug');
                    });
                    addEventListener(getById('run-benchmark-hash'), 'click', () => {
                        misc('benchmark', 'hash');
                    });
                    addEventListener(getById('run-benchmark-hmac'), 'click', () => {
                        misc('benchmark', 'hmac');
                    });
                    addEventListener(getById('run-benchmark-signature'), 'click', () => {
                        misc('benchmark', 'signature');
                    });
                    addEventListener(getById('run-benchmark-key-pair'), 'click', () => {
                        misc('benchmark', 'key_pair');
                    });
                    addEventListener(getById('run-benchmark-match-str'), 'click', () => {
                        misc('benchmark', 'match_str');
                    });
                    addEventListener(getById('run-benchmark-random'), 'click', () => {
                        misc('benchmark', 'random');
                    });
                    addEventListener(getById('run-benchmark-password-hash'), 'click', () => {
                        misc('benchmark', 'password_hash');
                    });
                });
            }).catch((e) => {
                showMessage(redirect, moduleImportError(e));
            });
        },
        content: 'p=' + encodeURIComponent(JSON.stringify({ command: 'authenticate' }))
    });

    function generate(type: string) {
        const param = {
            command: 'generate',
            type: type
        };

        sendServerRequest(redirect, 'console', {
            callback: function (response: string) {
                setOutput(response, undefined, 'id-output');
            },
            content: 'p=' + encodeURIComponent(JSON.stringify(param))
        });
    }

    function misc(command: string, type: string) {
        const param = {
            command: command,
            type: type
        };

        sendServerRequest(redirect, 'console', {
            callback: function (response: string) {
                setOutput(response);
            },
            content: 'p=' + encodeURIComponent(JSON.stringify(param))
        });
    }

    function clearCDNCache() {
        const dir = (getById('clear-cache-dir') as HTMLTextAreaElement).value;
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
        } while (confirm != 'clear');

        const param = {
            command: 'clear',
            type: 'cdn_cache',
            dir: dir
        };

        sendServerRequest(redirect, 'console', {
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
        } while (confirm != 'clear');

        const param = {
            command: 'clear',
            type: 'key_cache'
        };

        sendServerRequest(redirect, 'console', {
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
        } while (confirm != 'rebuild');

        const param = {
            command: 'rebuild',
            type: type
        };

        sendServerRequest(redirect, 'console', {
            callback: function (response: string) {
                alert(response);
            },
            content: 'p=' + encodeURIComponent(JSON.stringify(param))
        });
    }

    function verify() {
        const id = (getById('verify-id') as HTMLTextAreaElement).value;
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
        } while (confirm != 'verify');

        const param = {
            command: 'verify',
            series: id
        };

        sendServerRequest(redirect, 'console', {
            callback: function (response: string) {
                alert(response);
            },
            content: 'p=' + encodeURIComponent(JSON.stringify(param))
        });
    }
}