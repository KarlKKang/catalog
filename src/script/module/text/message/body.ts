import { getHostname } from '../../dom/location/get/hostname';

export const defaultErrorSuffix = 'このエラーが続く場合は、管理者にお問い合わせください。';

export const invitationClosed = '現在、新規登録は受け付けておりません。';

export const sessionEnded = 'セッションは終了した。もう一度お試しください。';

export const mediaLoadError = 'ネットワークエラーが発生しました。インターネット接続環境をご確認の上、再度お試しください。または、' + getHostname() + 'の他のタブでの操作が、現在のタブに干渉している可能性があります。この場合、ページを再読み込みしてみてください。';
export const mediaIncompatibleSuffix = '他のブラウザをご利用いただくか、パソコンでファイルをダウンロードして再生してください。';
