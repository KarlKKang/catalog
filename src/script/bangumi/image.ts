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
} from '../module/DOM';
import { default as importLazyload } from '../module/lazyload';
import type { BangumiInfo, LocalImageParam } from '../module/type';

var lazyloadImportPromise = importLazyload();

export default function (
    epInfo: BangumiInfo.ImageEPInfo,
    baseURL: string,
    mediaHolder: HTMLElement,
) {
    let files = epInfo.files;

    files.forEach(function (file, index) {
        if (file.tag != '') {
            let subtitle = createElement('p');
            addClass(subtitle, 'sub-title');
            subtitle.innerHTML = file.tag;
            appendChild(mediaHolder, subtitle);
        }

        let imageNode = createElement('div');
        let overlay = createElement('div');

        addClass(overlay, 'overlay');
        appendChild(imageNode, overlay);

        addClass(imageNode, 'lazyload');
        imageNode.dataset.crossorigin = 'use-credentials';
        imageNode.dataset.src = baseURL + encodeCFURIComponent(file.file_name);
        imageNode.dataset.alt = file.file_name;
        imageNode.dataset.xhrParam = index.toString();
        imageNode.dataset.authenticationToken = epInfo.authentication_token;
        addEventListener(imageNode, 'click', function () {
            let param: LocalImageParam.LocalImageParam = {
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