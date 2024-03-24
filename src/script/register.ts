import {
    LOGIN_URL,
} from './module/env/constant';
import {
    getURLParam,
} from './module/common';
import { sendServerRequest } from './module/server';
import {
    addEventListener,
    openWindow,
    replaceText,
    clearSessionStorage,
    disableInput,
    createDivElement,
    createParagraphElement,
    createSpanElement,
    addClass,
    appendChild,
    appendText,
    body,
    createPasswordInput,
    createButtonElement,
    createUListElement,
    appendListItems,
} from './module/dom';
import { showMessage } from './module/message';
import { expired } from './module/message/param';
import { emailAlreadyRegistered as emailAlreadyRegisteredBody, invalidPasswordFormat, passwordConfirmationMismatch, usernameEmpty, usernameInvalid, usernameTaken } from './module/text/message/body';
import { PASSWORD_REGEX } from './module/common/pure';
import type { ShowPageFunc } from './module/type/ShowPageFunc';
import { redirect } from './module/global';
import { invalidResponse } from './module/server/message';
import { hideElement, horizontalCenter, showElement } from './module/style';
import { nextButtonText, passwordRules, usernameRule } from './module/text/ui';
import * as commonStyles from '../css/common.module.scss';
import * as styles from '../css/portal_form.module.scss';
import { completed } from './module/text/message/title';
import { addManualMultiLanguageClass, createUsernameInput } from './module/dom/create_element/multi_language';
import { CSS_COLOR } from './module/style/value';

const emailAlreadyRegistered = {
    title: '失敗しました',
    message: emailAlreadyRegisteredBody,
    buttonText: null
};

export default function (showPage: ShowPageFunc) {
    clearSessionStorage();

    const param = getURLParam('p');
    if (param === null || !/^[a-zA-Z0-9~_-]+$/.test(param)) {
        if (DEVELOPMENT) {
            showPage();
            showPageCallback('test');
        } else {
            redirect(LOGIN_URL, true);
        }
        return;
    }

    sendServerRequest('register', {
        callback: function (response: string) {
            if (response === 'EXPIRED') {
                showMessage(expired);
            } else if (response === 'ALREADY REGISTERED') {
                showMessage(emailAlreadyRegistered);
            } else if (response === 'APPROVED') {
                showPage();
                showPageCallback(param);
            } else {
                showMessage(invalidResponse());
            }
        },
        content: 'p=' + param,
    });
}

function showPageCallback(param: string) {
    const container = createDivElement();
    addClass(container, styles.container);
    appendChild(body, container);

    const title = createParagraphElement('会員情報登録');
    addClass(title, styles.title);
    appendChild(container, title);

    appendChild(container, getInfoNote());

    const warningElem = createParagraphElement();
    addClass(warningElem, styles.warning);
    hideElement(warningElem);
    appendChild(container, warningElem);

    const [usernameContainer, usernameInput] = createUsernameInput();
    horizontalCenter(usernameContainer);
    appendChild(container, usernameContainer);

    const [passwordContainer, passwordInput] = createPasswordInput(true);
    horizontalCenter(passwordContainer);
    appendChild(container, passwordContainer);

    const [passwordConfirmContainer, passwordConfirmInput] = createPasswordInput(true, 'パスワード（確認）');
    horizontalCenter(passwordConfirmContainer);
    appendChild(container, passwordConfirmContainer);

    const submitButton = createButtonElement('登録する');
    horizontalCenter(submitButton);
    appendChild(container, submitButton);

    const note = createDivElement();
    addClass(note, styles.note);
    const noteList = createUListElement();
    appendListItems(noteList, usernameRule, ...passwordRules);
    appendChild(note, noteList);
    appendChild(container, note);

    addEventListener(usernameInput, 'keydown', (event) => {
        if ((event as KeyboardEvent).key === 'Enter') {
            register();
        }
    });
    addEventListener(passwordInput, 'keydown', (event) => {
        if ((event as KeyboardEvent).key === 'Enter') {
            register();
        }
    });
    addEventListener(passwordConfirmInput, 'keydown', (event) => {
        if ((event as KeyboardEvent).key === 'Enter') {
            register();
        }
    });
    addEventListener(submitButton, 'click', () => {
        register();
    });

    function register() {
        disableAllInputs(true);

        const username = usernameInput.value;
        const password = passwordInput.value;
        const passwordConfirm = passwordConfirmInput.value;

        if (username === '') {
            replaceText(warningElem, usernameEmpty);
            showElement(warningElem);
            disableAllInputs(false);
            return;
        }

        if (!PASSWORD_REGEX.test(password)) {
            replaceText(warningElem, invalidPasswordFormat);
            showElement(warningElem);
            disableAllInputs(false);
            return;
        } else if (password !== passwordConfirm) {
            replaceText(warningElem, passwordConfirmationMismatch);
            showElement(warningElem);
            disableAllInputs(false);
            return;
        }

        sendServerRequest('register', {
            callback: function (response: string) {
                const showInlineMessage = (message: string) => {
                    replaceText(warningElem, message);
                    showElement(warningElem);
                    disableAllInputs(false);
                };
                if (response === 'EXPIRED') {
                    showMessage(expired);
                } else if (response === 'USERNAME DUPLICATED') {
                    showInlineMessage(usernameTaken);
                } else if (response === 'USERNAME EMPTY') {
                    showInlineMessage(usernameEmpty);
                } else if (response === 'USERNAME INVALID') {
                    showInlineMessage(usernameInvalid);
                } else if (response === 'PASSWORD INVALID') {
                    showInlineMessage(invalidPasswordFormat);
                } else if (response === 'ALREADY REGISTERED') {
                    showMessage(emailAlreadyRegistered);
                } else if (response === 'DONE') {
                    showMessage({
                        title: completed,
                        message: 'アカウントが登録されました。',
                        color: CSS_COLOR.GREEN,
                        url: LOGIN_URL,
                        buttonText: nextButtonText
                    });
                } else {
                    showMessage(invalidResponse());
                }
            },
            content: 'p=' + param + '&username=' + encodeURIComponent(username) + '&password=' + encodeURIComponent(password),
        });
    }

    function disableAllInputs(disabled: boolean) {
        submitButton.disabled = disabled;
        disableInput(usernameInput, disabled);
        disableInput(passwordInput, disabled);
        disableInput(passwordConfirmInput, disabled);
    }
}

function getInfoNote() {
    const texts = [
        [null, '登録する前に、', 'ご利用ガイド', 'をお読みください。'],
        ['en', 'Before you register, please read the ', 'User Guide', '.'],
        ['zh-Hant', '請在註冊前閱讀', '規範與指南', '。'],
        ['zh-Hans', '请在注册前阅读', '规则与指南', '。'],
    ] as const;

    const container = createDivElement();
    addClass(container, styles.note);
    addManualMultiLanguageClass(container);
    for (const [lang, ...text] of texts) {
        const paragraph = createParagraphElement(text[0]);
        if (lang !== null) {
            paragraph.lang = lang;
        }
        const link = createSpanElement(text[1]);
        addClass(link, commonStyles.link);
        appendChild(paragraph, link);
        appendText(paragraph, text[2]);
        appendChild(container, paragraph);
        addEventListener(link, 'click', () => {
            const uri = 'info' + (lang === null ? '' : '#' + lang);
            openWindow(uri);
        });
    }
    return container;
}