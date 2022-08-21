import {
    DEVELOPMENT,
    TOP_URL,
    CDN_URL,
    DOMAIN,
} from '../module/env/constant';
import {
    navListeners,
    sendServerRequest,
    changeColor,
    getURLParam,
    encodeCFURIComponent,
} from '../module/main';
import {
    w,
    addEventListener,
    redirect,
    getById,
    getBody,
    removeClass,
    setTitle,
    createElement,
    addClass,
    remove,
    containsClass,
    appendChild,
} from '../module/DOM';
import { show as showMessage } from '../module/message';
import { moduleImportError } from '../module/message/template/param';
import { invalidResponse } from '../module/message/template/param/server';
import type { BangumiInfo } from '../module/type';
import { updateURLParam, getLogoutParam, parseCharacters, getContentBoxHeight } from './helper';

const showMoreButtonClippedText = 'すべてを見る <span class="symbol">&#xE972;</span>';
const showMoreButtonExpandedText = '非表示にする <span class="symbol">&#xE971;</span>';
var EPSelectorHeight: number;

var seriesID: string;
var epIndex: number;

export default function (
    response: BangumiInfo.BangumiInfo,
    _seriesID: string,
    _epIndex: number,
    videoImportPromise: Promise<typeof import(
        /* webpackExports: ["default"] */
        './video'
    )>,
    audioImportPromise: Promise<typeof import(
        /* webpackExports: ["default"] */
        './audio'
    )>,
    imageImportPromise: Promise<typeof import(
        /* webpackExports: ["default"] */
        './image'
    )>
) {
    seriesID = _seriesID;
    epIndex = _epIndex;

    navListeners();
    removeClass(getBody(), "hidden");

    const contentContainer = getById('content');;
    const debug = DEVELOPMENT || getURLParam('debug') === '1';
    
    let epInfo = response.ep_info;

    let titleElem = getById('title');
    let title = response.title;
    let titleOverride = response.title_override;
    if (titleOverride !== undefined) {
        titleElem.innerHTML = titleOverride;
        setTitle(parseCharacters(titleOverride) + ' | ' + DOMAIN);
    } else {
        titleElem.innerHTML = title;
        setTitle(parseCharacters(title) + '[' + response.series_ep[epIndex] + '] | ' + DOMAIN);
    }

    if (debug) {
        let onScreenConsole = createElement('textarea') as HTMLTextAreaElement;
        onScreenConsole.id = 'on-screen-console';
        onScreenConsole.readOnly = true;
        onScreenConsole.rows = 20;
        appendChild(getById('main'), onScreenConsole);
    }

    updateEPSelector(response.series_ep);
    updateSeasonSelector(response.seasons);

    let ageRestricted = epInfo.age_restricted;

    if (ageRestricted) {
        var warningParent = getById('warning');
        var warningTitle = getById('warning-title');
        var warningBody = getById('warning-body');
        changeColor(warningTitle, 'red');
        if (ageRestricted.toLowerCase() == 'r15+') {
            warningTitle.innerHTML = '「R15+指定」<br>年齢認証';
        } else if (ageRestricted.toLowerCase() == 'r18+') {
            warningTitle.innerHTML = '「R18+指定」<br>年齢認証';
        } else {
            warningTitle.innerHTML = '年齢認証';
        }
        warningBody.innerHTML = 'ここから先は年齢制限のかかっている作品を取り扱うページとなります。表示しますか？';

        var warningButtonGroup = getById('warning-button-group');
        var warningButtonYes = createElement('button');
        var warningButtonNo = createElement('button');
        warningButtonYes.innerHTML = 'はい';
        warningButtonNo.innerHTML = 'いいえ';
        addClass(warningButtonYes, 'button');
        addClass(warningButtonNo, 'button');
        appendChild(warningButtonGroup, warningButtonYes);
        appendChild(warningButtonGroup, warningButtonNo);
        addEventListener(warningButtonYes, 'click', function () {
            addClass(warningParent, 'hidden');
            removeClass(contentContainer, 'hidden');
        });
        addEventListener(warningButtonNo, 'click', function () {
            redirect(TOP_URL);
        });

        addClass(contentContainer, 'hidden');
        removeClass(warningParent, 'hidden');
    }

    /////////////////////////////////////////////device_authenticate/////////////////////////////////////////////
    setInterval(function () {
        sendServerRequest('device_authenticate.php', {
            callback: function (authResult: string) {
                if (authResult != 'APPROVED') {
                    showMessage(invalidResponse);
                }
            },
            content: "token=" + epInfo.authentication_token,
            logoutParam: getLogoutParam(seriesID, epIndex)
        });
    }, 60 * 1000);

    /////////////////////////////////////////////Add Media/////////////////////////////////////////////
    let type = epInfo.type;
    let seriesOverride = epInfo.series_override;
    let baseURL = CDN_URL + '/' + (seriesOverride === undefined ? seriesID : seriesOverride) + '/' + encodeCFURIComponent(epInfo.dir) + '/';

    let mediaHolder = getById('media-holder');

    if (type === 'video') {
        videoImportPromise.then(({ default: module }) => {
            module(seriesID, epIndex, epInfo as BangumiInfo.VideoEPInfo, baseURL, mediaHolder, contentContainer, debug);
        }).catch((e) => {
            showMessage(moduleImportError(e));
        });
    } else {
        if (type === 'audio') {
            audioImportPromise.then(({ default: module }) => {
                module(seriesID, epIndex, epInfo as BangumiInfo.AudioEPInfo, baseURL, mediaHolder, contentContainer, debug);
            }).catch((e) => {
                showMessage(moduleImportError(e));
            });
        } else {
            imageImportPromise.then(({ default: module }) => {
                module(epInfo as BangumiInfo.ImageEPInfo, baseURL, mediaHolder);
            }).catch((e) => {
                showMessage(moduleImportError(e));
            });
        }
        updateURLParam(seriesID, epIndex, 0);
    }
}

function updateEPSelector(seriesEP: BangumiInfo.SeriesEP) {
    var epButtonWrapper = createElement('div');
    epButtonWrapper.id = 'ep-button-wrapper';

    seriesEP.forEach(function (value, index) {
        let epButton = createElement('div');
        let epText = createElement('p');

        epText.innerHTML = value;

        if (epIndex == index) {
            addClass(epButton, 'current-ep');
        }

        let targetEP = index + 1;
        appendChild(epButton, epText);
        addEventListener(epButton, 'click', function () { goToEP(seriesID, targetEP); });

        appendChild(epButtonWrapper, epButton);
    });

    let epSelector = getById('ep-selector');
    appendChild(epSelector, epButtonWrapper);

    EPSelectorHeight = getContentBoxHeight(epButtonWrapper) + 10; //Add some extra pixels to compensate for slight variation and error.
    var showMoreButton = createElement('p');
    showMoreButton.id = 'show-more-button';
    addClass(showMoreButton, 'hidden');
    appendChild(epSelector, showMoreButton);
    addEventListener(showMoreButton, 'click', toggleEPSelector);
    styleEPSelector();

    addEventListener(w, 'resize', function () {
        var currentMaxHeight = epButtonWrapper.style.maxHeight;
        epButtonWrapper.style.maxHeight = ''; //Resetting max-height can mitigate a bug in IE browser where the scrollHeight attribute is not accurate.
        EPSelectorHeight = getContentBoxHeight(epButtonWrapper) + 10;
        epButtonWrapper.style.maxHeight = currentMaxHeight;
        styleEPSelector();
    });
}

function updateSeasonSelector(seasons: BangumiInfo.Seasons) {
    var seasonButtonWrapper = createElement('div');
    var seasonSelector = getById('season-selector');
    seasonButtonWrapper.id = 'season-button-wrapper';

    if (seasons.length != 0) {
        for (let season of seasons) {
            let seasonButton = createElement('div');
            let seasonText = createElement('p');

            if (season.id != seriesID) {
                seasonText.innerHTML = season.season_name;
                appendChild(seasonButton, seasonText);
                let targetSeries = season.id;
                addEventListener(seasonButton, 'click', function () { goToEP(targetSeries, 1); });
            } else {
                seasonText.innerHTML = season.season_name;
                appendChild(seasonButton, seasonText);
                addClass(seasonButton, 'current-season');
            }
            appendChild(seasonButtonWrapper, seasonButton);
        }
        appendChild(seasonSelector, seasonButtonWrapper);
    } else {
        remove(seasonSelector);
    }
}

function goToEP(dest_series: string, dest_ep: number) {
    var url: string;
    if (DEVELOPMENT) {
        url = 'bangumi.html' + '?series=' + dest_series + (dest_ep == 1 ? '' : ('&ep=' + dest_ep));
    } else {
        url = TOP_URL + '/bangumi/' + dest_series + (dest_ep == 1 ? '' : ('?ep=' + dest_ep));
    }
    redirect(url);
}

function styleEPSelector() {
    if (EPSelectorHeight / w.innerHeight > 0.50) {
        foldEPSelector();
    } else {
        unfoldEPSelector();
    }
}

function foldEPSelector() {
    var showMoreButton = getById('show-more-button');
    var epButtonWrapper = getById('ep-button-wrapper');

    if (!containsClass(showMoreButton, 'hidden')) {
        if (containsClass(epButtonWrapper, 'expanded')) {
            epButtonWrapper.style.maxHeight = EPSelectorHeight + "px";
        }
        return;
    }
    showMoreButton.innerHTML = showMoreButtonClippedText;
    epButtonWrapper.style.maxHeight = "50vh";
    removeClass(epButtonWrapper, 'expanded');
    removeClass(showMoreButton, 'hidden');
}

function unfoldEPSelector() {
    var showMoreButton = getById('show-more-button');
    var epButtonWrapper = getById('ep-button-wrapper');
    if (containsClass(showMoreButton, 'hidden')) {
        return;
    }
    epButtonWrapper.style.maxHeight = "";
    removeClass(epButtonWrapper, 'expanded');
    addClass(showMoreButton, 'hidden');
}

function toggleEPSelector() {
    var showMoreButton = getById('show-more-button');
    var epButtonWrapper = getById('ep-button-wrapper');
    const CLIPPED = !containsClass(epButtonWrapper, 'expanded');
    showMoreButton.innerHTML = CLIPPED ? showMoreButtonExpandedText : showMoreButtonClippedText;
    if (CLIPPED) {
        epButtonWrapper.style.maxHeight = EPSelectorHeight + "px";
        addClass(epButtonWrapper, 'expanded');
    } else {
        epButtonWrapper.style.maxHeight = "50vh";
        removeClass(epButtonWrapper, 'expanded');
    }
}