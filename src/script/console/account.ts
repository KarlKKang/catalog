import {
    sendServerRequest,
    hashPassword,
    PASSWORD_REGEX,
} from '../module/main';
import {
    addEventListener,
    getParent,
    getDescendantsByClassAt,
    getDescendantsByTag,
    getByClass,
    containsClass,
    addClass
} from '../module/DOM';
import { completeCallback, getTable } from './helper';

function accountCompleteCallback(response: string) {
    completeCallback(response, updateEventHandlers);
}

export function getAccountTable() {
    getTable('account', updateEventHandlers);
}

async function addAccount(button: Element) {
    var record = getParent(getParent(button));
    var email = (getDescendantsByClassAt(record, 'email', 0) as HTMLTextAreaElement).value;
    var username = (getDescendantsByClassAt(record, 'username', 0) as HTMLTextAreaElement).value;
    var password = (getDescendantsByClassAt(record, 'password', 0) as HTMLTextAreaElement).value;

    var selections = (getDescendantsByTag(getDescendantsByClassAt(record, 'user-group', 0), 'input') as HTMLCollectionOf<HTMLInputElement>);
    var user_group = '';
    for (let selection of selections) {
        if (selection.checked) {
            user_group = selection.value;
            break;
        }
    }

    selections = (getDescendantsByTag(getDescendantsByClassAt(record, 'status', 0), 'input') as HTMLCollectionOf<HTMLInputElement>);
    var status = '';
    for (let selection of selections) {
        if (selection.checked) {
            status = selection.value;
            break;
        }
    }

    var available_invite = (getDescendantsByClassAt(record, 'available-invite', 0) as HTMLTextAreaElement).value;

    var parsedRecord = await parseAccountRecord(email, username, password, user_group, status, available_invite);
    if (!parsedRecord) {
        return;
    }

    if (parsedRecord.password === null) {
        alert("ERROR: 'password' is required");
        return;
    }

    var param = {
        command: 'insert',
        type: 'account',
        ...parsedRecord
    };

    var confirm;
    do {
        confirm = prompt('Type "insert" to confirm.');
        if (confirm === null) {
            return;
        }
    } while (confirm != "insert");

    sendServerRequest('console.php', {
        callback: accountCompleteCallback,
        content: "p=" + encodeURIComponent(JSON.stringify(param))
    });
}

async function modifyAccount(button: Element, originalEmail: string) {
    var record = getParent(getParent(button));
    var email = (getDescendantsByClassAt(record, 'email', 0) as HTMLTextAreaElement).value;
    var username = (getDescendantsByClassAt(record, 'username', 0) as HTMLTextAreaElement).value;
    var password = (getDescendantsByClassAt(record, 'password', 0) as HTMLTextAreaElement).value;

    var selections = (getDescendantsByTag(getDescendantsByClassAt(record, 'user-group', 0), 'input') as HTMLCollectionOf<HTMLInputElement>);
    var user_group = '';
    for (let selection of selections) {
        if (selection.checked) {
            user_group = selection.value;
            break;
        }
    }

    selections = (getDescendantsByTag(getDescendantsByClassAt(record, 'status', 0), 'input') as HTMLCollectionOf<HTMLInputElement>);
    var status = '';
    for (let selection of selections) {
        if (selection.checked) {
            status = selection.value;
            break;
        }
    }

    var available_invite = (getDescendantsByClassAt(record, 'available-invite', 0) as HTMLTextAreaElement).value;

    var parsedRecord = await parseAccountRecord(email, username, password, user_group, status, available_invite);
    if (!parsedRecord) {
        return;
    }

    var param = {
        command: 'modify',
        type: 'account',
        original_email: originalEmail,
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
        callback: accountCompleteCallback,
        content: "p=" + encodeURIComponent(JSON.stringify(param))
    });
}

async function parseAccountRecord(email: string, username: string, password: string, user_group: string, status: string, available_invite: string) {
    if (email == '') {
        alert("ERROR: 'email' is required");
        return false;
    }

    if (username == '') {
        alert("ERROR: 'username' is required");
        return false;
    }

    let password_parsed: string | null;
    if (password == '') {
        password_parsed = null;
    } else if (!PASSWORD_REGEX.test(password)) {
        alert("ERROR: password requirements not met");
        return false;
    } else {
        password_parsed = await hashPassword(password);
    }

    let user_group_parsed: number;
    if (user_group == 'admin') {
        user_group_parsed = 0;
    } else if (user_group == 'user') {
        user_group_parsed = 1;
    } else {
        alert("ERROR: Invalid value for 'user_group'");
        return false;
    }

    let status_parsed: number;
    if (status == 'active') {
        status_parsed = 0;
    } else if (status == 'deactivated') {
        status_parsed = 1;
    } else if (status == 'banned') {
        status_parsed = 2;
    } else {
        alert("ERROR: Invalid value for 'status'");
        return false;
    }

    let available_invite_parsed: number;
    if (available_invite == '') {
        alert("ERROR: 'available_invite' is required");
        return false;
    }
    available_invite_parsed = parseInt(available_invite);
    if (isNaN(available_invite_parsed)) {
        alert("ERROR: Invalid value for 'available_invite'");
        return false;
    } else if (available_invite_parsed > 255 || available_invite_parsed < 0) {
        alert("ERROR: 'available_invite' should be in range 0-255");
        return false;
    }

    return {
        email: email,
        username: username,
        password: password_parsed,
        user_group: user_group_parsed,
        status: status_parsed,
        available_invite: available_invite_parsed
    };
}

function deleteAccount(email: string) {
    var confirm;
    do {
        confirm = prompt('Type "delete" to confirm. Deleting an account is NOT recommended. Use "status" option instead.');
        if (confirm === null) {
            return;
        }
    } while (confirm != "delete");

    var param = {
        command: 'delete',
        type: 'account',
        email: email
    };

    sendServerRequest('console.php', {
        callback: accountCompleteCallback,
        content: "p=" + encodeURIComponent(JSON.stringify(param))
    });
}

function updateEventHandlers() {
    var buttons = getByClass('add-account');
    for (let button of buttons) {
        if (!containsClass(button, 'initialized')) {
            addClass(button, 'initialized');
            addEventListener(button, 'click', function () {
                addAccount(button);
            });
        }
    }

    buttons = getByClass('modify-account');
    for (let button of (buttons as HTMLCollectionOf<HTMLElement>)) {
        if (!containsClass(button, 'initialized')) {
            addClass(button, 'initialized');
            addEventListener(button, 'click', function () {
                if (button.dataset.email === undefined) {
                    alert("ERROR: 'email' attribute on the element is undefined.");
                    return;
                }
                modifyAccount(button, button.dataset.email);
            });
        }
    }

    buttons = getByClass('delete-account');
    for (let button of (buttons as HTMLCollectionOf<HTMLElement>)) {
        if (!containsClass(button, 'initialized')) {
            addClass(button, 'initialized');
            addEventListener(button, 'click', function () {
                if (button.dataset.email === undefined) {
                    alert("ERROR: 'email' attribute on the element is undefined.");
                    return;
                }
                deleteAccount(button.dataset.email);
            });
        }
    }
}