// JavaScript Document
import "core-js";
import {
    DEVELOPMENT, TOP_URL,
} from '../module/env/constant';
import {
    sendServerRequest,
    clearCookies,
} from '../module/main';
import {
    w,
    addEventListener,
    getHref,
    redirect,
    getById,
    removeClass,
    getBody,
} from '../module/DOM';
import { show as showMessage } from '../module/message';
import { moduleImportError } from '../module/message/template/param';
import { getTable, setOutput } from './helper';

addEventListener(w, 'load', function () {
    if (getHref() !== TOP_URL + '/console' && !DEVELOPMENT) {
        redirect(TOP_URL + '/console', true);
        return;
    }

    clearCookies();

    sendServerRequest('console.php', {
        callback: function (response: string) {
            if (response != 'APPROVED') {
                redirect(TOP_URL, true);
            } else {
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
                    addEventListener(getById('get-series-table'), 'click', function () {
                        getSeriesTable();
                    });
                    addEventListener(getById('get-account-table'), 'click', function () {
                        getAccountTable();
                    });
                    addEventListener(getById('get-invite-table'), 'click', function () {
                        getTable('invite');
                    });
                    addEventListener(getById('get-news-table'), 'click', function () {
                        getNewsTable();
                    });
                    addEventListener(getById('get-log-table'), 'click', function () {
                        getTable('log');
                    });
                    addEventListener(getById('get-download-table'), 'click', function () {
                        getTable('download');
                    });
                    addEventListener(getById('generate-id'), 'click', function () {
                        generate('id');
                    });
                    addEventListener(getById('generate-series-id'), 'click', function () {
                        generate('series_id');
                    });
                    addEventListener(getById('generate-news-id'), 'click', function () {
                        generate('news_id');
                    });
                    addEventListener(getById('clear-cdn-cache'), 'click', function () {
                        clearCDNCache();
                    });
                    addEventListener(getById('clear-key-cache'), 'click', function () {
                        clearKeyCache();
                    });
                    addEventListener(getById('rebuild-series-search'), 'click', function () {
                        rebuild('series_search');
                    });
                    addEventListener(getById('verify'), 'click', function () {
                        verify();
                    });
                    addEventListener(getById('show-all-column'), 'click', function () {
                        getTable('all_column');
                    });
                    addEventListener(getById('show-all-index'), 'click', function () {
                        getTable('all_index');
                    });
                    addEventListener(getById('run-debug'), 'click', function () {
                        misc('run', 'debug');
                    });
                    addEventListener(getById('run-benchmark-hash'), 'click', function () {
                        misc('benchmark', 'hash');
                    });
                    addEventListener(getById('run-benchmark-signature'), 'click', function () {
                        misc('benchmark', 'signature');
                    });
                    addEventListener(getById('run-benchmark-key-pair'), 'click', function () {
                        misc('benchmark', 'key_pair');
                    });
                    addEventListener(getById('run-benchmark-match-str'), 'click', function () {
                        misc('benchmark', 'match_str');
                    });
                    addEventListener(getById('run-benchmark-random'), 'click', function () {
                        misc('benchmark', 'random');
                    });
                    addEventListener(getById('run-benchmark-password-hash'), 'click', function () {
                        misc('benchmark', 'password_hash');
                    });
                    removeClass(getBody(), "hidden");
                }).catch((e) => {
                    showMessage(moduleImportError(e));
                });
            }
        },
        content: "p=" + encodeURIComponent(JSON.stringify({ command: 'authenticate' }))
    });

    function generate(type: string) {
        const param = {
            command: 'generate',
            type: type
        };

        sendServerRequest('console.php', {
            callback: function (response: string) {
                setOutput(response, undefined, 'id-output');
            },
            content: "p=" + encodeURIComponent(JSON.stringify(param))
        });
    }

    function misc(command: string, type: string) {
        const param = {
            command: command,
            type: type
        };

        sendServerRequest('console.php', {
            callback: function (response: string) {
                setOutput(response);
            },
            content: "p=" + encodeURIComponent(JSON.stringify(param))
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
        } while (confirm != "clear");

        const param = {
            command: 'clear',
            type: 'cdn_cache',
            dir: dir
        };

        sendServerRequest('console.php', {
            callback: function (response: string) {
                alert(response);
            },
            content: "p=" + encodeURIComponent(JSON.stringify(param))
        });
    }

    function clearKeyCache() {
        let confirm;
        do {
            confirm = prompt('Type "clear" to confirm deleting expired key cache');
            if (confirm === null) {
                return;
            }
        } while (confirm != "clear");

        const param = {
            command: 'clear',
            type: 'key_cache'
        };

        sendServerRequest('console.php', {
            callback: function (response: string) {
                alert(response);
            },
            content: "p=" + encodeURIComponent(JSON.stringify(param))
        });
    }

    function rebuild(type: string) {
        let confirm;
        do {
            confirm = prompt('Type "rebuild" to confirm rebuilding the index.');
            if (confirm === null) {
                return;
            }
        } while (confirm != "rebuild");

        const param = {
            command: 'rebuild',
            type: type
        };

        sendServerRequest('console.php', {
            callback: function (response: string) {
                alert(response);
            },
            content: "p=" + encodeURIComponent(JSON.stringify(param))
        });
    }

    function verify() {
        const id = (getById('verify-id') as HTMLTextAreaElement).value;
        if (!/^[a-zA-Z0-9~_-]+$/.test(id)) {
            alert("ERROR: Invalid value for 'id'");
            return;
        }

        let confirm;
        do {
            confirm = prompt('Type "verify" to confirm verifying the series: ' + id);
            if (confirm === null) {
                return;
            }
        } while (confirm != "verify");

        const param = {
            command: 'verify',
            series: id
        };

        sendServerRequest('console.php', {
            callback: function (response: string) {
                alert(response);
            },
            content: "p=" + encodeURIComponent(JSON.stringify(param))
        });
    }

});
