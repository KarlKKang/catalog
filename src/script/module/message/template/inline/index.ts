import { addClass, appendText, createAnchorElement, createTextNode } from '../../../dom';
import { TOP_DOMAIN } from '../../../env/constant';

export { passwordChanged, emailAlreadyRegistered } from '../comm';

export const invalidEmailFormat = '有効なメールアドレスを入力してください。';

export const emailSent = 'メールを送信しました。届くまでに時間がかかる場合があります。';
export const invitationNotQualified = '使える招待状が残っていません。';
export const invitationClosed = '現在、新規登録は受け付けておりません。';
export const invitationOnly = '現在、登録は招待制となっています。';

export const invalidPasswordFormat = 'パスワードが要件を満たしていません。';
export const passwordConfirmationMismatch = 'パスワードの確認再入力が一致しません。';
export const passwordUnchanged = '入力されたパスワードは、元のパスワードと同じです。';

export const usernameEmpty = 'ユーザー名を空欄にすることはできません。';
export const usernameUnchanged = '新しいユーザー名は元のユーザー名と同じです。';
export const usernameChanged = 'ユーザー名を変更しました。';
export const usernameTaken = 'このユーザーネームはすでに使われています。別のユーザー名を入力してください。';

export const loginFailed = 'アカウントIDかパスワードが正しくありません。';
export const accountDeactivated = function () {
    const message = [
        createTextNode('お客様のアカウントは無効化されています。アカウントの再有効化をご希望の場合は、管理者（'),
        createAnchorElement(),
        createTextNode('）にご連絡ください。')
    ] as const;
    addClass(message[1], 'link');
    message[1].href = 'mailto:admin@' + TOP_DOMAIN;
    appendText(message[1], 'admin@' + TOP_DOMAIN);
    return message;
};

export const emailChangeWait = '直前までメールアドレスを変更していたため、30分ほど待ってから再度変更を試みてください。';