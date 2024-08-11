import { ServerRequestOptionProp, sendServerRequest } from '../module/server';
import { createButtonElement } from '../module/dom/element/button/create';
import { createPasswordInput } from '../module/dom/element/password_input/create';
import { appendListItems } from '../module/dom/element/list/append_item';
import { replaceText } from '../module/dom/element/text/replace';
import { appendText } from '../module/dom/element/text/append';
import { createUListElement } from '../module/dom/element/list/ul/create';
import { createParagraphElement } from '../module/dom/element/paragraph/create';
import { createSpanElement } from '../module/dom/element/span/create';
import { createDivElement } from '../module/dom/element/div/create';
import { disableButton, disableInput } from '../module/dom/change_input';
import { appendChild } from '../module/dom/change_node';
import { addClass } from '../module/dom/class';
import { body } from '../module/dom/body';
import { openWindow } from '../module/dom/document';
import { addEventListener } from '../module/event_listener';
import { showMessage } from '../module/message';
import { expired } from '../module/message/param';
import { invalidPasswordFormat, passwordConfirmationMismatch, usernameEmpty, usernameInvalid, usernameTaken } from '../module/text/message/body';
import { PASSWORD_REGEX } from '../module/regex';
import { buildURLForm, buildURI } from '../module/http_form';
import { invalidResponse } from '../module/server/message';
import { horizontalCenter } from '../module/style/horizontal_center';
import { showElement } from '../module/style/show_element';
import { hideElement } from '../module/style/hide_element';
import { nextButtonText, passwordRules, usernameRule } from '../module/text/ui';
import * as commonStyles from '../../css/common.module.scss';
import * as styles from '../../css/portal_form.module.scss';
import { completed } from '../module/text/message/title';
import { addManualMultiLanguageClass, createUsernameInput } from '../module/dom/element/multi_language';
import { CSS_COLOR } from '../module/style/color';
import { MessageParamKey } from '../module/message/type';
import { emailAlreadyRegistered } from './shared';
import { INFO_URI, LOGIN_URI } from '../module/env/uri';
import { EN_LANG_CODE, ZH_HANS_LANG_CODE, ZH_HANT_LANG_CODE } from '../module/lang';

export default function (param: string) {
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
            [ServerRequestOptionProp.CALLBACK]: function (response: string) {
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
                        [MessageParamKey.TITLE]: completed,
                        [MessageParamKey.MESSAGE]: 'アカウントが登録されました。',
                        [MessageParamKey.COLOR]: CSS_COLOR.GREEN,
                        [MessageParamKey.URL]: LOGIN_URI,
                        [MessageParamKey.BUTTON_TEXT]: nextButtonText,
                    });
                } else {
                    showMessage(invalidResponse());
                }
            },
            [ServerRequestOptionProp.CONTENT]: buildURLForm({ p: param, username: username, password: password }),
        });
    }

    function disableAllInputs(disabled: boolean) {
        disableButton(submitButton, disabled);
        disableInput(usernameInput, disabled);
        disableInput(passwordInput, disabled);
        disableInput(passwordConfirmInput, disabled);
    }
}

function getInfoNote() {
    const texts = [
        [null, '登録する前に、', 'ご利用ガイド', 'をお読みください。'],
        [EN_LANG_CODE, 'Before you register, please read the ', 'User Guide', '.'],
        [ZH_HANT_LANG_CODE, '請在註冊前閱讀', '規範與指南', '。'],
        [ZH_HANS_LANG_CODE, '请在注册前阅读', '规则与指南', '。'],
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
            openWindow(buildURI(INFO_URI, buildURLForm({ 'nav-bar': 'no' }), lang));
        });
    }
    return container;
}
