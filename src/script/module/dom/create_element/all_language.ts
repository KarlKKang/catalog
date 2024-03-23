import '../../../../font/dist/NotoSans/NotoSans-Regular.css';
import '../../../../font/dist/NotoSans/NotoSans-Medium.css';
import '../../../../font/dist/NotoSansJP/NotoSansJP-Regular.css';
import '../../../../font/dist/NotoSansTC/NotoSansTC-Regular.css';
import '../../../../font/dist/NotoSansTC/NotoSansTC-Medium.css';
import '../../../../font/dist/NotoSansSC/NotoSansSC-Regular.css';
import '../../../../font/dist/NotoSansSC/NotoSansSC-Medium.css';
import { addManualMultiLanguageClass } from './multi_language';

export function addManualAllLanguageClass(elem: HTMLElement) {
    addManualMultiLanguageClass(elem);
}