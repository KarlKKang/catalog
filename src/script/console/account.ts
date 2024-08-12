import { ServerRequestOptionKey, sendServerRequest } from '../module/server/request';
import { getByClass } from '../module/dom/element/get/by_class';
import { getByTag } from '../module/dom/element/get/by_tag';
import { getDataAttribute } from '../module/dom/attr/data/get';
import { addClass } from '../module/dom/class/add';
import { containsClass } from '../module/dom/class/contains';
import { addEventListener } from '../module/event_listener';
import { completeCallback, getByClassAt, getParentElement, getTable, initializedClass } from './helper';
import { PASSWORD_REGEX } from '../module/regex';
import { buildHttpForm } from '../module/string/http_form/build';

function accountCompleteCallback(response: string) {
    completeCallback(response, updateEventHandlers);
}

export function getAccountTable() {
    getTable('account', updateEventHandlers);
}

function addAccount(button: Element) {
    const record = getParentElement(getParentElement(button));
    const email = (getByClassAt(record, 'email', 0) as HTMLTextAreaElement).value;
    const username = (getByClassAt(record, 'username', 0) as HTMLTextAreaElement).value;
    const password = (getByClassAt(record, 'password', 0) as HTMLTextAreaElement).value;

    let selections = getByTag(getByClassAt(record, 'user-group', 0), 'input') as HTMLCollectionOf<HTMLInputElement>;
    let user_group = '';
    for (const selection of selections) {
        if (selection.checked) {
            user_group = selection.value;
            break;
        }
    }

    selections = (getByTag(getByClassAt(record, 'status', 0), 'input') as HTMLCollectionOf<HTMLInputElement>);
    let status = '';
    for (const selection of selections) {
        if (selection.checked) {
            status = selection.value;
            break;
        }
    }

    const available_invite = (getByClassAt(record, 'available-invite', 0) as HTMLTextAreaElement).value;

    const parsedRecord = parseAccountRecord(email, username, password, user_group, status, available_invite);
    if (!parsedRecord) {
        return;
    }

    if (parsedRecord.password === null) {
        alert('ERROR: "password" is required');
        return;
    }

    const param = {
        command: 'insert',
        type: 'account',
        ...parsedRecord,
    };

    let confirm;
    do {
        confirm = prompt('Type "insert" to confirm.');
        if (confirm === null) {
            return;
        }
    } while (confirm !== 'insert');

    sendServerRequest('console', {
        [ServerRequestOptionKey.CALLBACK]: accountCompleteCallback,
        [ServerRequestOptionKey.CONTENT]: buildHttpForm({ p: JSON.stringify(param) }),
    });
}

function modifyAccount(button: Element, id: string) {
    const record = getParentElement(getParentElement(button));
    const email = (getByClassAt(record, 'email', 0) as HTMLTextAreaElement).value;
    const username = (getByClassAt(record, 'username', 0) as HTMLTextAreaElement).value;
    const password = (getByClassAt(record, 'password', 0) as HTMLTextAreaElement).value;

    let selections = getByTag(getByClassAt(record, 'user-group', 0), 'input') as HTMLCollectionOf<HTMLInputElement>;
    let user_group = '';
    for (const selection of selections) {
        if (selection.checked) {
            user_group = selection.value;
            break;
        }
    }

    selections = (getByTag(getByClassAt(record, 'status', 0), 'input') as HTMLCollectionOf<HTMLInputElement>);
    let status = '';
    for (const selection of selections) {
        if (selection.checked) {
            status = selection.value;
            break;
        }
    }

    const available_invite = (getByClassAt(record, 'available-invite', 0) as HTMLTextAreaElement).value;

    const parsedRecord = parseAccountRecord(email, username, password, user_group, status, available_invite);
    if (!parsedRecord) {
        return;
    }

    const param = {
        command: 'modify',
        type: 'account',
        id: id,
        ...parsedRecord,
    };

    let confirm;
    do {
        confirm = prompt('Type "modify" to confirm.');
        if (confirm === null) {
            return;
        }
    } while (confirm !== 'modify');

    sendServerRequest('console', {
        [ServerRequestOptionKey.CALLBACK]: accountCompleteCallback,
        [ServerRequestOptionKey.CONTENT]: buildHttpForm({ p: JSON.stringify(param) }),
    });
}

function parseAccountRecord(email: string, username: string, password: string, user_group: string, status: string, available_invite: string) {
    if (email === '') {
        alert('ERROR: "email" is required');
        return false;
    }

    if (username === '') {
        alert('ERROR: "username" is required');
        return false;
    }

    let password_parsed: string | null = password;
    if (password_parsed === '') {
        password_parsed = null;
    } else if (!PASSWORD_REGEX.test(password_parsed)) {
        alert('ERROR: password requirements not met');
        return false;
    }

    let user_group_parsed: number;
    if (user_group === 'admin') {
        user_group_parsed = 0;
    } else if (user_group === 'user') {
        user_group_parsed = 1;
    } else {
        alert('ERROR: Invalid value for "user_group"');
        return false;
    }

    let status_parsed: number;
    if (status === 'active') {
        status_parsed = 0;
    } else if (status === 'deactivated') {
        status_parsed = 1;
    } else if (status === 'banned') {
        status_parsed = 2;
    } else {
        alert('ERROR: Invalid value for "status"');
        return false;
    }

    if (available_invite === '') {
        alert('ERROR: "available_invite" is required');
        return false;
    }
    const available_invite_parsed = parseInt(available_invite);
    if (isNaN(available_invite_parsed)) {
        alert('ERROR: Invalid value for "available_invite"');
        return false;
    } else if (available_invite_parsed > 255 || available_invite_parsed < 0) {
        alert('ERROR: "available_invite" should be in range 0-255');
        return false;
    }

    return {
        email: email,
        username: username,
        password: password_parsed,
        user_group: user_group_parsed,
        status: status_parsed,
        available_invite: available_invite_parsed,
    };
}

function deleteAccount(id: string) {
    let confirm;
    do {
        confirm = prompt('Type "delete" to confirm. Deleting an account is NOT recommended. Use "status" option instead.');
        if (confirm === null) {
            return;
        }
    } while (confirm !== 'delete');

    const param = {
        command: 'delete',
        type: 'account',
        id: id,
    };

    sendServerRequest('console', {
        [ServerRequestOptionKey.CALLBACK]: accountCompleteCallback,
        [ServerRequestOptionKey.CONTENT]: buildHttpForm({ p: JSON.stringify(param) }),
    });
}

function updateEventHandlers(outputElem: HTMLElement) {
    let buttons = getByClass(outputElem, 'add-account');
    for (const button of buttons) {
        if (!containsClass(button, initializedClass)) {
            addClass(button, initializedClass);
            addEventListener(button, 'click', () => {
                addAccount(button);
            });
        }
    }

    buttons = getByClass(outputElem, 'modify-account');
    for (const button of (buttons as HTMLCollectionOf<HTMLElement>)) {
        if (!containsClass(button, initializedClass)) {
            addClass(button, initializedClass);
            addEventListener(button, 'click', () => {
                const id = getDataAttribute(button, 'user');
                if (id === null) {
                    alert('ERROR: "email" attribute on the element is undefined.');
                    return;
                }
                modifyAccount(button, id);
            });
        }
    }

    buttons = getByClass(outputElem, 'delete-account');
    for (const button of (buttons as HTMLCollectionOf<HTMLElement>)) {
        if (!containsClass(button, initializedClass)) {
            addClass(button, initializedClass);
            addEventListener(button, 'click', () => {
                const id = getDataAttribute(button, 'user');
                if (id === null) {
                    alert('ERROR: "email" attribute on the element is undefined.');
                    return;
                }
                deleteAccount(id);
            });
        }
    }
}
