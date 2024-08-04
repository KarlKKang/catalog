import { createEmailLink, createTextNode } from '../../dom/create_element';
import { TOP_DOMAIN } from '../../env/domain';

export const defaultErrorSuffix = 'このエラーが続く場合は、管理者にお問い合わせください。';

export const invalidEmailFormat = '有効なメールアドレスを入力してください。';
export const emailAlreadyRegistered = 'このメールアドレスはすでに登録済みです。';
export const emailSentSuffix = '届くまでに時間がかかる場合があります。';

export const invitationClosed = '現在、新規登録は受け付けておりません。';

export const invalidPasswordFormat = 'パスワードが要件を満たしていません。';
export const passwordConfirmationMismatch = 'パスワードの確認再入力が一致しません。';
export const passwordChanged = 'パスワードを変更しました。';

export const usernameEmpty = 'ユーザー名を空欄にすることはできません。';
export const usernameInvalid = 'ユーザー名に無効な文字が含まれています。';
export const usernameChanged = 'ユーザー名を変更しました。';
export const usernameTaken = 'このユーザーネームはすでに使われています。別のユーザー名を入力してください。';

export const loginFailed = 'メールアドレスまたはパスワードが正しくありません。';
export const tooManyFailedLogin = 'ログイン試行の回数が上限を超えました。ユーザー保護のため、現在ログインすることはできません。しばらくしてからもう一度お試しください。';
export const failedTotp = '入力されたコードが正しくありません。';
export const accountDeactivated = () => {
    const message: [Text, HTMLAnchorElement, Text] = [
        createTextNode('お客様のアカウントは無効化されています。アカウントの再有効化をご希望の場合は、管理者（'),
        createEmailLink('admin@' + TOP_DOMAIN),
        createTextNode('）にご連絡ください。'),
    ];
    return message;
};
export const sessionEnded = 'セッションは終了した。もう一度お試しください。';
