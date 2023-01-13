import {
    DEVELOPMENT,
    TOP_URL,
    CDN_URL,
    DOMAIN,
} from '../module/env/constant';
import {
    navListeners,
    sendServerRequest,
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
    insertBefore,
    showElement,
    hideElement,
    isHidden,
} from '../module/DOM';
import { show as showMessage } from '../module/message';
import { moduleImportError } from '../module/message/template/param';
import { invalidResponse } from '../module/message/template/param/server';
import { updateURLParam, getLogoutParam, parseCharacters, getContentBoxHeight, createMessageElem } from './helper';
import type * as BangumiInfo from '../module/type/BangumiInfo';
import type { VideoImportPromise, AudioImportPromise, ImageImportPromise, LazyloadImportPromise, NativePlayerImportPromise, HlsPlayerImportPromise, VideojsPlayerImportPromise, DashjsPlayerImportPromise } from './get_import_promises';
import type { default as videoType } from './video';
import type { default as audioType } from './audio';
import type { default as imageType } from './image';

const showMoreButtonClippedText = 'すべてを見る <span class="symbol">&#xE972;</span>';
const showMoreButtonExpandedText = '非表示にする <span class="symbol">&#xE971;</span>';
let EPSelectorHeight: number;

let seriesID: string;
let epIndex: number;

export default async function (
    response: BangumiInfo.BangumiInfo,
    _seriesID: string,
    _epIndex: number,
    videoImportPromise: VideoImportPromise,
    audioImportPromise: AudioImportPromise,
    imageImportPromise: ImageImportPromise,
    nativePlayerImportPromise: NativePlayerImportPromise,
    hlsPlayerImportPromise: HlsPlayerImportPromise,
    videojsPlayerImportPromise: VideojsPlayerImportPromise,
    dashjsPlayerImportPromise: DashjsPlayerImportPromise,
    lazyloadImportPromise: LazyloadImportPromise
) {
    seriesID = _seriesID;
    epIndex = _epIndex;

    navListeners();
    showElement(getBody());

    const contentContainer = getById('content');
    const debug = DEVELOPMENT || getURLParam('debug') === '1';
    const av1Override = getURLParam('av1') === '1';
    const startTimeText = getURLParam('timestamp');
    let startTime: number | null = null;
    if (startTimeText !== null) {
        startTime = parseFloat(startTimeText);
        if (isNaN(startTime)) {
            startTime = null;
        }
    }
    const play = getURLParam('play') === '1';

    const epInfo = response.ep_info;

    const titleElem = getById('title');
    const title = response.title;
    const titleOverride = response.title_override;
    if (titleOverride !== undefined) {
        titleElem.innerHTML = titleOverride;
        setTitle(parseCharacters(titleOverride) + ' | ' + DOMAIN);
    } else {
        titleElem.innerHTML = title;
        setTitle(parseCharacters(title) + '[' + response.series_ep[epIndex] + '] | ' + DOMAIN);
    }

    if (debug) {
        const onScreenConsole = createElement('textarea') as HTMLTextAreaElement;
        onScreenConsole.id = 'on-screen-console';
        onScreenConsole.readOnly = true;
        onScreenConsole.rows = 20;
        appendChild(getById('main'), onScreenConsole);
    }

    updateEPSelector(response.series_ep);
    updateSeasonSelector(response.seasons);

    const ageRestricted = epInfo.age_restricted;

    if (ageRestricted) {
        let warningTitle = '年齢認証';
        if (ageRestricted.toLowerCase() == 'r15+') {
            warningTitle = '「R15+指定」<br>年齢認証';
        } else if (ageRestricted.toLowerCase() == 'r18+') {
            warningTitle = '「R18+指定」<br>年齢認証';
        }
        const warningElem = createMessageElem(warningTitle, 'ここから先は年齢制限のかかっている作品を取り扱うページとなります。表示しますか？', 'red');
        warningElem.id = 'warning';

        const warningButtonGroup = createElement('div');
        warningButtonGroup.id = 'warning-button-group';
        const warningButtonYes = createElement('button');
        const warningButtonNo = createElement('button');
        warningButtonYes.innerHTML = 'はい';
        warningButtonNo.innerHTML = 'いいえ';
        addClass(warningButtonYes, 'button');
        addClass(warningButtonNo, 'button');
        appendChild(warningButtonGroup, warningButtonYes);
        appendChild(warningButtonGroup, warningButtonNo);
        addEventListener(warningButtonYes, 'click', function () {
            hideElement(warningElem);
            showElement(contentContainer);
        });
        addEventListener(warningButtonNo, 'click', function () {
            redirect(TOP_URL);
        });
        appendChild(warningElem, warningButtonGroup);

        hideElement(contentContainer);
        insertBefore(warningElem, contentContainer);
    }

    /////////////////////////////////////////////device_authenticate/////////////////////////////////////////////
    setInterval(function () {
        sendServerRequest('device_authenticate.php', {
            callback: function (authResult: string) {
                if (authResult != 'APPROVED') {
                    showMessage(invalidResponse);
                }
            },
            content: 'token=' + epInfo.authentication_token,
            logoutParam: getLogoutParam(seriesID, epIndex)
        });
    }, 30 * 1000);

    /////////////////////////////////////////////Add Media/////////////////////////////////////////////
    const type = epInfo.type;
    const seriesOverride = epInfo.series_override;
    const baseURL = CDN_URL + '/' + (seriesOverride === undefined ? seriesID : seriesOverride) + '/' + encodeCFURIComponent(epInfo.dir) + '/';

    const mediaHolder = getById('media-holder');

    if (type === 'video') {
        let video: typeof videoType;
        try {
            video = (await videoImportPromise).default;
        } catch (e) {
            showMessage(moduleImportError(e));
            throw e;
        }
        video(seriesID, epIndex, epInfo as BangumiInfo.VideoEPInfo, baseURL, mediaHolder, nativePlayerImportPromise, hlsPlayerImportPromise, dashjsPlayerImportPromise, debug, av1Override, startTime, play);
    } else {
        if (type === 'audio') {
            let audio: typeof audioType;
            try {
                audio = (await audioImportPromise).default;
            } catch (e) {
                showMessage(moduleImportError(e));
                throw e;
            }
            audio(seriesID, epIndex, epInfo as BangumiInfo.AudioEPInfo, baseURL, mediaHolder, nativePlayerImportPromise, hlsPlayerImportPromise, videojsPlayerImportPromise, debug);
        } else {
            let image: typeof imageType;
            try {
                image = (await imageImportPromise).default;
            } catch (e) {
                showMessage(moduleImportError(e));
                throw e;
            }
            image(epInfo as BangumiInfo.ImageEPInfo, baseURL, mediaHolder, lazyloadImportPromise);
        }
        updateURLParam(seriesID, epIndex, 0);
    }
}

function updateEPSelector(seriesEP: BangumiInfo.SeriesEP) {
    const epButtonWrapper = createElement('div');
    epButtonWrapper.id = 'ep-button-wrapper';

    seriesEP.forEach(function (value, index) {
        const epButton = createElement('div');
        const epText = createElement('p');

        epText.innerHTML = value;

        if (epIndex == index) {
            addClass(epButton, 'current-ep');
        }

        const targetEP = index + 1;
        appendChild(epButton, epText);
        addEventListener(epButton, 'click', function () { goToEP(seriesID, targetEP); });

        appendChild(epButtonWrapper, epButton);
    });

    const epSelector = getById('ep-selector');
    appendChild(epSelector, epButtonWrapper);

    EPSelectorHeight = getContentBoxHeight(epButtonWrapper) + 10; //Add some extra pixels to compensate for slight variation and error.
    const showMoreButton = createElement('p');
    showMoreButton.id = 'show-more-button';
    hideElement(showMoreButton);
    appendChild(epSelector, showMoreButton);
    addEventListener(showMoreButton, 'click', toggleEPSelector);
    styleEPSelector();

    addEventListener(w, 'resize', function () {
        const currentMaxHeight = epButtonWrapper.style.maxHeight;
        epButtonWrapper.style.maxHeight = ''; //Resetting max-height can mitigate a bug in legacy browsers (Firefox) where the scrollHeight attribute is not accurate. This also remove the transition for height when resizing.
        EPSelectorHeight = getContentBoxHeight(epButtonWrapper) + 10;
        epButtonWrapper.style.maxHeight = currentMaxHeight;
        styleEPSelector();
    });
}

function updateSeasonSelector(seasons: BangumiInfo.Seasons) {
    const seasonButtonWrapper = createElement('div');
    const seasonSelector = getById('season-selector');
    seasonButtonWrapper.id = 'season-button-wrapper';

    if (seasons.length != 0) {
        for (const season of seasons) {
            const seasonButton = createElement('div');
            const seasonText = createElement('p');

            if (season.id != seriesID) {
                seasonText.innerHTML = season.season_name;
                appendChild(seasonButton, seasonText);
                const targetSeries = season.id;
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
    let url: string;
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
    const showMoreButton = getById('show-more-button');
    const epButtonWrapper = getById('ep-button-wrapper');

    if (!isHidden(showMoreButton)) {
        if (containsClass(epButtonWrapper, 'expanded')) {
            epButtonWrapper.style.maxHeight = EPSelectorHeight + 'px';
        }
        return;
    }
    showMoreButton.innerHTML = showMoreButtonClippedText;
    epButtonWrapper.style.maxHeight = '50vh';
    removeClass(epButtonWrapper, 'expanded');
    showElement(showMoreButton);
}

function unfoldEPSelector() {
    const showMoreButton = getById('show-more-button');
    const epButtonWrapper = getById('ep-button-wrapper');
    if (isHidden(showMoreButton)) {
        return;
    }
    epButtonWrapper.style.maxHeight = '';
    removeClass(epButtonWrapper, 'expanded');
    hideElement(showMoreButton);
}

function toggleEPSelector() {
    const showMoreButton = getById('show-more-button');
    const epButtonWrapper = getById('ep-button-wrapper');
    const CLIPPED = !containsClass(epButtonWrapper, 'expanded');
    showMoreButton.innerHTML = CLIPPED ? showMoreButtonExpandedText : showMoreButtonClippedText;
    if (CLIPPED) {
        epButtonWrapper.style.maxHeight = EPSelectorHeight + 'px';
        addClass(epButtonWrapper, 'expanded');
    } else {
        epButtonWrapper.style.maxHeight = '50vh';
        removeClass(epButtonWrapper, 'expanded');
    }
}