import { ServerRequestOptionKey, sendServerRequest } from '../module/server/request';
import { createStyledButtonElement } from '../module/dom/element/button/styled/create';
import { createPasswordInputField } from '../module/dom/element/input/input_field/password/create';
import { appendListItems } from '../module/dom/element/list/append_item';
import { replaceText } from '../module/dom/element/text/replace';
import { appendText } from '../module/dom/element/text/append';
import { createUListElement } from '../module/dom/element/list/ul/create';
import { createParagraphElement } from '../module/dom/element/paragraph/create';
import { createSpanElement } from '../module/dom/element/span/create';
import { createDivElement } from '../module/dom/element/div/create';
import { disableInputField } from '../module/dom/element/input/input_field/disable';
import { disableButton } from '../module/dom/element/button/disable';
import { appendChild } from '../module/dom/node/append_child';
import { addClass } from '../module/dom/class/add';
import { body } from '../module/dom/body';
import { openWindow } from '../module/dom/window/open';
import { addEventListener } from '../module/event_listener/add';
import { showMessage } from '../module/message';
import { expired } from '../module/message/param/expired';
import { passwordConfirmationMismatch } from '../module/text/password/mismatch';
import { invalidPasswordFormat } from '../module/text/password/invalid';
import { usernameTaken } from '../module/text/username/taken';
import { usernameInvalid } from '../module/text/username/invalid';
import { usernameEmpty } from '../module/text/username/empty';
import { testPassword } from '../module/regex/password';
import { buildURI } from '../module/string/uri/build';
import { buildHttpForm } from '../module/string/http_form/build';
import { invalidResponse } from '../module/message/param/invalid_response';
import { horizontalCenter } from '../module/style/horizontal_center';
import { showElement } from '../module/style/show_element';
import { hideElement } from '../module/style/hide_element';
import { passwordRule } from '../module/text/password/rule';
import { usernameRule } from '../module/text/username/rule';
import { nextButtonText } from '../module/text/button/next';
import { link as linkClass } from '../../css/link.module.scss';
import * as styles from '../../css/portal_form.module.scss';
import { completedTitle } from '../module/text/misc/completed_title';
import { addManualMultiLanguageClass } from '../module/style/multi_language/manual';
import { createUsernameInputField } from '../module/dom/element/input/input_field/username/create';
import { CSS_COLOR } from '../module/style/color';
import { MessageParamKey } from '../module/message/type';
import { emailAlreadyRegistered } from './shared';
import { INFO_URI, LOGIN_URI } from '../module/env/uri';
import { EN_LANG_CODE } from '../module/lang/en';
import { ZH_HANT_LANG_CODE } from '../module/lang/zh_hant';
import { ZH_HANS_LANG_CODE } from '../module/lang/zh_hans';
import { InputFieldElementKey } from '../module/dom/element/input/input_field/type';

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

    const usernameInputField = createUsernameInputField();
    const {
        [InputFieldElementKey.CONTAINER]: usernameContainer,
        [InputFieldElementKey.INPUT]: usernameInput,
    } = usernameInputField;
    horizontalCenter(usernameContainer);
    appendChild(container, usernameContainer);

    const passwordInputField = createPasswordInputField(true);
    const {
        [InputFieldElementKey.CONTAINER]: passwordContainer,
        [InputFieldElementKey.INPUT]: passwordInput,
    } = passwordInputField;
    horizontalCenter(passwordContainer);
    appendChild(container, passwordContainer);

    const passwordConfirmInputField = createPasswordInputField(true, 'パスワード（確認）');
    const {
        [InputFieldElementKey.CONTAINER]: passwordConfirmContainer,
        [InputFieldElementKey.INPUT]: passwordConfirmInput,
    } = passwordConfirmInputField;
    horizontalCenter(passwordConfirmContainer);
    appendChild(container, passwordConfirmContainer);

    const submitButton = createStyledButtonElement('登録する');
    horizontalCenter(submitButton);
    appendChild(container, submitButton);

    const note = createDivElement();
    addClass(note, styles.note);
    const noteList = createUListElement();
    appendListItems(noteList, usernameRule, ...passwordRule);
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

        if (!testPassword(password)) {
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
            [ServerRequestOptionKey.CALLBACK]: function (response: string) {
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
                        [MessageParamKey.TITLE]: completedTitle,
                        [MessageParamKey.MESSAGE]: 'アカウントが登録されました。',
                        [MessageParamKey.COLOR]: CSS_COLOR.GREEN,
                        [MessageParamKey.URL]: LOGIN_URI,
                        [MessageParamKey.BUTTON]: nextButtonText,
                    });
                } else {
                    showMessage(invalidResponse(true));
                }
            },
            [ServerRequestOptionKey.CONTENT]: buildHttpForm({ p: param, username: username, password: password }),
            [ServerRequestOptionKey.CLOSE_WINDOW_ON_ERROR]: true,
        });
    }

    function disableAllInputs(disabled: boolean) {
        disableButton(submitButton, disabled);
        disableInputField(usernameInputField, disabled);
        disableInputField(passwordInputField, disabled);
        disableInputField(passwordConfirmInputField, disabled);
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
        addClass(link, linkClass);
        appendChild(paragraph, link);
        appendText(paragraph, text[2]);
        appendChild(container, paragraph);
        addEventListener(link, 'click', () => {
            openWindow(buildURI(INFO_URI, buildHttpForm({ 'nav-bar': 'no' }), lang));
        });
    }
    return container;
}
