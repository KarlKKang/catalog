export const defaultErrorTitle = 'エラーが発生しました';

export const defaultErrorSuffix = 'このエラーが続く場合は、管理者にお問い合わせください。';
export const browserCompatibilitySuffix = '別のブラウザで、もう一度お試しください。';

export const passwordChanged = 'パスワードを変更しました。';
export const emailAlreadyRegistered = 'このメールアドレスはすでに登録済みです。';

export const nextButtonText = '次に進む';

export interface MessageParam {
    message?: string;
    title?: string;
    color?: string;
    url?: string;
    buttonText?: string | null;
    logout?: boolean;
    replaceBody?: boolean;
}