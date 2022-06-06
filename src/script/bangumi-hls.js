// JavaScript Document
import "core-js";
import {
    debug,
    keyExists,
	navListeners,
	topURL,
	sendServerRequest,
	message,
	changeColor,
	getURLParam,
	getSeriesID,
	secToTimestamp,
	cdnURL,
	concatenateSignedURL,
	encodeCFURIComponent,
    clearCookies,
    cssVarWrapper,
    getHref
} from './helper/main.js';
import cssVars from 'css-vars-ponyfill';


var seriesID;
var epIndex;
var formatIndex;

const showMoreButtonClippedText = 'すべてを見る <span class="symbol">&#xE972;</span>';
const showMoreButtonExpandedText = '非表示にする <span class="symbol">&#xE971;</span>';
var EPSelectorHeight;

window.addEventListener("load", function(){
	cssVarWrapper(cssVars);
	clearCookies();
	
	if (!getHref().startsWith(topURL + '/bangumi') && !debug) {
		window.location.replace(topURL);
		return;
	}

    
    //get parameters
    seriesID = getSeriesID();
    if (seriesID == null) {
        window.location.replace(topURL);
        return;
    } else {
        if (!/^[a-zA-Z0-9~_-]{8,}$/.test(seriesID)) {
			window.location.replace(topURL);
            return;
        }
    }

    epIndex = getURLParam ('ep');
    var newURL = debug?('bangumi.html'+'?series='+seriesID):(topURL+'/bangumi/'+seriesID);
    if (epIndex == null) {
        epIndex = 0;
    } else {
        epIndex = parseInt (epIndex);
        if (isNaN(epIndex) || epIndex<1) {
			history.replaceState(null, '', newURL);
            epIndex = 1;
        } else if (epIndex == 1) {
			history.replaceState(null, '', newURL);
		}
        epIndex--;
    }

    formatIndex = getURLParam ('format');
	if (formatIndex == null) {
        formatIndex = 0;
    } else {
        formatIndex = parseInt (formatIndex);
        if (isNaN(formatIndex) || formatIndex<1) {
			updateURLParam('format', 1);
            formatIndex = 1;
        }
        formatIndex--;
    }

    //send requests
    sendServerRequest('get_ep.php', {
        callback: function (response) {
            try {
                response = JSON.parse(response);
            } catch (e) {
                message.show (message.template.param.server.invalidResponse);
                return;
            }
            updatePage(response);
        },
        content: "series="+seriesID+"&ep="+epIndex+'&format='+formatIndex
    });
});


var Hls;
var videojs;
var browser;
var videojsMod;
var lazyloadInitialize;

var mediaInstances = [];
var epInfo;
var baseURL = '';
var onScreenConsole = false;


async function updatePage (response) {
    navListeners();
    document.body.classList.remove("hidden");

    epInfo = response.ep_info;

    let titleElem = document.getElementById('title');
    if (keyExists(response, 'title_override')) {
        titleElem.innerHTML = response.title_override;
        document.title = response.title_override + ' | featherine';
    } else {
        titleElem.innerHTML = response.title;
        document.title = response.title + '[' + response.series_ep[epIndex] + '] | featherine';
    }        
    

    function addOnScreenConsole () {
        onScreenConsole = document.createElement('textarea');
        onScreenConsole.id = 'on-screen-console';
        onScreenConsole.readOnly = true;
        onScreenConsole.rows = 20;
        document.getElementById('main').appendChild(onScreenConsole);
    }
    if (debug) {
        addOnScreenConsole();
    } else {
        addConsecutiveEventListener (titleElem, 'click', function () {
            if (!onScreenConsole) {
                addOnScreenConsole();
            }
        }, 10, 3*1000);
    }

    updateEPSelector (response.series_ep);
    updateSeasonSelector (response.seasons);

    if (epInfo.age_restricted) {
        var warningParent = document.getElementById('warning');
        var warningTitle = document.getElementById('warning-title');
        var warningBody = document.getElementById('warning-body');
        changeColor (warningTitle, 'red');
        if (epInfo.age_restricted.toLowerCase() == 'r15+') {
            warningTitle.innerHTML = '「R15+指定」<br>年齢認証';
        } else if (epInfo.age_restricted.toLowerCase() == 'r18+') {
            warningTitle.innerHTML = '「R18+指定」<br>年齢認証';
        } else {
            warningTitle.innerHTML = '年齢認証';
        }
        warningBody.innerHTML = 'ここから先は年齢制限のかかっている作品を取り扱うページとなります。表示しますか？';
        
        var warningButtonGroup = document.getElementById('warning-button-group');
        var warningButtonYes = document.createElement('button');
        var warningButtonNo = document.createElement('button');
        warningButtonYes.innerHTML = 'はい';
        warningButtonNo.innerHTML = 'いいえ';
        warningButtonYes.classList.add('button');
        warningButtonNo.classList.add('button');
        warningButtonGroup.appendChild(warningButtonYes);
        warningButtonGroup.appendChild(warningButtonNo);
        warningButtonYes.addEventListener('click', function () {
            warningParent.classList.add('hidden');
            document.getElementById('content').classList.remove('hidden');
        });
        warningButtonNo.addEventListener('click', function () {
            window.location.href = topURL;
        });
        
        document.getElementById('content').classList.add('hidden');
        warningParent.classList.remove('hidden');
    }

    /////////////////////////////////////////////device_authenticate/////////////////////////////////////////////
    setInterval (function () {
        sendServerRequest('device_authenticate.php', {
            callback: function (authResult) {
                if (authResult != 'APPROVED') {
                    message.show();
                    return false;
                }
            },
            content: "token="+epInfo.authentication_token
        });
    }, 60*1000);

    /////////////////////////////////////////////Add Media/////////////////////////////////////////////
    var type = epInfo.type;
    baseURL = cdnURL + '/' + (keyExists(epInfo, 'series_override')?epInfo.series_override:seriesID) + '/' + encodeCFURIComponent(epInfo.dir) + '/';
    if (type == 'video' || type == 'audio') {
        try {
            ({
                Hls,
                videojs,
                browser, 
                videojsMod
            } = await import(
                /* webpackExports: ["Hls", "videojs", "browser", "videojsMod"] */
                './helper/player.js'));
        } catch (e) {
            message.show(message.template.param.moduleImportError(e));
            return;
        }

        if (type == 'video') {
            updateVideo ();
        } else{
            updateAudio ();
        }
    } else {
        try {
            ({default: lazyloadInitialize} = await import(
                /* webpackChunkName: "lazyload" */
                /* webpackExports: ["default"] */
                './helper/lazyload.js'
            ));
        } catch (e) {
            message.show(message.template.param.moduleImportError(e));
            return;
        }

        updateImage ();
    }
}

function updateEPSelector (seriesEP) {
    var epButtonWrapper = document.createElement('div');
    epButtonWrapper.id = 'ep-button-wrapper';
    for (var i = 0; i < seriesEP.length; i++) {
        let epButton = document.createElement('div');
        let epText = document.createElement('p');

        epText.innerHTML = seriesEP[i];

        if (epIndex == i) {
            epButton.classList.add('current-ep');
        }

        let targetEP = i+1;
        epButton.appendChild(epText);
        epButton.addEventListener('click', function () {goToEP(seriesID, targetEP);});

        epButtonWrapper.appendChild(epButton);
    }

    document.getElementById('ep-selector').appendChild(epButtonWrapper);

    EPSelectorHeight = getContentBoxHeight(epButtonWrapper) + 10; //Add some extra pixels to compensate for slight variation and error.
    var showMoreButton = document.createElement('p');
    showMoreButton.id = 'show-more-button';
    showMoreButton.classList.add('hidden');
    document.getElementById('ep-selector').appendChild(showMoreButton);
    showMoreButton.addEventListener('click', toggleEPSelector);
    styleEPSelector();
    window.addEventListener('resize', function(){
        var currentMaxHeight = epButtonWrapper.style.maxHeight;
        epButtonWrapper.style.maxHeight = null; //Resetting max-height can mitigate a bug in IE browser where the scrollHeight attribute is not accurate.
        EPSelectorHeight = getContentBoxHeight(epButtonWrapper) + 10;
        epButtonWrapper.style.maxHeight = currentMaxHeight;
        styleEPSelector();
    });
}

function updateSeasonSelector (seasons) {
    var seasonButtonWrapper = document.createElement('div');
    var seasonSelector = document.getElementById('season-selector');
    seasonButtonWrapper.id = 'season-button-wrapper';

    if (seasons.length != 0) {
        for (var i = 0; i < seasons.length; i++) {
            let seasonButton = document.createElement('div');
            let seasonText = document.createElement('p');

            if (seasons[i].id != seriesID) {
                seasonText.innerHTML = seasons[i].season_name;
                seasonButton.appendChild (seasonText);
                let targetSeries = seasons[i].id;
                seasonButton.addEventListener('click', function () {goToEP(targetSeries, 1);});
            } else {
                seasonText.innerHTML = seasons[i].season_name;
                seasonButton.appendChild (seasonText);
                seasonButton.classList.add ('current-season');
            }
            seasonButtonWrapper.appendChild (seasonButton);
        }
        seasonSelector.appendChild(seasonButtonWrapper);
    } else {
        seasonSelector.parentNode.removeChild(seasonSelector);
    }
}

function updateVideo () {
    let contentContainer = document.getElementById('content');
    if (epInfo.title!='') {
        let title = document.createElement('p');
        title.setAttribute('class', 'sub-title');
        title.classList.add('center-align');
        title.innerHTML = epInfo.title;
        contentContainer.insertBefore(title, document.getElementById('message'));
    }

    let formats = epInfo.formats;

    let formatSelector = document.createElement('div');
    formatSelector.setAttribute('id', 'format-selector');

    let selectMenu = document.createElement('select');
    selectMenu.addEventListener("change", function () {
        formatSwitch();
    });

    if (formatIndex >= formats.length) {
        formatIndex = 0;
        updateURLParam ('format', 1);
    }

    for (var i = 0; i < formats.length; i++) {
        let format = formats[i];
        let option = document.createElement('option');

        option.setAttribute('value', format);
        option.innerHTML = format;

        if (i == formatIndex) {
            option.setAttribute('selected', true);
        }

        selectMenu.appendChild (option);
    }

    formatSelector.appendChild(selectMenu);
    contentContainer.insertBefore(formatSelector, document.getElementById('message'));

    var mediaHolder = document.createElement('div');
    mediaHolder.id = 'media-holder';
    mediaHolder.classList.add('video');
    contentContainer.appendChild(mediaHolder);
    addDownloadAccordion();

    /*var timestampParam = getURLParam ('timestamp');
    if (timestampParam != null) {
        timestampParam = parseFloat (timestampParam);
        if (!isNaN(timestampParam)) {
            if (timestampParam<0) {
                timestampParam = 0;
            }
        }
    } else {
        timestampParam = 0;
    }*/
    ////////////////////////////////////////////////////////////////////////////////


    /*function updateURLTimestamp() {
        function update () {
            var video = mediaInstances[0].media;
            if (video) {
                updateURLParam ('timestamp', video.currentTime);
            }
        }
        var video = mediaInstances[0].media;
        video.addEventListener ('pause', function () {
            update ();
        });
        setInterval (function () {
            update ();
        }, 3*1000);
    }*/

    var videoJS = document.createElement('video-js');

    videoJS.classList.add('vjs-big-play-centered');
    videoJS.setAttribute('lang', 'en');
    mediaHolder.appendChild(videoJS);

    var config = {
        controls: true,
        autoplay: false,
        preload: 'auto',
        fluid: true,
        playsinline: true,
    };

    videojs(videoJS, config, function () {
        videoJS.style.paddingTop = 9/16*100 + '%';
        mediaInstances.push(videojsMod (videoJS, this, {}));

        let url = concatenateSignedURL(baseURL + encodeCFURIComponent('_MASTER_' + epInfo.file_name + '[' + epInfo.formats[formatIndex] + '].m3u8'), epInfo.cdn_credentials);

        addVideoNode (url, {/*, currentTime: timestampParam*/});
        if (epInfo.chapters != '') {
            displayChapters (epInfo.chapters);
        }
        //updateURLTimestamp();
    });
}

function formatSwitch () {
    var selectedFormat = document.getElementById('format-selector').getElementsByTagName('select')[0].selectedIndex;
    var video = mediaInstances[0].media;
    formatIndex = selectedFormat;

    sendServerRequest('format_switch.php', {
        callback: function (response) {
            var currentTime = video.currentTime;
            var paused = video.paused;
            updateURLParam ('format', selectedFormat+1);
            try {
                response = JSON.parse(response);
            } catch (e) {
                message.show(message.template.param.server.invalidResponse);
                return;
            }
            let url = concatenateSignedURL(baseURL + encodeCFURIComponent('_MASTER_' + epInfo.file_name + '[' + epInfo.formats[selectedFormat] + '].m3u8'), response);
            addVideoNode (url, {currentTime: currentTime, play: !paused});
        },
        content: "token="+epInfo.authentication_token+"&format="+selectedFormat
    });

    /*
    var resume = function () {
        mediaInstances[0].currentTime(currentTime);
        if (!paused)
            mediaInstances[0].play();
        mediaInstances[0].off ('loadedmetadata', resume);
    };

    mediaInstances[0].load();
    mediaInstances[0].on('loadedmetadata', resume);*/
}

function addVideoNode (url, options) {
    destroyAll();

    if (!browser.CAN_PLAY_AVC_AAC) {
        showCodecCompatibilityError();
        return;
    }
    
    let video = mediaInstances[0].media;
    video.setAttribute('title', document.title);

    function videoReady () {
        video.volume = 1;

        if (options.currentTime!=undefined) {
            video.currentTime = options.currentTime;
        }

        if (options.play) {
            mediaInstances[0].play();
        } else {
            mediaInstances[0].pause();
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
            maxBufferLength: 60,
            maxMaxBufferLength: 90,
            maxBufferSize: 0,
            maxBufferHole: 0,
            debug: debug,
            xhrSetup: function(xhr, url) {
                xhr.withCredentials = true;
            }
        }

        let hls = new Hls(config);

        hls.on(Hls.Events.ERROR, function (event, data) {
            if (data.fatal) {
                showPlaybackError(data.detail);
            }
        });
        hls.on(Hls.Events.MANIFEST_PARSED, function () {
            videoReady();
        });

        if (!mediaInstances[0].attachHls(hls, url)) {
            showAttachError();
        }
    } else if (browser.NATIVE_HLS) {
        video.addEventListener('error', function () {showPlaybackError ();});
        video.setAttribute ('crossorigin', 'use-credentials');
        video.addEventListener('loadedmetadata', function () {
            videoReady ();
        });
        if (!mediaInstances[0].attachNative(url)) {
            showAttachError();
        }
    } else {
        showHLSCompatibilityError();
    }
}


var audioReadyCounter = 0;
function updateAudio () {

    let contentContainer = document.getElementById('content');

    addAlbumInfo(contentContainer);
    
    var mediaHolder = document.createElement('div');
    mediaHolder.id = 'media-holder';
    contentContainer.appendChild(mediaHolder);

    addDownloadAccordion();

    for (var i = 0; i < epInfo.files.length; i++) {
        if (!addAudioNode (mediaHolder, i)) {
            return;
        }
    }
}

function addAudioNode (mediaHolder, index) {
    var cdnCredentials = epInfo.cdn_credentials;
    var files = epInfo.files;

    var configVideoJSControl = {
        controls: true,
        autoplay: false,
        preload: 'auto',
        fluid: true,
        aspectRatio: "1:0",
        controlBar: {
            fullscreenToggle: false,
            pictureInPictureToggle: false
        }
    };
    
    var configHls = {
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
        xhrSetup: function(xhr, url) {
            xhr.withCredentials = true;
        }
    };

    let audioNode = document.createElement('audio');
    audioNode.id = 'track'+index;

    audioNode.classList.add("vjs-default-skin");
    audioNode.classList.add("video-js");
    audioNode.setAttribute('lang', 'en');

    const FLAC_FALLBACK = (files[index].flac_fallback && !browser.CAN_PLAY_ALAC);

    mediaHolder.appendChild(getAudioSubtitleNode(files[index], FLAC_FALLBACK));
    mediaHolder.appendChild(audioNode);
    
    const IS_FLAC = (files[index].format.toLowerCase() == 'flac' || FLAC_FALLBACK);
    const USE_VIDEOJS = browser.USE_MSE && IS_FLAC;

    const IS_MP3 = files[index].format.toLowerCase() == 'mp3';

    if ((IS_FLAC && !browser.CAN_PLAY_FLAC) || (IS_MP3 && !browser.CAN_PLAY_MP3)) { //ALAC has already fallen back to FLAC if not supported.
        showMediaMessage(message.template.media.title.incompatible, '<p>お使いのブラウザはこのメディアタイプに対応していません。' + message.template.media.body.incompatibleSuffix + '</p>', true);
        return false;
    }
    
    let videoJSControl = videojs(audioNode, configVideoJSControl, function () {
        let url = concatenateSignedURL(baseURL + encodeCFURIComponent('_MASTER_' + files[index].file_name + (FLAC_FALLBACK?'[FLAC]':'') +'.m3u8'), cdnCredentials, baseURL + '_MASTER_*.m3u8'); 
        let controlNode = document.getElementById('track' + index);

        if (USE_VIDEOJS) {
            let configVideoJSMedia = {
                controls: false,
                autoplay: false,
                preload: 'auto',
                html5: {
                    vhs: {
                        overrideNative: true,
                        withCredentials: true
                    },
                    nativeAudioTracks: false,
                    //nativeVideoTracks: false
                },
                crossOrigin: 'use-credentials'
            };
            let videoJSMediaNode = document.createElement('audio');
            videoJSMediaNode.style.display = 'none';
            mediaHolder.appendChild(videoJSMediaNode);

            let videoJSMedia = videojs(videoJSMediaNode, configVideoJSMedia, function () {

                mediaInstances[index] = videojsMod (controlNode, videoJSControl, {
                    mediaElemOverride: videoJSMediaNode,
                    audio: true
                });

                setMediaTitle();

                audioReadyCounter ++;
                if (audioReadyCounter == files.length) {
                    audioReady();
                }

                videoJSMedia.on('error', function() {
                    if (browser.IS_FIREFOX && parseInt(files[index].samplerate) > 48000) { //Firefox has problem playing Hi-res audio
                        showMediaMessage(message.template.media.title.incompatible, '<p>Firefoxはハイレゾ音源を再生できません。' + message.template.media.body.incompatibleSuffix + '</p>', true);
                    } else {
                        showPlaybackError('Index ' + index + ': ' + 'videojs: '+JSON.stringify(videoJSMedia.error()));
                    }
                });

                if (!mediaInstances[index].attachVideoJS(videoJSMedia, url)) {
                    showAttachError();
                    return false;
                }
            });
        } else {
            mediaInstances[index] = videojsMod (controlNode, videoJSControl, {audio: true});
            setMediaTitle();
            if (browser.USE_MSE) {
                if (browser.IS_CHROMIUM) {
                    showMediaMessage('不具合があります', '<p>Chromiumベースのブラウザで、MP3ファイルをシークできない問題があります。SafariやFirefoxでお試しいただくか、ファイルをダウンロードしてローカルで再生してください。<br>バグの追跡：<a class="link" href="https://github.com/video-dev/hls.js/issues/4543" target="_blank" rel="noopener noreferrer">https://github.com/video-dev/hls.js/issues/4543</a></p>', false);
                }
                let hls = new Hls(configHls);
                hls.on(Hls.Events.ERROR, function (event, data) {
                    if (data.fatal) {
                        showPlaybackError('Index ' + index + ': ' + data.detail);
                    }
                });
                hls.on(Hls.Events.MANIFEST_PARSED, function () {
                    audioReadyCounter ++;
                    if (audioReadyCounter == files.length) {
                        audioReady();
                    }
                });
                if (!mediaInstances[index].attachHls(hls, url)) {
                    showAttachError();
                    return false;
                }
            } else if (browser.NATIVE_HLS) {
                let audio = mediaInstances[index].media;
                
                audio.addEventListener('error', function () {showPlaybackError();});
                audio.setAttribute ('crossorigin', 'use-credentials');
                audio.addEventListener('loadedmetadata', function () {
                    audioReadyCounter ++;
                    if (audioReadyCounter == files.length) {
                        audioReady();
                    }
                });
                
                if (!mediaInstances[index].attachNative(url)) {
                    showAttachError();
                    return false;
                }
            } else {
                showHLSCompatibilityError();
                return false;
            }
        }
    });

    function setMediaTitle () {
        mediaInstances[index].media.setAttribute('title', ((files[index].title=='')?'':(files[index].title + ' | ')) + document.title);
    }

    return true;
}

function addAlbumInfo (contentContainer) {
    let albumInfo = epInfo.album_info;
    if (albumInfo.album_title!='') {
        let albumTitleElem = document.createElement('p');
        albumTitleElem.setAttribute('class', 'sub-title');
        albumTitleElem.classList.add('center-align');
        albumTitleElem.innerHTML = albumInfo.album_title;
        contentContainer.insertBefore(albumTitleElem, document.getElementById('message'));
        if (albumInfo.album_artist!='') {
            let albumArtist = document.createElement('p');
            albumArtist.setAttribute('class', 'artist');
            albumArtist.classList.add('center-align');
            albumArtist.innerHTML = albumInfo.album_artist;
            contentContainer.insertBefore(albumArtist, document.getElementById('message'));
        }
    } else if (albumInfo.album_artist!='') {
        let titleElem = document.getElementById('title');
        let artistElem = document.createElement('span');
        artistElem.setAttribute('class', 'artist');
        artistElem.innerHTML = '<br/>' + albumInfo.album_artist;
        titleElem.appendChild(artistElem);
    }
}

function getAudioSubtitleNode (file, FLAC_FALLBACK) {
    let subtitle = document.createElement('p');
    subtitle.setAttribute('class', 'sub-title');
    let format = document.createElement('span');

    //subtitle
    if (file.title != '') {
        subtitle.innerHTML = file.title;

        if (file.artist != '') {
            let artist = document.createElement('span');
            artist.setAttribute('class', 'artist');
            artist.innerHTML = '／' + file.artist;
            subtitle.appendChild(artist);
        }
    }

    //format
    if (file.format != '') {
        if (subtitle.innerHTML != '') {
            subtitle.innerHTML += '<br />';
        }

        format.setAttribute('class', 'format');
        format.innerHTML = file.format;

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
                format.innerHTML += '/' + bitdepthText;
            }
        }

        if (FLAC_FALLBACK) {
            format.innerHTML = format.innerHTML.replace('ALAC', 'FLAC');
            format.innerHTML = format.innerHTML.replace('32bit', '24bit');
        }

        subtitle.appendChild(format);
    }

    return subtitle;
}

function audioReady () {
    function pauseAll (currentIndex) {
        for (var j = 0; j < mediaInstances.length; j++) {
            if (j != currentIndex) {
                mediaInstances[j].pause();
            }
        }
    }
    function playNext (currentIndex) {
        if (currentIndex != mediaInstances.length-1) {
            mediaInstances[currentIndex+1].play();
        }
    }

    for (var i = 0; i < mediaInstances.length; i++) {
        let index = i;
        mediaInstances[index].media.addEventListener('play', function () {
            pauseAll(index);
        });
        mediaInstances[index].media.addEventListener('ended', function () {
            playNext(index);
        });
    }
}

function updateImage () {
    var mediaHolder = document.createElement('div');
    mediaHolder.id = 'media-holder';
    document.getElementById('content').appendChild(mediaHolder);
    
    let files = epInfo.files;
    for (var i = 0; i < files.length; i++) {
        let index = i;
        if (files[index].tag != '') {
            let subtitle = document.createElement('p');
            subtitle.setAttribute('class', 'sub-title');
            subtitle.innerHTML = files[index].tag;
            mediaHolder.appendChild(subtitle);
        }

        let imageNode = document.createElement('div');
        let overlay = document.createElement('div');

        overlay.classList.add('overlay');
        imageNode.appendChild(overlay);

        imageNode.classList.add('lazyload');
        imageNode.dataset.crossorigin = 'use-credentials';
        imageNode.dataset.src = baseURL + encodeCFURIComponent(files[index].file_name);
        imageNode.dataset.alt = document.getElementById('title').innerHTML;
        imageNode.dataset.xhrParam = index;
        imageNode.dataset.authenticationToken = epInfo.authentication_token;
        imageNode.addEventListener('click', function() {
            let param = {
                src: baseURL + encodeCFURIComponent(files[index].file_name),
                xhrParam: index,
                title: document.getElementById('title').innerHTML,
                authenticationToken: epInfo.authentication_token
            };
            document.cookie = 'local-image-param='+encodeURIComponent(JSON.stringify(param))+';max-age=10;path=/' + (debug?'':';domain=.featherine.com;secure;samesite=strict');
            if (debug) {
                window.location.href = 'image.html';
            } else {
                window.open (topURL + '/image');
            }
        });
        imageNode.addEventListener('contextmenu', event => event.preventDefault());
        mediaHolder.appendChild(imageNode);
    }

    lazyloadInitialize ();
}

function showPlaybackError (detail) {
    showMediaMessage (message.template.media.title.defaultError, '<p>再生中にエラーが発生しました' + message.template.media.body.defaultErrorSuffix + (detail?('<br>Error detail: '+detail):'') + '</p>', true);
}

function showHLSCompatibilityError () {
    showMediaMessage(message.template.media.title.incompatible, '<p>お使いのブラウザは、再生に最低限必要なMedia Source Extensions（MSE）およびHTTP Live Streaming（HLS）に対応していません。' + message.template.media.body.incompatibleSuffix + '</p>', true);
}

function showCodecCompatibilityError () {
    showMediaMessage(message.template.media.title.incompatible, '<p>お使いのブラウザは、再生に必要なAVC/AACコーデックに対応していません。' + message.template.media.body.incompatibleSuffix + 'Linuxをお使いの方は、対応するメディアコーデックパッケージのインストールをお試しください。</p>', true);
}

function showAttachError () {
    showMediaMessage(message.template.media.title.defaultError, '<p>メディアを添付できません。ページを再読み込みして、もう一度お試しください。' + message.template.media.body.defaultErrorSuffix + '</p>', true);
}

function showMediaMessage (title, messageTxt, error) {
    var messageTitle = document.getElementById('message-title');
    changeColor(messageTitle, error?"red":"orange");
    messageTitle.innerHTML = title;
    if (error) {
        document.getElementById('media-holder').classList.add('hidden');
        destroyAll();
    }
    document.getElementById('message-body').innerHTML = messageTxt;
    document.getElementById('message').classList.remove('hidden');
}

function goToEP (dest_series, dest_ep) {
    var url;
    if (debug) {
        url = 'bangumi.html'+'?series='+dest_series+(dest_ep==1?'':('&ep='+dest_ep));
    } else {
        url = topURL+'/bangumi/'+dest_series+(dest_ep==1?'':('?ep='+dest_ep));
    }
    window.location.href = url;
}

function addAccordionEvent (acc) {
    acc.addEventListener("click", function() {
        this.classList.toggle("active");
        var panel = this.nextElementSibling;
        if (panel.style.maxHeight) {
            panel.style.maxHeight = null;
            panel.style.padding = '0px 1em';
        } else {
            panel.style.maxHeight = getContentBoxHeight(panel) + "px";
            panel.style.padding = '1em';
        }
    });
}

function displayChapters (chapters) {

    //display chapters
    var chapterLength = chapters.length;
    var accordion = document.createElement('button');
    accordion.classList.add('accordion');
    accordion.innerHTML = 'CHAPTERS';

    var accordionPanel = document.createElement('div');
    accordionPanel.classList.add('panel');

    var video = mediaInstances[0].media;

    for (var i = 0; i < chapterLength; i++) {
        let chapter = document.createElement('p');
        let timestamp = document.createElement('span');
        let cueText = document.createTextNode('\xa0\xa0' + chapters[i][0]);
        let startTime = chapters[i][1];
        timestamp.innerHTML = secToTimestamp (startTime);
        timestamp.addEventListener ('click', function () {
            mediaInstances[0].seek(startTime);
            mediaInstances[0].controls.focus();
        });
        chapter.appendChild(timestamp);
        chapter.appendChild(cueText);
        chapter.className = 'inactive-chapter';
        accordionPanel.appendChild(chapter);
    }

    var chaptersNode = document.createElement('div');
    chaptersNode.classList.add('chapters');
    chaptersNode.appendChild(accordion);
    chaptersNode.appendChild(accordionPanel);
    addAccordionEvent(accordion);
    document.getElementById('media-holder').appendChild(chaptersNode);

    var updateChapterDisplay = function () {
        var chapterElements = accordionPanel.getElementsByTagName('p');
        var currentTime = video.currentTime;
        for (var i = 0; i < chapterLength; i++) {
            if (currentTime >= chapters[i][1]) {
                if (i == chapterLength-1) {
                    chapterElements[i].className = 'current-chapter';
                } else if (currentTime < chapters[i+1][1]) {
                    chapterElements[i].className = 'current-chapter';  
                } else {
                    chapterElements[i].className = 'inactive-chapter';
                }
            } else {
                chapterElements[i].className = 'inactive-chapter';
            }
        }
    };

    //video.addEventListener ('timeupdate', updateChapterDisplay);
    setInterval (updateChapterDisplay, 500);
    video.addEventListener ('play', updateChapterDisplay);
    video.addEventListener ('pause', updateChapterDisplay);
    video.addEventListener ('seeking', updateChapterDisplay);
    video.addEventListener ('seeked', updateChapterDisplay);
}

function addDownloadAccordion () {
    if (browser.IS_MOBILE) {
        return;
    }

    var accordion = document.createElement('button');
    accordion.classList.add('accordion');
    accordion.innerHTML = 'DOWNLOAD';

    var accordionPanel = document.createElement('div');
    accordionPanel.classList.add('panel');

    accordionPanel.innerHTML = '<ul>' +
        '<li>まず、下の「ダウンロード」ボタンをクリックして、必要なツールやスクリプトが入ったZIPファイルをダウンロードしてください。</li>' +
        '<li>このZIPファイルをダウンロードした後、解凍してREADME.txtに記載されている手順に従ってください。</li>' +
        '<li>ZIPファイルをダウンロード後、5分以内にスクリプトを起動してください。</li>' +
        '<li>インターネット接続が良好であることを確認してください。</li>' +
        '<li>IDMなどの拡張機能を使用している場合、ZIPファイルのダウンロードに問題が発生する可能性があります。ダウンロードする前に、そのような拡張機能を無効にしてください。</li>' +
    '</ul>';

    var downloadButton = document.createElement('button');
    downloadButton.id = 'download-button';
    downloadButton.classList.add('button');
    downloadButton.innerHTML = 'ダウンロード';
    var warning = document.createElement('p');
    warning.classList.add('color-red');
    warning.classList.add('hidden');
    warning.innerHTML = 'お使いの端末はダウンロードに対応していません。';
    accordionPanel.appendChild(warning);
    downloadButton.addEventListener('click', function () {
        sendServerRequest('start_download.php', {
            callback: function (response) {
                if (response == 'UNAVAILABLE') {
                    warning.classList.remove('hidden');
                } else {
                    window.location.replace(response);
                }
            },
            content: "token="+epInfo.authentication_token+'&format='+formatIndex
        });
    });
    accordionPanel.appendChild(downloadButton);

    var downloadElem = document.createElement('div');
    downloadElem.classList.add('download');
    downloadElem.appendChild(accordion);
    downloadElem.appendChild(accordionPanel);
    addAccordionEvent(accordion);
    document.getElementById('content').appendChild(downloadElem);
}


function updateURLParam (key, value) {
    var url;
    var separator = '?';
    if (debug) {
        url = 'bangumi.html'+'?series='+seriesID+(epIndex==0?'':('&ep='+(epIndex+1)));
        separator = '&';
    } else {
        url = topURL + '/bangumi/'+seriesID;
        if (epIndex!=0) {
            url += '?ep='+(epIndex+1);
            separator = '&';
        }
    }

    if (key == 'format') {
        url += (value==1?'':(separator+'format='+value));
    }

    history.replaceState(null, '', url);
}

function addConsecutiveEventListener (elem, event, callback, count, timeInterval) {
    if (count < 2) {
        throw 'addConsecutiveEventListener must listen for more than 1 consecutive events.';
    }
    var currentCount = 0;
    var allowed = false;
    elem.addEventListener (event, function () {
        if (currentCount+1 == count && allowed) {
            currentCount = 0;
            allowed = false;
            callback();
        } else if (!allowed) {
            allowed = true;
            currentCount = 1;
            setTimeout (function () {
                allowed = false;
                currentCount = 0;
            }, timeInterval);
        } else if (allowed) {
            currentCount ++;
        }
    });
}

function destroyAll () {
    for (var i = 0; i < mediaInstances.length; i++) {
        mediaInstances[i].destroy();
    }
}


function styleEPSelector () {
    if (EPSelectorHeight/window.innerHeight > 0.50) {
        foldEPSelector();
    } else {
        unfoldEPSelector();
    }
}

function foldEPSelector () {
    var showMoreButton = document.getElementById('show-more-button');
    var epButtonWrapper = document.getElementById('ep-button-wrapper');
    if (!showMoreButton.classList.contains('hidden')) {
        if (epButtonWrapper.classList.contains('expanded')) {
            epButtonWrapper.style.maxHeight = EPSelectorHeight + "px";
        }
        return;
    }
    showMoreButton.innerHTML = showMoreButtonClippedText;
    epButtonWrapper.style.maxHeight = "50vh";
    epButtonWrapper.classList.remove('expanded');
    showMoreButton.classList.remove('hidden');
}

function unfoldEPSelector () {
    var showMoreButton = document.getElementById('show-more-button');
    var epButtonWrapper = document.getElementById('ep-button-wrapper');
    if (showMoreButton.classList.contains('hidden')) {
        return;
    }
    epButtonWrapper.style.maxHeight = null;
    epButtonWrapper.classList.remove('expanded');
    showMoreButton.classList.add('hidden');
}

function toggleEPSelector () {
    var epButtonWrapper = document.getElementById('ep-button-wrapper');
    var showMoreButton = document.getElementById('show-more-button');
    const CLIPPED = !epButtonWrapper.classList.contains('expanded');
    showMoreButton.innerHTML = CLIPPED ? showMoreButtonExpandedText : showMoreButtonClippedText;
    if (CLIPPED) {
        epButtonWrapper.style.maxHeight = EPSelectorHeight + "px";
    } else {
        epButtonWrapper.style.maxHeight = "50vh";
    }
    epButtonWrapper.classList.toggle('expanded');
}

function getContentBoxHeight (elem) {
    function getCSSProperty(elem, property) { 
        return parseFloat(window.getComputedStyle(elem, null).getPropertyValue(property)); 
    }

    var height = elem.scrollHeight;
    height -= getCSSProperty(elem, 'padding-top') + getCSSProperty(elem, 'padding-bottom');
    return height;
}