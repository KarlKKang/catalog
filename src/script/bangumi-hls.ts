// JavaScript Document
import "core-js";
import {
    DEVELOPMENT,
	navListeners,
	TOP_URL,
	sendServerRequest,
	message,
	changeColor,
	getURLParam,
	getSeriesID,
	secToTimestamp,
	CDN_URL,
	concatenateSignedURL,
	encodeCFURIComponent,
    clearCookies,
    cssVarWrapper,
    removeRightClick,
    SERVER_URL,

    w,
    addEventListener,
    getHref,
    redirect,
    changeURL,
    getById,
    getBody,
    removeClass,
    setTitle,
    createElement,
    addClass,
    remove,
    insertBefore,
    getDescendantsByTagAt,
    getTitle,
    openWindow,
    setCookie,
    toggleClass,
    setClass,
    getDescendantsByTag,
    createTextNode,
    addEventsListener,
    containsClass,
    getComputedStyle,
    appendChild,

    type
} from './module/main';
import {default as importLazyload} from './module/lazyload';


var seriesID: string;
var epIndex: number;
var formatIndex: number;

var contentContainer: HTMLElement;
var mediaHolder: HTMLElement;

var playerImportPromise: Promise<typeof import(
    /* webpackExports: ["Hls", "videojs", "browser", "videojsMod"] */
    './module/player'
)>;
var lazyloadImportPromise: ReturnType<typeof importLazyload>;

var debug = DEVELOPMENT;

addEventListener(w, 'load', function(){
	cssVarWrapper();
	clearCookies();
	
	if (!getHref().startsWith(TOP_URL + '/bangumi') && !DEVELOPMENT) {
        redirect(TOP_URL, true);
		return;
	}

    
    // Parse parameters
    let seriesIDParam = getSeriesID();
    if (seriesIDParam === null) {
        redirect(TOP_URL, true);
        return;
    } else if (!/^[a-zA-Z0-9~_-]{8,}$/.test(seriesIDParam)) {
		redirect(TOP_URL, true);
        return;
    }
    seriesID = seriesIDParam;

    // Preload modules
    lazyloadImportPromise = importLazyload(); // Putting smaller (lazyload) promises before larger (player) promise attains better performance somehow.
    playerImportPromise = import(
        /* webpackExports: ["Hls", "videojs", "browser", "videojsMod"] */
        './module/player'
    );

    // Parse other parameters
    const epIndexParam = getURLParam ('ep');
    const newURL = DEVELOPMENT?('bangumi.html'+'?series='+seriesID):(TOP_URL+'/bangumi/'+seriesID);
    if (epIndexParam === null) {
        epIndex = 0;
    } else {
        epIndex = parseInt (epIndexParam);
        if (isNaN(epIndex) || epIndex<1) {
            changeURL(newURL, true);
            epIndex = 1;
        } else if (epIndex == 1) {
			changeURL(newURL, true);
		}
        epIndex--;
    }

    const formatIndexParam = getURLParam ('format');
	if (formatIndexParam === null) {
        formatIndex = 0;
    } else {
        formatIndex = parseInt (formatIndexParam);
        if (isNaN(formatIndex) || formatIndex<1) {
			updateURLParam('format', 1);
            formatIndex = 1;
        }
        formatIndex--;
    }

    const debugParam = getURLParam ('debug');
	if (debugParam === '1') {
        debug = true;
    } 

    contentContainer = getById('content');
    mediaHolder = getById('media-holder');

    //send requests
    sendServerRequest('get_ep.php', {
        callback: function (response: string) {
            let parsedResponse: any;
            try {
                parsedResponse = JSON.parse(response);
                type.BangumiInfo.check(parsedResponse);
            } catch (e) {
                message.show (message.template.param.server.invalidResponse);
                return;
            }
            updatePage(parsedResponse);
        },
        content: "series="+seriesID+"&ep="+epIndex+'&format='+formatIndex
    });
});

import type {Hls as Hls_} from './module/player';
import type {videojs as VideoJS} from './module/player';
import type {browser as Browser} from './module/player';
import type {videojsMod as VideojsMod, VideojsModInstance} from './module/player';

const incompatibleTitle = '再生できません';
const incompatibleSuffix = '他のブラウザでご覧いただくか、デスクトップでファイルをダウンロードし、ローカルで再生してください。';

const showMoreButtonClippedText = 'すべてを見る <span class="symbol">&#xE972;</span>';
const showMoreButtonExpandedText = '非表示にする <span class="symbol">&#xE971;</span>';
var EPSelectorHeight: number;

var Hls: typeof Hls_;
var videojs: typeof VideoJS;
var browser: typeof Browser;
var videojsMod: typeof VideojsMod;
var lazyloadInitialize: ()=>void;

var mediaInstances: Array<VideojsModInstance> = [];
var epInfo: type.BangumiInfo.VideoEPInfo | type.BangumiInfo.AudioEPInfo | type.BangumiInfo.ImageEPInfo;
var baseURL = '';

function updatePage (response: type.BangumiInfo.BangumiInfo) {
    navListeners();
    removeClass(getBody(), "hidden");

    epInfo = response.ep_info;

    let titleElem = getById('title');
    let title = response.title;
    let titleOverride = response.title_override;
    if (titleOverride !== undefined) {
        titleElem.innerHTML = titleOverride;
        setTitle(parseCharacters(titleOverride) + ' | featherine');
    } else {
        titleElem.innerHTML = title;
        setTitle(parseCharacters(title) + '[' + response.series_ep[epIndex] + '] | featherine');
    } 
    
    if (debug) {
        let onScreenConsole = createElement('textarea') as HTMLTextAreaElement; 
        onScreenConsole.id = 'on-screen-console';
        onScreenConsole.readOnly = true;
        onScreenConsole.rows = 20;
        appendChild(getById('main'), onScreenConsole);
    }

    updateEPSelector (response.series_ep);
    updateSeasonSelector (response.seasons);

    let ageRestricted = epInfo.age_restricted;

    if (ageRestricted) {
        var warningParent = getById('warning');
        var warningTitle = getById('warning-title');
        var warningBody = getById('warning-body');
        changeColor (warningTitle, 'red');
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
    setInterval (function () {
        sendServerRequest('device_authenticate.php', {
            callback: function (authResult: string) {
                if (authResult != 'APPROVED') {
                    message.show(message.template.param.server.invalidResponse);
                }
            },
            content: "token="+epInfo.authentication_token
        });
    }, 60*1000);

    /////////////////////////////////////////////Add Media/////////////////////////////////////////////
    let type = epInfo.type;
    let seriesOverride = epInfo.series_override;
    baseURL = CDN_URL + '/' + (seriesOverride===undefined?seriesID:seriesOverride) + '/' + encodeCFURIComponent(epInfo.dir) + '/';
    if (type == 'video' || type == 'audio') {
        playerImportPromise.then((playerModule) => {
            Hls = playerModule.Hls;
            videojs = playerModule.videojs;
            browser = playerModule.browser; 
            videojsMod = playerModule.videojsMod; 

            if (type == 'video') {
                updateVideo ();
            } else{
                updateAudio ();
            }
        }).catch((e) => { 
            message.show(message.template.param.moduleImportError(e));
            return;
        });
    } else {
        lazyloadImportPromise.then((module) => {
            lazyloadInitialize = module;
            updateImage ();
        }); // Import error is caught in 'importLazyload' already.
    }
}

function updateEPSelector (seriesEP: type.BangumiInfo.SeriesEP) {
    var epButtonWrapper = createElement('div');
    epButtonWrapper.id = 'ep-button-wrapper';

    seriesEP.forEach(function(value, index) {
        let epButton = createElement('div');
        let epText = createElement('p');

        epText.innerHTML = value;

        if (epIndex == index) {
            addClass(epButton, 'current-ep');
        }

        let targetEP = index+1;
        appendChild(epButton, epText);
        addEventListener(epButton, 'click', function () {goToEP(seriesID, targetEP);});

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

    addEventListener(w, 'resize', function(){
        var currentMaxHeight = epButtonWrapper.style.maxHeight;
        epButtonWrapper.style.maxHeight = ''; //Resetting max-height can mitigate a bug in IE browser where the scrollHeight attribute is not accurate.
        EPSelectorHeight = getContentBoxHeight(epButtonWrapper) + 10;
        epButtonWrapper.style.maxHeight = currentMaxHeight;
        styleEPSelector();
    });
}

function updateSeasonSelector (seasons: type.BangumiInfo.Seasons) {
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
                addEventListener(seasonButton, 'click', function () {goToEP(targetSeries, 1);});
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

function updateVideo () {
    let videoEPInfo = epInfo as type.BangumiInfo.VideoEPInfo;
    addClass(mediaHolder, 'video');

    // Title
    if (videoEPInfo.title!='') {
        let title = createElement('p');
        addClass(title, 'sub-title');
        addClass(title, 'center-align');
        title.innerHTML = videoEPInfo.title;
        insertBefore(title, getById('message'));
    }

    // Formats
    let formats = videoEPInfo.formats;

    let formatSelector = createElement('div');
    formatSelector.id = 'format-selector';

    let selectMenu = createElement('select');
    addEventListener(selectMenu, "change", function () {
        formatSwitch();
    });

    if (formatIndex >= formats.length) {
        formatIndex = 0;
        updateURLParam ('format', 1);
    }

    formats.forEach(function(value, index){
        let option = createElement('option') as HTMLOptionElement;

        option.value = value;
        option.innerHTML = value;

        if (index == formatIndex) {
            option.selected = true;
        }

        appendChild(selectMenu, option);
    });

    appendChild(formatSelector, selectMenu);
    insertBefore(formatSelector, getById('message'));

    // Download Accordion
    addDownloadAccordion();

    // Video Node
    if (!browser.USE_MSE && !browser.NATIVE_HLS) {
        showHLSCompatibilityError();
        return;
    }
    if (!browser.CAN_PLAY_AVC_AAC) {
        showCodecCompatibilityError();
        return;
    }
    
    var videoJS = createElement('video-js');

    addClass(videoJS, 'vjs-big-play-centered');
    videoJS.lang = 'en';
    appendChild(mediaHolder, videoJS);

    const config = {
        controls: true,
        autoplay: false,
        fluid: true,
    } as const;

    videojs(videoJS, config, function () {
        videoJS.style.paddingTop = 9/16*100 + '%';
        mediaInstances.push(videojsMod(this, {debug: debug}));

        let url = concatenateSignedURL(baseURL + encodeCFURIComponent('_MASTER_' + videoEPInfo.file_name + '[' + videoEPInfo.formats[formatIndex] + '].m3u8'), videoEPInfo.cdn_credentials);

        addVideoNode (url, {/*, currentTime: timestampParam*/});
        if (videoEPInfo.chapters.length > 0) {
            displayChapters (videoEPInfo.chapters);
        }
        //updateURLTimestamp();
    });
}

function formatSwitch () {
    let videoEPInfo = epInfo as type.BangumiInfo.VideoEPInfo;
    
    let selectedFormat = (getDescendantsByTagAt(getById('format-selector'), 'select', 0) as HTMLSelectElement).selectedIndex;
    let video = (mediaInstances[0] as VideojsModInstance).media;
    formatIndex = selectedFormat;

    sendServerRequest('format_switch.php', {
        callback: function (response: string) {
            let currentTime = video.currentTime;
            let paused = video.paused;
            updateURLParam ('format', selectedFormat+1);

            let parsedResponse: any;
            try {
                parsedResponse = JSON.parse(response);
                type.CDNCredentials.check(parsedResponse);
            } catch (e) {
                message.show(message.template.param.server.invalidResponse);
                return;
            }
            let url = concatenateSignedURL(baseURL + encodeCFURIComponent('_MASTER_' + videoEPInfo.file_name + '[' + videoEPInfo.formats[selectedFormat] + '].m3u8'), parsedResponse as type.CDNCredentials.CDNCredentials);
            addVideoNode (url, {currentTime: currentTime, play: !paused});
        },
        content: "token="+videoEPInfo.authentication_token+"&format="+selectedFormat
    });
}

function addVideoNode (url: string, options: {currentTime?: number, play?: boolean}) {
    destroyAll();
    
    let videoInstance = mediaInstances[0] as VideojsModInstance;
    let videoMedia = videoInstance.media;
    videoMedia.title = getTitle();

    function videoReady () {
        if (options.currentTime !== undefined) {
            videoMedia.currentTime = options.currentTime;
        }

        if (options.play) {
            videoInstance.play();
        } else {
            videoInstance.pause();
        }
    }

    if (browser.USE_MSE) {

        var config = {
            enableWebVTT: false,
            enableIMSC1: false,
            enableCEA708Captions: false,
            lowLatencyMode: false,
            enableWorker: false,
            maxFragLookUpTolerance: 0.0,
            testBandwidth: false,
            backBufferLength: 30,
            maxBufferLength: 45,
            maxMaxBufferLength: 90,
            maxBufferSize: 0,
            maxBufferHole: 0,
            debug: debug,
            xhrSetup: function(xhr: XMLHttpRequest) {
                xhr.withCredentials = true;
            }
        }

        let hls = new Hls(config);

        hls.on(Hls.Events.ERROR, function (_, data) {
            if (data.fatal) {
                showPlaybackError(data.details);
            }
        });
        hls.on(Hls.Events.MANIFEST_PARSED, function () {
            videoReady();
        });

        videoInstance.attachHls(hls, url).catch(function () {
            showAttachError();
        });
    } else if (browser.NATIVE_HLS) {
        addEventListener(videoMedia, 'error', function () {showPlaybackError ();});
        addEventListener(videoMedia, 'loadedmetadata', function () {
            videoReady ();
        });
        videoInstance.attachNative(url).catch(function () {
            showAttachError();
        });
    }
}


var audioReadyCounter = 0;
var audioMediaAttachPromise: Promise<void>[] = [];
function updateAudio () {
    let audioEPInfo = epInfo as type.BangumiInfo.AudioEPInfo;

    addAlbumInfo();
    addDownloadAccordion();

    if (!browser.USE_MSE && !browser.NATIVE_HLS) {
        showHLSCompatibilityError();
        return;
    }

    for (var i = 0; i < audioEPInfo.files.length; i++) {
        if (!addAudioNode (i)) {
            return;
        }
    }

    Promise.all(audioMediaAttachPromise).catch(function() {
        showAttachError();
    })
}

function addAudioNode (index: number) {
    let audioEPInfo = epInfo as type.BangumiInfo.AudioEPInfo;
    let file = audioEPInfo.files[index] as type.BangumiInfo.AudioFile;

    let cdnCredentials = audioEPInfo.cdn_credentials;

    const configVideoJSControl = {
        controls: true,
        autoplay: false,
        fluid: true,
        aspectRatio: "1:0",
        controlBar: {
            fullscreenToggle: false,
            pictureInPictureToggle: false
        }
    } as const;
    
    let configHls = {
        enableWebVTT: false,
        enableIMSC1: false,
        enableCEA708Captions: false,
        lowLatencyMode: false,
        enableWorker: false,
        maxFragLookUpTolerance: 0.0,
        testBandwidth: false,
        maxBufferSize: 0,
        maxBufferHole: 0,
        debug: false,
        xhrSetup: function(xhr: XMLHttpRequest) {
            xhr.withCredentials = true;
        }
    };

    let audioNode = createElement('audio'); 
    audioNode.id = 'track'+index;

    addClass(audioNode, "vjs-default-skin");
    addClass(audioNode, "video-js");
    audioNode.lang = 'en';

    const FLAC_FALLBACK = (file.flac_fallback && !browser.CAN_PLAY_ALAC);

    appendChild(mediaHolder, getAudioSubtitleNode(file, FLAC_FALLBACK));
    appendChild(mediaHolder, audioNode);
    
    const IS_FLAC = (file.format.toLowerCase() == 'flac' || FLAC_FALLBACK);
    const USE_VIDEOJS = browser.USE_MSE && IS_FLAC;

    const IS_MP3 = file.format.toLowerCase() == 'mp3';

    if ((IS_FLAC && !browser.CAN_PLAY_FLAC) || (IS_MP3 && !browser.CAN_PLAY_MP3)) { //ALAC has already fallen back to FLAC if not supported.
        showMediaMessage(incompatibleTitle, '<p>お使いのブラウザはこのメディアタイプに対応していません。' + incompatibleSuffix + '</p>', true);
        return false;
    }
    
    let videoJSControl = videojs(audioNode, configVideoJSControl, function () {
        let url = concatenateSignedURL(baseURL + encodeCFURIComponent('_MASTER_' + file.file_name + (FLAC_FALLBACK?'[FLAC]':'') +'.m3u8'), cdnCredentials, baseURL + '_MASTER_*.m3u8'); 

        if (USE_VIDEOJS) {
            const configVideoJSMedia = {
                controls: false,
                autoplay: false,
                html5: {
                    vhs: {
                        overrideNative: true,
                        withCredentials: true
                    },
                    nativeAudioTracks: false,
                    //nativeVideoTracks: false
                },
            } as const;
            let videoJSMediaNode = createElement('audio') as HTMLAudioElement; 
            videoJSMediaNode.style.display = 'none';
            appendChild(mediaHolder, videoJSMediaNode);

            let videoJSMedia = videojs(videoJSMediaNode, configVideoJSMedia, function () {

                let audioInstance =  videojsMod (videoJSControl, {
                    videojsMediaOverrideInstance: videoJSMedia,
                    audio: true,
                    debug: debug
                });

                mediaInstances[index] = audioInstance;
                

                setMediaTitle(audioInstance);

                audioReadyCounter ++;
                if (audioReadyCounter == audioEPInfo.files.length) {
                    audioReady();
                }

                videoJSMedia.on('error', function() {
                    if (browser.IS_FIREFOX && parseInt(file.samplerate) > 48000) { //Firefox has problem playing Hi-res audio
                        showMediaMessage(incompatibleTitle, '<p>Firefoxはハイレゾ音源を再生できません。' + incompatibleSuffix + '</p>', true);
                    } else {
                        showPlaybackError('Index ' + index + ': ' + 'videojs: '+JSON.stringify(videoJSMedia.error()));
                    }
                });

                audioMediaAttachPromise.push(audioInstance.attachVideojs(url));
            });
        } else {
            let audioInstance = videojsMod (videoJSControl, {audio: true, debug: debug});
            mediaInstances[index] = audioInstance;
            setMediaTitle(audioInstance);
            if (browser.USE_MSE) {
                if (browser.IS_CHROMIUM) {
                    showMediaMessage('不具合があります', '<p>Chromiumベースのブラウザで、MP3ファイルをシークできない問題があります。SafariやFirefoxでお試しいただくか、ファイルをダウンロードしてローカルで再生してください。<br>バグの追跡：<a class="link" href="https://github.com/video-dev/hls.js/issues/4543" target="_blank" rel="noopener noreferrer">https://github.com/video-dev/hls.js/issues/4543</a></p>', false);
                }
                let hls = new Hls(configHls);
                hls.on(Hls.Events.ERROR, function (_, data) {
                    if (data.fatal) {
                        showPlaybackError('Index ' + index + ': ' + data.details);
                    }
                });
                hls.on(Hls.Events.MANIFEST_PARSED, function () {
                    audioReadyCounter ++;
                    if (audioReadyCounter == audioEPInfo.files.length) {
                        audioReady();
                    }
                });
                audioMediaAttachPromise.push(audioInstance.attachHls(hls, url));
            } else if (browser.NATIVE_HLS) {
                let audioMedia = audioInstance.media;
                
                addEventListener(audioMedia, 'error', function () {showPlaybackError();});
                addEventListener(audioMedia, 'loadedmetadata', function () {
                    audioReadyCounter ++;
                    if (audioReadyCounter == audioEPInfo.files.length) {
                        audioReady();
                    }
                });        
                audioMediaAttachPromise.push(audioInstance.attachNative(url));
            }
        }
    });

    function setMediaTitle (audioInstance: VideojsModInstance) {
        audioInstance.media.title = ((file.title=='')?'':(parseCharacters(file.title) + ' | ')) + getTitle();
    }

    return true;
}

function addAlbumInfo () {
    let albumInfo = (epInfo as type.BangumiInfo.AudioEPInfo).album_info;
    if (albumInfo.album_title!='') {
        let albumTitleElem = createElement('p');
        addClass(albumTitleElem, 'sub-title');
        addClass(albumTitleElem, 'center-align');
        albumTitleElem.innerHTML = albumInfo.album_title;
        insertBefore(albumTitleElem, getById('message'));
        if (albumInfo.album_artist!='') {
            let albumArtist = createElement('p');
            addClass(albumArtist, 'artist');
            addClass(albumArtist, 'center-align');
            albumArtist.innerHTML = albumInfo.album_artist;
            insertBefore(albumArtist, getById('message'));
        }
    } else if (albumInfo.album_artist!='') {
        let titleElem = getById('title');
        let artistElem = createElement('span');
        addClass(artistElem, 'artist');
        artistElem.innerHTML = '<br/>' + albumInfo.album_artist;
        appendChild(titleElem, artistElem);
    }
}

function getAudioSubtitleNode (file: type.BangumiInfo.AudioFile, FLAC_FALLBACK: boolean) {
    let subtitle = createElement('p');
    addClass(subtitle, 'sub-title');

    //subtitle
    if (file.title != '') {
        subtitle.innerHTML = file.title;

        if (file.artist != '') {
            let artist = createElement('span');
            addClass(artist, 'artist');
            artist.innerHTML = '／' + file.artist;
            appendChild(subtitle, artist);
        }
    }

    //format
    if (file.format != '') {
        if (subtitle.innerHTML != '') {
            subtitle.innerHTML += '<br>';
        }

        let format = createElement('span');
        addClass(format, 'format');
        format.innerHTML = FLAC_FALLBACK?'FLAC':file.format;

        let samplerate = file.samplerate;
        if (samplerate != '') {
            let samplerateText = samplerate;
            switch (samplerate) {
                case '44100':
                    samplerateText = '44.1kHz';
                    break;
                case '48000':
                    samplerateText = '48.0kHz';
                    break;
                case '96000':
                    samplerateText = '96.0kHz';
                    break;
                case '88200':
                    samplerateText = '88.2kHz';
                    break;
                case '192000':
                    samplerateText = '192.0kHz';
                    break;
            }
            format.innerHTML += ' ' + samplerateText;

            let bitdepth = file.bitdepth;
            if (bitdepth != '') {
                let bitdepthText = bitdepth;
                switch (bitdepth) {
                    case '16':
                        bitdepthText = '16bit';
                        break;
                    case '24':
                        bitdepthText = '24bit';
                        break;
                    case '32':
                        bitdepthText = '32bit';
                        break;	
                }
                if (bitdepthText == '32bit' && FLAC_FALLBACK) {
                    bitdepthText = '24bit';
                }
                format.innerHTML += '/' + bitdepthText;
            }
        }

        appendChild(subtitle, format);
    }

    return subtitle;
}

function audioReady () {
    function pauseAll (currentIndex: number) {
        for (var j = 0; j < mediaInstances.length; j++) {
            if (j != currentIndex) {
                (mediaInstances[j] as VideojsModInstance).pause();
            }
        }
    }
    function playNext (currentIndex: number) {
        if (currentIndex < mediaInstances.length-1) {
            (mediaInstances[currentIndex+1] as VideojsModInstance).play();
        }
    }

    mediaInstances.forEach(function (instance, index) {
        let media = instance.media;
        addEventListener(media, 'play', function () {
            pauseAll(index);
        });
        addEventListener(media, 'ended', function () {
            playNext(index);
        });
    });
}

function updateImage () {
    let ImageEPInfo = epInfo as type.BangumiInfo.ImageEPInfo;
    let files = ImageEPInfo.files;

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
        imageNode.dataset.alt = getById('title').innerHTML;
        imageNode.dataset.xhrParam = index.toString();
        imageNode.dataset.authenticationToken = epInfo.authentication_token;
        addEventListener(imageNode, 'click', function() {
            let param: type.LocalImageParam.LocalImageParam = {
                src: baseURL + encodeCFURIComponent(file.file_name),
                xhrParam: index.toString(),
                title: getById('title').innerHTML,
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

    lazyloadInitialize();
}

function showPlaybackError (detail?: string) {
    showMediaMessage (message.template.title.defaultError, '<p>再生中にエラーが発生しました。' + (browser.IS_APPLE?'AppleデバイスでiCloudプライベートリレーを使用する際に、既知の問題があります。iCloudプライベートリレーを使用している場合は、それをオフにしてからもう一度試してみてください。':'') + message.template.body.defaultErrorSuffix + (detail===undefined?'':('<br>Error detail: '+detail)) + '</p>', true);
}

function showHLSCompatibilityError () {
    showMediaMessage(incompatibleTitle, '<p>お使いのブラウザは、再生に最低限必要なMedia Source Extensions（MSE）およびHTTP Live Streaming（HLS）に対応していません。' + incompatibleSuffix + '</p>', true);
}

function showCodecCompatibilityError () {
    showMediaMessage(incompatibleTitle, '<p>お使いのブラウザは、再生に必要なAVC/AACコーデックに対応していません。' + incompatibleSuffix + 'Linuxをお使いの方は、対応するメディアコーデックパッケージのインストールをお試しください。</p>', true);
}

function showAttachError () {
    showMediaMessage(message.template.title.defaultError, '<p>メディアを添付できません。ページを再読み込みして、もう一度お試しください。' + message.template.body.defaultErrorSuffix + '</p>', true);
}

function showMediaMessage (title: string, messageTxt: string, error: boolean) {
    var messageTitle = getById('message-title');
    changeColor(messageTitle, error?"red":"orange");
    messageTitle.innerHTML = title;
    if (error) {
        addClass(mediaHolder, 'hidden');
        destroyAll();
    }
    getById('message-body').innerHTML = messageTxt;
    removeClass(getById('message'), 'hidden');
}

function goToEP (dest_series: string, dest_ep: number) {
    var url: string;
    if (DEVELOPMENT) {
        url = 'bangumi.html'+'?series='+dest_series+(dest_ep==1?'':('&ep='+dest_ep));
    } else {
        url = TOP_URL+'/bangumi/'+dest_series+(dest_ep==1?'':('?ep='+dest_ep));
    }
    redirect(url);
}

function addAccordionEvent (acc: HTMLElement) {
    addEventListener(acc, "click", function() {
        toggleClass(acc, "active");
        let panel = acc.nextElementSibling;
        if (panel === null) {
            return;
        }
        let panelCast = panel as HTMLElement;
        if (panelCast.style.maxHeight !== '') {
            panelCast.style.maxHeight = '';
            panelCast.style.padding = '0px 1em';
        } else {
            panelCast.style.maxHeight = getContentBoxHeight(panelCast) + "px";
            panelCast.style.padding = '1em';
        }
    });
}

function displayChapters (chapters: type.BangumiInfo.Chapters) {
    let videoInstance = mediaInstances[0] as VideojsModInstance;

    //display chapters
    var accordion = createElement('button'); 
    addClass(accordion, 'accordion');
    accordion.innerHTML = 'CHAPTERS';

    var accordionPanel = createElement('div');
    addClass(accordionPanel, 'panel');

    var video = videoInstance.media;

    for (let chapter of chapters) {
        let chapterNode = createElement('p');
        let timestamp = createElement('span');
        let cueText = createTextNode('\xa0\xa0' + chapter[0]);
        let startTime = chapter[1];
        timestamp.innerHTML = secToTimestamp (startTime);
        addEventListener(timestamp, 'click', function () {
            videoInstance.seek(startTime);
            videoInstance.controls.focus();
        });
        appendChild(chapterNode, timestamp);
        appendChild(chapterNode, cueText);
        setClass(chapterNode, 'inactive-chapter');
        appendChild(accordionPanel, chapterNode);
    }

    var chaptersNode = createElement('div');
    addClass(chaptersNode, 'chapters');
    appendChild(chaptersNode, accordion);
    appendChild(chaptersNode, accordionPanel);
    addAccordionEvent(accordion);
    appendChild(mediaHolder, chaptersNode);

    var updateChapterDisplay = function () {
        var chapterElements = getDescendantsByTag(accordionPanel, 'p'); 
        var currentTime = video.currentTime;
        chapters.forEach(function(chapter, index) {
            let chapterElement = chapterElements[index] as HTMLElement;
            if (currentTime >= chapter[1]) {
                if (index == chapters.length-1) {
                    setClass(chapterElement, 'current-chapter');
                } else if (currentTime < chapters[index+1]![1]) {
                    setClass(chapterElement, 'current-chapter');
                } else {
                    setClass(chapterElement, 'inactive-chapter');
                }
            } else {
                setClass(chapterElement, 'inactive-chapter');
            }
        });
    };

    //video.addEventListener ('timeupdate', updateChapterDisplay);
    setInterval (updateChapterDisplay, 500);
    addEventsListener(video, ['play', 'pause', 'seeking', 'seeked'], updateChapterDisplay);
}

function addDownloadAccordion () {
    if (!browser.IS_DESKTOP) {
        return;
    }

    const accordion = createElement('button');
    addClass(accordion, 'accordion');
    accordion.innerHTML = 'DOWNLOAD';

    const accordionPanel = createElement('div');
    addClass(accordionPanel, 'panel');

    accordionPanel.innerHTML = '<ul>' +
        '<li>まず、下の「ダウンロード」ボタンをクリックして、必要なツールやスクリプトが入ったZIPファイルをダウンロードしてください。</li>' +
        '<li>このZIPファイルをダウンロードした後、解凍してREADME.txtに記載されている手順に従ってください。</li>' +
        '<li>ZIPファイルをダウンロード後、5分以内にスクリプトを起動してください。</li>' +
        '<li>インターネット接続が良好であることを確認してください。</li>' +
        '<li>IDMなどの拡張機能を使用している場合、ZIPファイルのダウンロードに問題が発生する可能性があります。ダウンロードする前に、そのような拡張機能を無効にしてください。</li>' +
    '</ul>';

    const downloadButton = createElement('button');
    downloadButton.id = 'download-button';
    addClass(downloadButton, 'button');
    downloadButton.innerHTML = 'ダウンロード';
    const warning = createElement('p');
    changeColor(warning, 'red');
    addClass(warning, 'hidden');
    warning.innerHTML = 'お使いの端末はダウンロードに対応していません。';
    appendChild(accordionPanel, warning);

    const iframe = createElement('iframe') as HTMLIFrameElement;
    iframe.id = 'download-iframe';
    iframe.height = '0';
    iframe.width = '0';
    
    addEventListener(downloadButton, 'click', function () {
        sendServerRequest('start_download.php', {
            callback: function (response: string) {
                if (response == 'UNAVAILABLE') {
                    addClass(downloadButton, 'hidden');
                    removeClass(warning, 'hidden');
                } else if (response.startsWith(SERVER_URL)) {
                    iframe.src = response;
                } else {
                    message.show(message.template.param.server.invalidResponse);
                }
            },
            content: "token="+epInfo.authentication_token+'&format='+formatIndex
        });
    });
    appendChild(accordionPanel, downloadButton);

    const downloadElem = createElement('div');
    addClass(downloadElem, 'download');
    appendChild(downloadElem, accordion);
    appendChild(downloadElem, accordionPanel);
    appendChild(downloadElem, iframe);
    addAccordionEvent(accordion);
    appendChild(contentContainer, downloadElem);
}


function updateURLParam (key: string, value: number) {
    var url: string;
    var separator: '?' | '&' = '?';
    if (DEVELOPMENT) {
        url = 'bangumi.html'+'?series='+seriesID+(epIndex==0?'':('&ep='+(epIndex+1)));
        separator = '&';
    } else {
        url = TOP_URL + '/bangumi/'+seriesID;
        if (epIndex!=0) {
            url += '?ep='+(epIndex+1);
            separator = '&';
        }
    }

    if (key == 'format') {
        url += (value==1?'':(separator+'format='+value));
    }

    changeURL(url, true);
}

function destroyAll () {
    for (let mediaInstance of mediaInstances) {
        mediaInstance.destroy();
    }
}

function parseCharacters (txt: string) {
    txt = txt.replace(/<.*?>/g, '');
    txt = txt.replace(/&gt;/g, '>');
    txt = txt.replace(/&lt;/g, '<');
    txt = txt.replace(/&amp;/g, '&');
    return txt;
}


function styleEPSelector () {
    if (EPSelectorHeight/w.innerHeight > 0.50) {
        foldEPSelector();
    } else {
        unfoldEPSelector();
    }
}

function foldEPSelector () {
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

function unfoldEPSelector () {
    var showMoreButton = getById('show-more-button');
    var epButtonWrapper = getById('ep-button-wrapper');
    if (containsClass(showMoreButton, 'hidden')) {
        return;
    }
    epButtonWrapper.style.maxHeight = "";
    removeClass(epButtonWrapper, 'expanded');
    addClass(showMoreButton, 'hidden');
}

function toggleEPSelector () {
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

function getContentBoxHeight (elem: HTMLElement) {
    var height = elem.scrollHeight;
    height -= parseFloat(getComputedStyle(elem, 'padding-top')) + parseFloat(getComputedStyle(elem, 'padding-bottom'));
    return height;
}