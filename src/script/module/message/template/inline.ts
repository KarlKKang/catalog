import { addClass, appendText, createAnchorElement, createTextNode } from '../../dom';
import { TOP_DOMAIN } from '../../env/constant';

export { passwordChanged, emailAlreadyRegistered } from './comm';

export const invalidEmailFormat = '有効なメールアドレスを入力してください。';

export const emailSent = 'メールを送信しました。届くまでに時間がかかる場合があります。';
export const invitationNotQualified = '使える招待券が残っていません。';
export const invitationClosed = '現在、新規登録は受け付けておりません。';
export const invitationOnly = '現在、登録は招待制となっています。';

export const invalidPasswordFormat = 'パスワードが要件を満たしていません。';
export const passwordConfirmationMismatch = 'パスワードの確認再入力が一致しません。';
export const passwordUnchanged = '入力されたパスワードは、元のパスワードと同じです。';

export const usernameEmpty = 'ユーザー名を空欄にすることはできません。';
export const usernameInvalid = 'ユーザー名に無効な文字が含まれています。';
export const usernameUnchanged = '新しいユーザー名は元のユーザー名と同じです。';
export const usernameChanged = 'ユーザー名を変更しました。';
export const usernameTaken = 'このユーザーネームはすでに使われています。別のユーザー名を入力してください。';

export const loginFailed = 'メールアドレスまたはパスワードが正しくありません。';
export const tooManyFailedLogin = 'ログイン試行の回数が上限を超えました。ユーザー保護のため、現在ログインすることはできません。しばらくしてからもう一度お試しください。';
export const failedTotp = '入力されたコードが正しくありません。';
export const accountDeactivated = () => {
    const message: [Text, HTMLAnchorElement, Text] = [
        createTextNode('お客様のアカウントは無効化されています。アカウントの再有効化をご希望の場合は、管理者（'),
        createAnchorElement(),
        createTextNode('）にご連絡ください。')
    ];
    addClass(message[1], 'link');
    message[1].href = 'mailto:admin@' + TOP_DOMAIN;
    appendText(message[1], 'admin@' + TOP_DOMAIN);
    return message;
};

export const emailChangeWait = '直前までメールアドレスを変更していたため、30分ほど待ってから再度変更を試みてください。';
export const generateRecoveryCodeWait = '直前にリカバリーコードを生成したため、1時間ほど待ってから再度生成を試みてください。';
export const logoutDone = 'ログアウトしました。';

export const mfaNotSet = '二要素認証が設定されていません。';
export const mfaAlreadySet = '二要素認証はすでに有効になっています。';
export const mfaDisabled = '二要素認証が無効になりました。';
export const mfaEnabled = '二要素認証が有効になりました。';

export const loginNotificationEnabled = 'ログイン通知が有効になりました。';
export const loginNotificationDisabled = 'ログイン通知が無効になりました。';
export const loginNotificationIsEnabled = 'ログイン通知が有効になっています。';
export const loginNotificationIsDisabled = 'ログイン通知が無効になっています。';
export const enableButtonText = '有効にする';
export const disableButtonText = '無効にする';
export const submitButtonText = '送信する';
export const cancelButtonText = 'キャンセル';

export const sessionEnded = 'セッションは終了した。もう一度お試しください。';

export const loading = '読み込み中…';
export const allResultsShown = 'すべての結果が表示されました。';
export const noResult = '何も見つかりませんでした。';