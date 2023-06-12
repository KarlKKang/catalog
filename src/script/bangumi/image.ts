import {
    TOP_URL,
} from '../module/env/constant';
import {
    encodeCFURIComponent,
    removeRightClick,
} from '../module/main';
import {
    addEventListener,
    createElement,
    addClass,
    openWindow,
    setCookie,
    appendChild,
    getTitle,
    setDataAttribute,
    prependChild,
    getById,
} from '../module/dom';
import type { ImageEPInfo } from '../module/type/BangumiInfo';
import type { LocalImageParam } from '../module/type/LocalImageParam';
import type { LazyloadImportPromise } from './get_import_promises';
import { show as showMessage } from '../module/message';
import { moduleImportError } from '../module/message/template/param';

export default function (
    epInfo: ImageEPInfo,
    baseURL: string,
    lazyloadImportPromise: LazyloadImportPromise
) {
    const contentContainer = getById('content');
    const mediaHolder = getById('media-holder');

    if (epInfo.gallery_title != '') {
        const title = createElement('p');
        addClass(title, 'sub-title');
        addClass(title, 'center-align');
        title.innerHTML = epInfo.gallery_title;
        prependChild(contentContainer, title);
    }

    const files = epInfo.files;

    files.forEach(function (file, index) {
        if (file.tag != '') {
            const subtitle = createElement('p');
            addClass(subtitle, 'sub-title');
            subtitle.innerHTML = file.tag;
            appendChild(mediaHolder, subtitle);
        }

        const imageNode = createElement('div');
        const overlay = createElement('div');

        addClass(overlay, 'overlay');
        appendChild(imageNode, overlay);

        addClass(imageNode, 'lazyload');
        setDataAttribute(imageNode, 'lazyload-delay', '250');
        setDataAttribute(imageNode, 'src', baseURL + encodeCFURIComponent(file.file_name));
        setDataAttribute(imageNode, 'alt', file.file_name);
        setDataAttribute(imageNode, 'xhr-param', index.toString());
        setDataAttribute(imageNode, 'media-session-credential', epInfo.media_session_credential);
        addEventListener(imageNode, 'click', function () {
            const param: LocalImageParam = {
                baseURL: baseURL,
                fileName: file.file_name,
                xhrParam: index.toString(),
                title: getTitle(),
                mediaSessionCredential: epInfo.media_session_credential
            };
            setCookie('local-image-param', JSON.stringify(param), 10);
            openWindow(TOP_URL + '/image');
        });
        removeRightClick(imageNode);
        appendChild(mediaHolder, imageNode);
    });

    lazyloadImportPromise.then((lazyloadInitialize) => {
        lazyloadInitialize();
    }).catch((e) => {
        showMessage(moduleImportError(e));
    });
}