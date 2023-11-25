import {
    TOP_URL,
    CDN_URL,
} from '../module/env/constant';
import {
    addNavBar,
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
import { updateURLParam, parseCharacters, getContentBoxHeight, createMessageElem } from './helper';
import type * as BangumiInfo from '../module/type/BangumiInfo';
import type { VideoImportPromise, AudioImportPromise, ImageImportPromise, LazyloadImportPromise, NativePlayerImportPromise, HlsPlayerImportPromise, VideojsPlayerImportPromise, ImageLoaderImportPromise } from './get_import_promises';
import { encodeCFURIComponent } from '../module/common/pure';
import { addTimeout } from '../module/timer';
import type { MediaSessionInfo } from '../module/type/MediaSessionInfo';
import { pgid, redirect } from '../module/global';

let seriesID: string;
let epIndex: number;

let currentPage: Awaited<VideoImportPromise> | Awaited<AudioImportPromise> | Awaited<ImageImportPromise> | null = null;

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
    lazyloadImportPromise: LazyloadImportPromise,
    imageLoaderImportPromise: ImageLoaderImportPromise,
    createMediaSessionPromise: Promise<MediaSessionInfo>,
) {
    seriesID = _seriesID;
    epIndex = _epIndex;

    addNavBar();

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

        const warningElem = createMessageElem(warningTitle, 'ここから先は年齢制限のかかっている作品を取り扱うページとなります。表示しますか？', 'red', warningButtonGroup);
        warningElem.id = 'warning';

        addEventListener(warningButtonYes, 'click', () => {
            hideElement(warningElem);
            showElement(contentContainer);
        });
        addEventListener(warningButtonNo, 'click', () => {
            redirect(TOP_URL);
        });

        hideElement(contentContainer);
        insertBefore(warningElem, contentContainer);
    }

    /////////////////////////////////////////////authenticate media session/////////////////////////////////////////////


    /////////////////////////////////////////////Add Media/////////////////////////////////////////////
    const type = epInfo.type;
    const seriesOverride = epInfo.series_override;
    const baseURL = CDN_URL + '/' + (seriesOverride === undefined ? seriesID : seriesOverride) + '/' + encodeCFURIComponent(epInfo.dir) + '/';

    const currentPgid = pgid;
    if (type === 'video') {
        try {
            currentPage = await videoImportPromise;
        } catch (e) {
            if (currentPgid === pgid) {
                showMessage(moduleImportError(e));
            }
            throw e;
        }
        if (currentPgid !== pgid) {
            return;
        }
        currentPage.default(seriesID, epIndex, epInfo as BangumiInfo.VideoEPInfo, baseURL, nativePlayerImportPromise, hlsPlayerImportPromise, createMediaSessionPromise, startTime, play);
    } else {
        if (type === 'audio') {
            try {
                currentPage = await audioImportPromise;
            } catch (e) {
                if (currentPgid === pgid) {
                    showMessage(moduleImportError(e));
                }
                throw e;
            }
            if (currentPgid !== pgid) {
                return;
            }
            currentPage.default(seriesID, epIndex, epInfo as BangumiInfo.AudioEPInfo, baseURL, nativePlayerImportPromise, hlsPlayerImportPromise, videojsPlayerImportPromise, createMediaSessionPromise);
        } else {
            try {
                currentPage = await imageImportPromise;
            } catch (e) {
                if (currentPgid === pgid) {
                    showMessage(moduleImportError(e));
                }
                throw e;
            }
            if (currentPgid !== pgid) {
                return;
            }
            currentPage.default(epInfo as BangumiInfo.ImageEPInfo, baseURL, lazyloadImportPromise, imageLoaderImportPromise, createMediaSessionPromise);
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

        if (index === 0) {
            minHeight = getContentBoxHeight(epButtonWrapper);
        }
    });

    const showMoreButton = createParagraphElement();
    showMoreButton.id = 'show-more-button';
    addClass(showMoreButton, 'invisible');
    addClass(showMoreButton, 'transparent');
    appendChild(epButtonWrapper, showMoreButton);

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
                            epButtonWrapper.style.removeProperty('padding-bottom');
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
            epButtonWrapper.style.paddingBottom = showMoreButton.scrollHeight + 'px';
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
                if (isExpanded) {
                    epButtonWrapper.style.paddingBottom = showMoreButton.scrollHeight + 'px';
                }
                return;
            }
            currentStylingTimeout = null;
            currentToggleAnimationFrame = null;
            currentToggleTimeout = null;
            isOversized = true;
            isExpanded = false;
            let animationFrame = w.requestAnimationFrame(() => {
                if (currentStylingAnimationFrame === animationFrame) {
                    epButtonWrapper.style.maxHeight = getContentBoxHeight(epButtonWrapper) + 'px'; // Use `getContentBoxHeight` to get the most recent height.
                    animationFrame = w.requestAnimationFrame(() => {
                        if (currentStylingAnimationFrame === animationFrame) {
                            replaceChildren(showMoreButton, ...showMoreButtonFoldedText);
                            epButtonWrapper.style.maxHeight = '30vh';
                            epButtonWrapper.style.removeProperty('padding-bottom');
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
            epButtonWrapper.style.maxHeight = height + 'px';
            addClass(showMoreButton, 'transparent');
            epButtonWrapper.style.removeProperty('padding-bottom');
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

export function offload() {
    currentPage?.offload();
}