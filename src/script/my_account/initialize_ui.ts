import { createStyledButtonElement } from '../module/dom/element/button/styled/create';
import { createPasswordInputField } from '../module/dom/element/input/input_field/password/create';
import { createEmailInputField } from '../module/dom/element/input/input_field/email/create';
import { appendListItems } from '../module/dom/element/list/append_item';
import { createUListElement } from '../module/dom/element/list/ul/create';
import { createHRElement } from '../module/dom/element/hr/create';
import { createParagraphElement } from '../module/dom/element/paragraph/create';
import { createSpanElement } from '../module/dom/element/span/create';
import { createDivElement } from '../module/dom/element/div/create';
import { appendChild } from '../module/dom/node/append_child';
import { appendChildren } from '../module/dom/node/append_children';
import { addClass } from '../module/dom/class/add';
import { hideElement } from '../module/style/hide_element';
import { myAccountPageTitle } from '../module/text/page_title';
import { loading } from '../module/text/search/loading';
import { passwordRule } from '../module/text/password/rule';
import { usernameRule } from '../module/text/username/rule';
import { changeButtonText } from '../module/text/button/change';
import { submitButtonText } from '../module/text/button/submit';
import { createUsernameInputField } from '../module/dom/element/input/input_field/username/create';
import * as styles from '../../css/my_account.module.scss';
import { type InputFieldElement, InputFieldElementKey } from '../module/dom/element/input/input_field/type';
import { body } from '../module/dom/body';

export const enum MyAccountInputField {
    newUsernameInputField,
    newPasswordInputField,
    newPasswordComfirmInputField,
    inviteReceiverEmailInputField,
}

export const enum MyAccountButton {
    emailChangeButton,
    usernameChangeButton,
    passwordChangeButton,
    inviteButton,
    logoutButton,
    mfaButton,
    recoveryCodeButton,
    loginNotificationButton,
}

export const enum MyAccountElement {
    emailWarning,
    usernameWarning,
    passwordWarning,
    inviteWarning,
    mfaWarning,
    recoveryCodeWarning,
    loginNotificationWarning,
    inviteCount,
    mfaInfo,
    recoveryCodeInfo,
    loginNotificationInfo,
    sessionsContainer,
}

export type MyAccountAllInputFields = Readonly<Record<MyAccountInputField, InputFieldElement>>;
export type MyAccountAllButtons = Readonly<Record<MyAccountButton, HTMLButtonElement>>;
export type MyAccountAllElements = Readonly<Record<MyAccountElement, HTMLElement>>;

export function initializeUI() {
    const container = createDivElement();
    addClass(container, styles.container);
    appendChild(body, container);
    const titleElem = createParagraphElement(myAccountPageTitle);
    addClass(titleElem, styles.title);
    appendChild(container, titleElem);

    const changeEmailSubsec = appendSubsection(container, 'メールアドレス', [], createParagraphElement(), [], createStyledButtonElement(changeButtonText), []);

    const usernameInputField = createUsernameInputField();
    const usernameSubsec = appendSubsection(container, 'ユーザー名', [], createParagraphElement(), [usernameInputField[InputFieldElementKey.CONTAINER]], createStyledButtonElement(changeButtonText), [usernameRule]);

    const passwordInputField = createPasswordInputField(true, '新しいパスワード');
    const passwordConfirmInputField = createPasswordInputField(true, '確認再入力');
    const passwordSubsec = appendSubsection(container, 'パスワード', [], createParagraphElement(), [passwordInputField[InputFieldElementKey.CONTAINER], passwordConfirmInputField[InputFieldElementKey.CONTAINER]], createStyledButtonElement(changeButtonText), passwordRule);

    const mfaInfo = createParagraphElement();
    const mfaSubsec = appendSubsection(container, '二要素認証', [mfaInfo], createParagraphElement(), [], createStyledButtonElement(), []);

    const recoveryCodeInfo = createParagraphElement();
    const recoveryCodeSubsec = appendSubsection(container, 'リカバリーコード', [recoveryCodeInfo], createParagraphElement(), [], createStyledButtonElement('生成する'), ['新しいコードを生成すると、既存のコードは無効になります。']);

    const loginNotificationInfo = createParagraphElement();
    const loginNotificationSubsec = appendSubsection(container, 'ログイン通知メール', [loginNotificationInfo], createParagraphElement(), [], createStyledButtonElement(), []);

    const sessionsContainer = createDivElement();
    addClass(sessionsContainer, styles.sessions);
    const sessionsLoadingText = createParagraphElement(loading);
    appendChild(sessionsContainer, sessionsLoadingText);
    appendSubsection(container, 'お使いのデバイス', [sessionsContainer], null, [], null, []);

    const inviteCountInfo = createParagraphElement('保有している招待券の枚数：');
    const inviteCount = createSpanElement();
    appendChild(inviteCountInfo, inviteCount);
    const inviteReceiverEmailInputField = createEmailInputField();
    inviteReceiverEmailInputField[InputFieldElementKey.INPUT].autocomplete = 'off';
    const inviteSubsec = appendSubsection(container, 'ご招待', [inviteCountInfo], createParagraphElement(), [inviteReceiverEmailInputField[InputFieldElementKey.CONTAINER]], createStyledButtonElement(submitButtonText), []);

    const logoutButton = createStyledButtonElement('ログアウ');
    appendChild(container, logoutButton);

    const inputFields: MyAccountAllInputFields = {
        [MyAccountInputField.newUsernameInputField]: usernameInputField,
        [MyAccountInputField.newPasswordInputField]: passwordInputField,
        [MyAccountInputField.newPasswordComfirmInputField]: passwordConfirmInputField,
        [MyAccountInputField.inviteReceiverEmailInputField]: inviteReceiverEmailInputField,
    };
    const buttons: MyAccountAllButtons = {
        [MyAccountButton.emailChangeButton]: changeEmailSubsec[1],
        [MyAccountButton.usernameChangeButton]: usernameSubsec[1],
        [MyAccountButton.passwordChangeButton]: passwordSubsec[1],
        [MyAccountButton.inviteButton]: inviteSubsec[1],
        [MyAccountButton.logoutButton]: logoutButton,
        [MyAccountButton.mfaButton]: mfaSubsec[1],
        [MyAccountButton.recoveryCodeButton]: recoveryCodeSubsec[1],
        [MyAccountButton.loginNotificationButton]: loginNotificationSubsec[1],
    };
    const elements: MyAccountAllElements = {
        [MyAccountElement.emailWarning]: changeEmailSubsec[0],
        [MyAccountElement.usernameWarning]: usernameSubsec[0],
        [MyAccountElement.passwordWarning]: passwordSubsec[0],
        [MyAccountElement.inviteWarning]: inviteSubsec[0],
        [MyAccountElement.mfaWarning]: mfaSubsec[0],
        [MyAccountElement.recoveryCodeWarning]: recoveryCodeSubsec[0],
        [MyAccountElement.loginNotificationWarning]: loginNotificationSubsec[0],
        [MyAccountElement.inviteCount]: inviteCount,
        [MyAccountElement.mfaInfo]: mfaInfo,
        [MyAccountElement.recoveryCodeInfo]: recoveryCodeInfo,
        [MyAccountElement.loginNotificationInfo]: loginNotificationInfo,
        [MyAccountElement.sessionsContainer]: sessionsContainer,
    };

    return [inputFields, buttons, elements] as const;
}

function appendSubsection<T extends (HTMLElement | null), U extends (HTMLButtonElement | null)>(
    container: HTMLDivElement,
    title: string,
    infoElements: HTMLElement[],
    warningElem: T,
    inputContainers: HTMLElement[],
    buttonElem: U,
    notes: string[],
): [T, U] {
    const titleElem = createParagraphElement(title);
    addClass(titleElem, styles.subTitle);
    appendChild(container, titleElem);

    appendChildren(container, ...infoElements);

    if (warningElem !== null) {
        addClass(warningElem, styles.warning);
        hideElement(warningElem);
        appendChild(container, warningElem);
    }

    appendChildren(container, ...inputContainers);

    if (buttonElem !== null) {
        appendChild(container, buttonElem);
    }

    if (notes.length !== 0) {
        const noteElem = createUListElement();
        addClass(noteElem, styles.note);
        appendListItems(noteElem, ...notes);
        appendChild(container, noteElem);
    }

    const hr = createHRElement();
    appendChild(container, hr);

    return [warningElem, buttonElem];
}
