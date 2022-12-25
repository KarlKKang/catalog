import {
    DEVELOPMENT,
    TOP_URL,
} from '../module/env/constant';
import {
    encodeCFURIComponent,
    removeRightClick,
} from '../module/main';
import {
    addEventListener,
    redirect,
    createElement,
    addClass,
    openWindow,
    setCookie,
    appendChild,
    getTitle,
    setDataAttribute,
    prependChild,
    getById,
} from '../module/DOM';
import type { ImageEPInfo } from '../module/type/BangumiInfo';
import type { LocalImageParam } from '../module/type/LocalImageParam';
import type { LazyloadImportPromise } from './get_import_promises';

export default function (
    epInfo: ImageEPInfo,
    baseURL: string,
    mediaHolder: HTMLElement,
    lazyloadImportPromise: LazyloadImportPromise
) {
    const contentContainer = getById('content');

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
        setDataAttribute(imageNode, 'crossorigin', 'use-credentials');
        setDataAttribute(imageNode, 'src', baseURL + encodeCFURIComponent(file.file_name));
        setDataAttribute(imageNode, 'alt', file.file_name);
        setDataAttribute(imageNode, 'xhr-param', index.toString());
        setDataAttribute(imageNode, 'authentication-token', epInfo.authentication_token);
        addEventListener(imageNode, 'click', function () {
            const param: LocalImageParam = {
                baseURL: baseURL,
                fileName: file.file_name,
                xhrParam: index.toString(),
                title: getTitle(),
                authenticationToken: epInfo.authentication_token
            };
            setCookie('local-image-param', JSON.stringify(param), 10);
            if (DEVELOPMENT) {
                redirect('image.html');
            } else {
                openWindow(TOP_URL + '/image');
            }
        });
        removeRightClick(imageNode);
        appendChild(mediaHolder, imageNode);
    });

    lazyloadImportPromise.then((lazyloadInitialize) => {
        lazyloadInitialize();
    });
}