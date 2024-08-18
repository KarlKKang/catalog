import { getHostname } from '../../dom/location/get/hostname';

export const mediaLoadError = 'ネットワークエラーが発生しました。インターネット接続環境をご確認の上、再度お試しください。または、' + getHostname() + 'の他のタブでの操作が、現在のタブに干渉している可能性があります。この場合、' + getHostname() + 'の他のタブを閉じてからページを再読み込みしてみてください。';
