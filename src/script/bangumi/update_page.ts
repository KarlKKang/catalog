import {
    TOP_URL,
    CDN_URL,
} from '../module/env/constant';
import {
    addNavBar,
    sendServerRequest,
    getURLParam,
} from '../module/common';
import {
    w,
    addEventListener,
    getById,
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
    appendText,
    createTextNode,
    createSpanElement,
    replaceChildren,
} from '../module/dom';
import { show as showMessage } from '../module/message';
import { moduleImportError } from '../module/message/template/param';
import { invalidResponse } from '../module/message/template/param/server';
import { updateURLParam, getLogoutParam, parseCharacters, getContentBoxHeight, createMessageElem } from './helper';
import type * as BangumiInfo from '../module/type/BangumiInfo';
import type { VideoImportPromise, AudioImportPromise, ImageImportPromise, LazyloadImportPromise, NativePlayerImportPromise, HlsPlayerImportPromise, VideojsPlayerImportPromise, ImageLoaderImportPromise } from './get_import_promises';
import { encodeCFURIComponent } from '../module/common/pure';
import { addInterval, addTimeout } from '../module/timer';
import type { RedirectFunc } from '../module/type/RedirectFunc';

let pageLoaded: boolean;
let redirect: RedirectFunc;

let seriesID: string;
let epIndex: number;

let currentPage: Awaited<VideoImportPromise> | Awaited<AudioImportPromise> | Awaited<ImageImportPromise> | null = null;

export default async function (
    _redirect: RedirectFunc,
    response: BangumiInfo.BangumiInfo,
    _seriesID: string,
    _epIndex: number,
    videoImportPromise: VideoImportPromise,
    audioImportPromise: AudioImportPromise,
    imageImportPromise: ImageImportPromise,
    nativePlayerImportPromise: NativePlayerImportPromise,
    hlsPlayerImportPromise: HlsPlayerImportPromise,
    videojsPlayerImportPromise: VideojsPlayerImportPromise,
    lazyloadImportPromise: LazyloadImportPromise,
    imageLoaderImportPromise: ImageLoaderImportPromise,
) {
    if (!pageLoaded) {
        return;
    }

    redirect = _redirect;
    seriesID = _seriesID;
    epIndex = _epIndex;

    addNavBar(redirect);

    const contentContainer = getById('content');
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
        appendText(titleElem, titleOverride);
        setTitle(parseCharacters(titleOverride) + ' | ' + getTitle());
    } else {
        appendText(titleElem, title);
        setTitle(parseCharacters(title) + '[' + response.series_ep[epIndex] + '] | ' + getTitle());
    }

    if (DEVELOPMENT) {
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
        appendText(warningButtonYes, 'はい');
        appendText(warningButtonNo, 'いいえ');
        addClass(warningButtonYes, 'button');
        addClass(warningButtonNo, 'button');
        appendChild(warningButtonGroup, warningButtonYes);
        appendChild(warningButtonGroup, warningButtonNo);
        addEventListener(warningButtonYes, 'click', () => {
            hideElement(warningElem);
            showElement(contentContainer);
        });
        addEventListener(warningButtonNo, 'click', () => {
            redirect(TOP_URL);
        });
        appendChild(warningElem, warningButtonGroup);

        hideElement(contentContainer);
        insertBefore(warningElem, contentContainer);
    }

    /////////////////////////////////////////////authenticate media session/////////////////////////////////////////////
    addInterval(() => {
        sendServerRequest(redirect, 'authenticate_media_session', {
            callback: function (response: string) {
                if (response != 'APPROVED') {
                    showMessage(redirect, invalidResponse);
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
        try {
            currentPage = await videoImportPromise;
        } catch (e) {
            showMessage(redirect, moduleImportError(e));
            throw e;
        }
        if (!pageLoaded) {
            return;
        }
        currentPage.reload();
        currentPage.default(redirect, seriesID, epIndex, epInfo as BangumiInfo.VideoEPInfo, baseURL, nativePlayerImportPromise, hlsPlayerImportPromise, startTime, play);
    } else {
        if (type === 'audio') {
            try {
                currentPage = await audioImportPromise;
            } catch (e) {
                showMessage(redirect, moduleImportError(e));
                throw e;
            }
            if (!pageLoaded) {
                return;
            }
            currentPage.reload();
            currentPage.default(redirect, seriesID, epIndex, epInfo as BangumiInfo.AudioEPInfo, baseURL, nativePlayerImportPromise, hlsPlayerImportPromise, videojsPlayerImportPromise);
        } else {
            try {
                currentPage = await imageImportPromise;
            } catch (e) {
                showMessage(redirect, moduleImportError(e));
                throw e;
            }
            if (!pageLoaded) {
                return;
            }
            currentPage.reload();
            currentPage.default(redirect, epInfo as BangumiInfo.ImageEPInfo, baseURL, lazyloadImportPromise, imageLoaderImportPromise);
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

    seriesEP.forEach((value, index) => {
        const epButton = createDivElement();
        const epText = createParagraphElement();
        appendText(epText, value);

        if (epIndex == index) {
            addClass(epButton, 'current-ep');
        }

        const targetEP = index + 1;
        appendChild(epButton, epText);
        addEventListener(epButton, 'click', () => { goToEP(seriesID, targetEP); });
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

    const showMoreButtonFoldedText = [createTextNode('すべてを見る '), createSpanElement()] as const;
    appendText(showMoreButtonFoldedText[1], '');
    addClass(showMoreButtonFoldedText[1], 'symbol');

    const showMoreButtonExpandedText = [createTextNode('非表示にする '), createSpanElement()] as const;
    appendText(showMoreButtonExpandedText[1], '');
    addClass(showMoreButtonExpandedText[1], 'symbol');

    let currentToggleTimeout: NodeJS.Timeout | null = null;
    let currentToggleAnimationFrame: number | null = null;
    let isExpanded = false;

    const toggleEPSelector = () => {
        if (isExpanded) {
            currentToggleTimeout = null;
            let animationFrame = w.requestAnimationFrame(() => {
                if (currentToggleAnimationFrame === animationFrame) {
                    epButtonWrapper.style.maxHeight = getContentBoxHeight(epButtonWrapper) + 'px';
                    animationFrame = w.requestAnimationFrame(() => {
                        if (currentToggleAnimationFrame === animationFrame) {
                            isExpanded = false;
                            replaceChildren(showMoreButton, ...showMoreButtonFoldedText);
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
            replaceChildren(showMoreButton, ...showMoreButtonExpandedText);
            epButtonWrapper.style.maxHeight = getContentBoxHeight(epButtonWrapper) + 'px';
            addClass(epButtonWrapper, 'expanded');
            const timeout = addTimeout(() => {
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
    const styleEPSelector = () => {
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
            let animationFrame = w.requestAnimationFrame(() => {
                if (currentStylingAnimationFrame === animationFrame) {
                    epButtonWrapper.style.maxHeight = getContentBoxHeight(epButtonWrapper) + 'px';
                    animationFrame = w.requestAnimationFrame(() => {
                        if (currentStylingAnimationFrame === animationFrame) {
                            isExpanded = false;
                            replaceChildren(showMoreButton, ...showMoreButtonFoldedText);
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
            const timeout = addTimeout(() => {
                if (currentStylingTimeout === timeout) {
                    epButtonWrapper.style.removeProperty('max-height');
                    addClass(showMoreButton, 'invisible');
                }
            }, 400);
            currentStylingTimeout = timeout;
        }
    };

    styleEPSelector();
    addEventListener(w, 'resize', styleEPSelector);
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
                appendText(seasonText, season.season_name);
                const targetSeries = season.id;
                addEventListener(seasonButton, 'click', () => { goToEP(targetSeries, 1); });
            } else {
                appendText(seasonText, season.season_name);
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

export function reload() {
    pageLoaded = true;
}

export function offload() {
    pageLoaded = false;
    currentPage?.offload();
}