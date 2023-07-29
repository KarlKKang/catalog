import {
    DEVELOPMENT,
    TOP_URL,
    CDN_URL,
} from '../module/env/constant';
import {
    addNavBar,
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
    appendChild,
    insertBefore,
    showElement,
    hideElement,
    getTitle,
    createDivElement,
    createButtonElement,
    createParagraphElement,
    insertAfter,
} from '../module/dom';
import { show as showMessage } from '../module/message';
import { moduleImportError } from '../module/message/template/param';
import { invalidResponse } from '../module/message/template/param/server';
import { updateURLParam, getLogoutParam, parseCharacters, getContentBoxHeight, createMessageElem } from './helper';
import type * as BangumiInfo from '../module/type/BangumiInfo';
import type { VideoImportPromise, AudioImportPromise, ImageImportPromise, LazyloadImportPromise, NativePlayerImportPromise, HlsPlayerImportPromise, VideojsPlayerImportPromise } from './get_import_promises';
import type { default as videoType } from './video';
import type { default as audioType } from './audio';
import type { default as imageType } from './image';

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
    lazyloadImportPromise: LazyloadImportPromise
) {
    seriesID = _seriesID;
    epIndex = _epIndex;

    addNavBar();
    showElement(getBody());

    const contentContainer = getById('content');
    const debug = DEVELOPMENT || getURLParam('debug') === '1';
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
        setTitle(parseCharacters(titleOverride) + ' | ' + getTitle());
    } else {
        titleElem.innerHTML = title;
        setTitle(parseCharacters(title) + '[' + response.series_ep[epIndex] + '] | ' + getTitle());
    }

    if (debug) {
        const onScreenConsole = createElement('textarea') as HTMLTextAreaElement;
        onScreenConsole.id = 'on-screen-console';
        onScreenConsole.readOnly = true;
        onScreenConsole.rows = 20;
        insertAfter(onScreenConsole, contentContainer);
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

        const warningButtonGroup = createDivElement();
        warningButtonGroup.id = 'warning-button-group';
        const warningButtonYes = createButtonElement();
        const warningButtonNo = createButtonElement();
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

    /////////////////////////////////////////////authenticate media session/////////////////////////////////////////////
    setInterval(function () {
        sendServerRequest('authenticate_media_session.php', {
            callback: function (response: string) {
                if (response != 'APPROVED') {
                    showMessage(invalidResponse);
                }
            },
            content: epInfo.media_session_credential,
            logoutParam: getLogoutParam(seriesID, epIndex),
            connectionErrorRetry: 5
        });
    }, 30 * 1000);

    /////////////////////////////////////////////Add Media/////////////////////////////////////////////
    const type = epInfo.type;
    const seriesOverride = epInfo.series_override;
    const baseURL = CDN_URL + '/' + (seriesOverride === undefined ? seriesID : seriesOverride) + '/' + encodeCFURIComponent(epInfo.dir) + '/';

    if (type === 'video') {
        let video: typeof videoType;
        try {
            video = (await videoImportPromise).default;
        } catch (e) {
            showMessage(moduleImportError(e));
            throw e;
        }
        video(seriesID, epIndex, epInfo as BangumiInfo.VideoEPInfo, baseURL, nativePlayerImportPromise, hlsPlayerImportPromise, debug, startTime, play);
    } else {
        if (type === 'audio') {
            let audio: typeof audioType;
            try {
                audio = (await audioImportPromise).default;
            } catch (e) {
                showMessage(moduleImportError(e));
                throw e;
            }
            audio(seriesID, epIndex, epInfo as BangumiInfo.AudioEPInfo, baseURL, nativePlayerImportPromise, hlsPlayerImportPromise, videojsPlayerImportPromise, debug);
        } else {
            let image: typeof imageType;
            try {
                image = (await imageImportPromise).default;
            } catch (e) {
                showMessage(moduleImportError(e));
                throw e;
            }
            image(epInfo as BangumiInfo.ImageEPInfo, baseURL, lazyloadImportPromise);
        }
        updateURLParam(seriesID, epIndex, 0);
    }
}

function updateEPSelector(seriesEP: BangumiInfo.SeriesEP) {
    const epButtonWrapper = createDivElement();
    epButtonWrapper.id = 'ep-button-wrapper';
    const epSelector = getById('ep-selector');
    appendChild(epSelector, epButtonWrapper);
    let minHeight = Number.POSITIVE_INFINITY;

    seriesEP.forEach(function (value, index) {
        const epButton = createDivElement();
        const epText = createParagraphElement();

        epText.innerHTML = value;

        if (epIndex == index) {
            addClass(epButton, 'current-ep');
        }

        const targetEP = index + 1;
        appendChild(epButton, epText);
        addEventListener(epButton, 'click', function () { goToEP(seriesID, targetEP); });
        appendChild(epButtonWrapper, epButton);

        const height = getContentBoxHeight(epButtonWrapper);
        if (height < minHeight) {
            minHeight = height;
        }
    });

    const showMoreButton = createParagraphElement();
    showMoreButton.id = 'show-more-button';
    addClass(showMoreButton, 'invisible');
    addClass(showMoreButton, 'transparent');
    appendChild(epSelector, showMoreButton);

    const showMoreButtonFoldedText = 'すべてを見る <span class="symbol">&#xE972;</span>';
    let currentToggleTimeout: NodeJS.Timeout | null = null;
    let currentToggleAnimationFrame: number | null = null;
    let isExpanded = false;

    const toggleEPSelector = function () {
        if (isExpanded) {
            currentToggleTimeout = null;
            let animationFrame = w.requestAnimationFrame(function () {
                if (currentToggleAnimationFrame === animationFrame) {
                    epButtonWrapper.style.maxHeight = getContentBoxHeight(epButtonWrapper) + 'px';
                    animationFrame = w.requestAnimationFrame(function () {
                        if (currentToggleAnimationFrame === animationFrame) {
                            isExpanded = false;
                            showMoreButton.innerHTML = showMoreButtonFoldedText;
                            epButtonWrapper.style.maxHeight = '30vh';
                            removeClass(epButtonWrapper, 'expanded');
                        }
                    });
                    currentToggleAnimationFrame = animationFrame;
                }
            });
            currentToggleAnimationFrame = animationFrame;
        } else {
            currentToggleAnimationFrame = null;
            isExpanded = true;
            showMoreButton.innerHTML = '非表示にする <span class="symbol">&#xE971;</span>';
            epButtonWrapper.style.maxHeight = getContentBoxHeight(epButtonWrapper) + 'px';
            addClass(epButtonWrapper, 'expanded');
            const timeout = setTimeout(function () {
                if (currentToggleTimeout === timeout) {
                    epButtonWrapper.style.removeProperty('max-height');
                }
            }, 400);
            currentToggleTimeout = timeout;
        }
    };
    addEventListener(showMoreButton, 'click', toggleEPSelector);

    let currentStylingTimeout: NodeJS.Timeout | null = null;
    let currentStylingAnimationFrame: number | null = null;
    let isOversized = false;
    const styleEPSelector = function () {
        epButtonWrapper.style.removeProperty('min-height'); // Need to remove min-height first to calculate the height accurately.
        const height = getContentBoxHeight(epButtonWrapper);
        const reachedThreshold = height > minHeight * 1.8;
        if (reachedThreshold) {
            epButtonWrapper.style.minHeight = minHeight * 1.8 + 'px';
        } else {
            epButtonWrapper.style.removeProperty('min-height');
        }

        if (height / w.innerHeight > 0.40 && reachedThreshold) {
            if (isOversized) {
                return;
            }
            currentStylingTimeout = null;
            currentToggleAnimationFrame = null;
            currentToggleTimeout = null;
            isOversized = true;
            let animationFrame = w.requestAnimationFrame(function () {
                if (currentStylingAnimationFrame === animationFrame) {
                    epButtonWrapper.style.maxHeight = getContentBoxHeight(epButtonWrapper) + 'px';
                    animationFrame = w.requestAnimationFrame(function () {
                        if (currentStylingAnimationFrame === animationFrame) {
                            isExpanded = false;
                            showMoreButton.innerHTML = showMoreButtonFoldedText;
                            epButtonWrapper.style.maxHeight = '30vh';
                            removeClass(epButtonWrapper, 'expanded');
                            removeClass(showMoreButton, 'invisible');
                            removeClass(showMoreButton, 'transparent');
                        }
                    });
                    currentStylingAnimationFrame = animationFrame;
                }
            });
            currentStylingAnimationFrame = animationFrame;
        } else {
            if (!isOversized) {
                return;
            }
            currentStylingAnimationFrame = null;
            currentToggleAnimationFrame = null;
            currentToggleTimeout = null;
            isOversized = false;
            epButtonWrapper.style.maxHeight = getContentBoxHeight(epButtonWrapper) + 'px';
            addClass(showMoreButton, 'transparent');
            removeClass(epButtonWrapper, 'expanded');
            const timeout = setTimeout(function () {
                if (currentStylingTimeout === timeout) {
                    epButtonWrapper.style.removeProperty('max-height');
                    addClass(showMoreButton, 'invisible');
                }
            }, 400);
            currentStylingTimeout = timeout;
        }
    };

    styleEPSelector();
    addEventListener(w, 'resize', function () {
        styleEPSelector();
    });
}

function updateSeasonSelector(seasons: BangumiInfo.Seasons) {
    const seasonButtonWrapper = createDivElement();
    const seasonSelector = getById('season-selector');
    seasonButtonWrapper.id = 'season-button-wrapper';

    if (seasons.length != 0) {
        for (const season of seasons) {
            const seasonButton = createDivElement();
            const seasonText = createParagraphElement();

            if (season.id != seriesID) {
                seasonText.innerHTML = season.season_name;
                const targetSeries = season.id;
                addEventListener(seasonButton, 'click', function () { goToEP(targetSeries, 1); });
            } else {
                seasonText.innerHTML = season.season_name;
                addClass(seasonButton, 'current-season');
            }
            appendChild(seasonButton, seasonText);
            appendChild(seasonButtonWrapper, seasonButton);
        }
        appendChild(seasonSelector, seasonButtonWrapper);
    } else {
        remove(seasonSelector);
    }
}

function goToEP(dest_series: string, dest_ep: number) {
    const url = TOP_URL + '/bangumi/' + dest_series + (dest_ep == 1 ? '' : ('?ep=' + dest_ep));
    redirect(url);
}