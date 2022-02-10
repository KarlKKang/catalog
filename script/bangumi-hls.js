// JavaScript Document

window.addEventListener("load", function(){
	
	var mainLocal = main;

	var debug = mainLocal.debug;
	var navListeners = mainLocal.navListeners;
	var redirect = mainLocal.redirect;
	var appearanceSwitching = mainLocal.appearanceSwitching;
	var topURL = mainLocal.topURL;
	var sendServerRequest = mainLocal.sendServerRequest;
	var showMessage = mainLocal.showMessage;
	var changeColor = mainLocal.changeColor;
	var getURLParam = mainLocal.getURLParam;
	var onScreenConsoleOutput = mainLocal.onScreenConsoleOutput;
	var secToTimestamp = mainLocal.secToTimestamp;
	
	
	if (!window.location.href.startsWith('https://featherine.com/bangumi') && !debug) {
		window.location.href = redirect ('https://featherine.com/bangumi');
		return;
	}
	
	appearanceSwitching();
	
	// DIST NOTE: insert videojs here
	// DIST NOTE: insert hls.js here
	// DIST NOTE: insert browser detection here
    // DIST NOTE: insert videojs_mod here

    var mediaInstances = [];
    var token;
    var onScreenConsole = false;

    var seriesID = getURLParam ('series');
    if (seriesID == null) {
        window.location.href = topURL;
        return;
    } else {
        if (!/^[a-zA-Z0-9~_-]+$/.test(seriesID)) {
            window.location.href = topURL;
            return;
        }
    }

    var epIndex = getURLParam ('ep');
    var new_url = 'bangumi'+(debug?'.html':'')+'?series='+seriesID+'&ep=1';
    if (epIndex == null) {
        window.location.href = new_url;
        return;
    } else {
        epIndex = parseInt (epIndex);
        if (isNaN(epIndex) || epIndex<1) {
            window.location.href = new_url;
            return;
        }
        epIndex--;
    }

    var formatIndex = getURLParam ('format');
    if (formatIndex != null) {
        formatIndex = parseInt (formatIndex);
        if (isNaN(formatIndex) || formatIndex<1) {
            formatIndex = 1;
        }
        formatIndex--;
    }

    sendServerRequest('get_ep.php', {
        callback: function (response) {
            var ep;
            try {
                ep = JSON.parse(response);
            } catch (e) {
                showMessage ({message: 'サーバーが無効な応答を返しました。このエラーが続く場合は、管理者にお問い合わせください。', url: topURL});
                return;
            }
            updatePage (ep);
        },
        content: "series="+seriesID+"&ep="+epIndex+((formatIndex==null)?'':('&format='+formatIndex))
    });

    function updatePage (ep) {
		navListeners();
        document.body.classList.remove("hidden");

        token = ep.token;

        var title =  ep.title;
        var titleElem = document.getElementById('title');
        titleElem.innerHTML = title;

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

        document.title = title + ' | featherine';

        updateEPSelector (ep.series);
        updateSeasonSelector (ep.seasons);

        if (ep.age_restricted) {
			var warningParent = document.getElementById('warning');
			var warningTitle = document.getElementById('warning-title');
			var warningBody = document.getElementById('warning-body');
            changeColor (warningTitle, 'red');
            if (ep.age_restricted.toLowerCase() == 'r15+') {
                warningTitle.innerHTML = '「R15+指定」<br>年齢認証';
            } else if (ep.age_restricted.toLowerCase() == 'r18+') {
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
                callback: function (response) {
                    if (response != 'APPROVED') {
                        showMessage ({url: topURL});
                        return false;
                    }
                },
                content: "token="+ep.token
            });
        }, 60*1000);

        /////////////////////////////////////////////Add Media/////////////////////////////////////////////
        var type = ep.type;

        if (type == 'video') {
            updateVideo (ep.file);
        } else if (type == 'audio') {
            updateAudio (ep.file);
        } else {
            updateImage (ep.file);
        }
    }

    function updateEPSelector (series) {
        var epButtonWrapper = document.createElement('div');
        epButtonWrapper.id = 'ep-button-wrapper';
        for (var i = 0; i < series.length; i++) {
            let epButton = document.createElement('div');
            let epText = document.createElement('p');

            epText.innerHTML = series[i];

            if (epIndex == i) {
                epButton.classList.add('current-ep');
            }

            let targetEP = i+1;
            epButton.appendChild(epText);
            epButton.addEventListener('click', function () {goToEP(seriesID, targetEP);});

            epButtonWrapper.appendChild(epButton);
        }

        document.getElementById('ep-selector').appendChild(epButtonWrapper);

        if (epButtonWrapper.clientHeight/window.innerHeight > 0.50) {
            var showMoreButton = document.createElement('p');
            showMoreButton.id = 'show-more-button';
            showMoreButton.innerHTML = 'すべてを見る <span class="symbol">&#xE972;</span>';
            showMoreButton.addEventListener('click', toggleEpSelector);

            document.getElementById('ep-selector').appendChild(showMoreButton);
            epButtonWrapper.style.maxHeight = "50vh";
            showMoreButton.classList.add('clipped');
        }
    }

    function updateSeasonSelector (seasons) {
        var seasonButtonWrapper = document.createElement('div');
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
            document.getElementById('season-selector').appendChild(seasonButtonWrapper);
        } else {
            document.getElementById('season-selector').remove();
        }
    }

    function updateVideo (file) {
        var contentContainer = document.getElementById('content');
        if (file.title!='') {
            let title = document.createElement('p');
            title.setAttribute('class', 'sub-title');
            title.classList.add('center-align');
            title.innerHTML = file.title;
            contentContainer.insertBefore(title, document.getElementById('message'));
        }

        var formats = file.formats;

        var formatSelector = document.createElement('div');
        formatSelector.setAttribute('id', 'format-selector');

        var selectMenu = document.createElement('select');
        selectMenu.addEventListener("change", function () {
            formatSwitch();
        });

        if (formatIndex == null)
            formatIndex = 0;
        else if (formatIndex >= formats.length) {
            formatIndex = 0;
            updateURLParam ('format', 1);
        }

        for (var i = 0; i < formats.length; i++) {
            var format = formats[i];
            var option = document.createElement('option');

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
            videoJS = videoJS.cloneNode(true);
            this.dispose();
            mediaInstances.push(videojs_mod (videoJS, {}));
            mediaHolder.appendChild(videoJS);

            addVideoNode (file.url, {/*, currentTime: timestampParam*/});
            if (file.chapters != '') {
                displayChapters (file.chapters);
            }
            addDownloadAccordion();
            addAccordionEvent();
            //updateURLTimestamp();
        });
    }

    function updateAudio (file) {

        var contentContainer = document.getElementById('content');
        var counter = 0;

        if (file.info.album_title!='') {
            let albumTitle = document.createElement('p');
            albumTitle.setAttribute('class', 'sub-title');
            albumTitle.classList.add('center-align');
            albumTitle.innerHTML = file.info.album_title;
            contentContainer.insertBefore(albumTitle, document.getElementById('message'));
            if (file.info.album_artist!='') {
                let albumArtist = document.createElement('p');
                albumArtist.setAttribute('class', 'artist');
                albumArtist.classList.add('center-align');
                albumArtist.innerHTML = file.info.album_artist;
                contentContainer.insertBefore(albumArtist, document.getElementById('message'));
            }
        } else if (file.info.album_artist!='') {
            let titleElem = document.getElementById('title');
            let artistElem = document.createElement('span');
            artistElem.setAttribute('class', 'artist');
            artistElem.innerHTML = '<br/>' + file.info.album_artist;
            titleElem.appendChild(artistElem);
        }

        //smooth progress bar scrubbing https://github.com/videojs/video.js/issues/4460
        const SeekBar = videojs.getComponent('SeekBar');

        SeekBar.prototype.getPercent = function getPercent() {
            const time = this.player_.currentTime();
            const percent = time / this.player_.duration();
            return percent >= 1 ? 1 : percent;
        };

        SeekBar.prototype.handleMouseMove = function handleMouseMove(event) {
            let newTime = this.calculateDistance(event) * this.player_.duration();
            if (newTime === this.player_.duration()) {
                newTime = newTime - 0.1;
            }
            this.player_.currentTime(newTime);
            this.update();
        };
        //
		
		var mediaHolder = document.createElement('div');
        mediaHolder.id = 'media-holder';
        contentContainer.appendChild(mediaHolder);

        var configVideoJSTemplate = {
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

        var i;

        for (i = 0; i < file.list.length; i++) {
            let index = i;

            let audioNode = document.createElement('audio');
            let subtitle = document.createElement('p');
            subtitle.setAttribute('class', 'sub-title');
            let format = document.createElement('span');

            audioNode.id = 'track'+index;

            audioNode.classList.add("vjs-default-skin");
            audioNode.classList.add("video-js");
            audioNode.setAttribute('lang', 'en');

            //subtitle
            if (file.list[i].title != '') {
                subtitle.innerHTML = file.list[i].title;

                if (file.list[i].artist != '') {
                    let artist = document.createElement('span');
                    artist.setAttribute('class', 'artist');
                    artist.innerHTML = '／' + file.list[i].artist;
                    subtitle.appendChild(artist);
                }
            }

            //format
            if (file.list[i].format != '') {
                if (subtitle.innerHTML != '')
                    subtitle.innerHTML += '<br />';

                format.setAttribute('class', 'format');
                format.innerHTML = file.list[i].format;

                let samplerate = file.list[i].samplerate;
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

                    let bitdepth = file.list[i].bitdepth;
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
                subtitle.appendChild(format);
            }

            mediaHolder.appendChild(subtitle);
            mediaHolder.appendChild(audioNode);
			
			var isMp3 = (file.list[index].format.toLowerCase() == 'mp3');
			
			let configVideoJS = configVideoJSTemplate;
			if (USE_MSE && !isMp3) {
				configVideoJS.html5 = {
					vhs: {
						overrideNative: true,
						withCredentials: true
					},
					nativeAudioTracks: false,
					nativeVideoTracks: false
				};
				configVideoJS.crossOrigin = 'use-credentials';
			}

            let videoJSAudio = videojs(audioNode, configVideoJS, function () {

                let url = file.list[index].url;

                if (file.list[index].flac_fallback_url != '' && !CAN_PLAY_ALAC) {
                    url = file.list[index].flac_fallback_url;
                    format.innerHTML = format.innerHTML.replace('ALAC', 'FLAC');
                    format.innerHTML = format.innerHTML.replace('32bit', '24bit');
                }
				
				if (isMp3 || CAN_PLAY_HLS) {
					let oldAudioNode = document.getElementById('track' + index);
					audioNode = oldAudioNode.cloneNode(true);
					oldAudioNode.id = '';
					mediaInstances[index] = videojs_mod (audioNode, {audio: true});

					oldAudioNode.parentNode.insertBefore(audioNode, oldAudioNode);
					videoJSAudio.dispose();
				}

                if (USE_MSE) {
					if (isMp3) {
						if (IS_CHROMIUM) {
							var messageTitle = document.getElementById('message-title');
							changeColor (messageTitle, 'orange');
							messageTitle.innerHTML = '不具合があります';
							document.getElementById('message-body').innerHTML = '<p>Chromiumベースのブラウザで、MP3ファイルをシークできない問題があります。SafariやFirefoxでお試しいただくか、ファイルをダウンロードしてローカルで再生してください。ご迷惑をおかけして大変申し訳ございませんでした。</p>';
							document.getElementById('message').classList.remove('hidden');
						}
						let hls = new Hls(configHls);
						hls.on(Hls.Events.ERROR, function (event, data) {
							if (data.fatal) {
								showPlaybackError('Index ' + index + ': ' + data.detail);
							}
						});
						hls.on(Hls.Events.MANIFEST_PARSED, function () {
							counter ++;
							if (counter == file.list.length) {
								hlsAudioReady();
							}
						});
						mediaInstances[index].attachHls(hls);
						hls.loadSource(url);
					} else {
						mediaInstances[index] = videoJSAudio;
					
						counter ++;
						if (counter == file.list.length) {
							videoJSAudioReady();
						}

						videoJSAudio.on('error', function() {
							showPlaybackError('Index ' + index + ': ' + 'videojs: '+JSON.stringify(videoJSAudio.error()));
							videoJSAudio.dispose();
						});

						videoJSAudio.src({
							src: url,
							type: 'application/x-mpegURL'
						});

						videoJSAudio.volume(1);
					}
                } else if (CAN_PLAY_HLS) {
					let audio = mediaInstances[index].media;
					audio.volume = 1;
					
                    audio.addEventListener('error', function () {showPlaybackError();});
                    audio.setAttribute ('crossorigin', 'use-credentials');
                    audio.addEventListener('loadedmetadata', function () {
                        counter ++;
                        if (counter == file.list.length) {
                            hlsAudioReady();
                        }
                    });
                    audio.src = url;
                    audio.load();
                } else {
                    showCompatibilityError ();
                }
            });

        }

        addDownloadAccordion();
        addAccordionEvent();
		
		function hlsAudioReady () {
			for (i = 0; i < mediaInstances.length; i++) {
                let index = i;
                mediaInstances[index].media.addEventListener('play', function () {
                    for (var j = 0; j < mediaInstances.length; j++) {
                        if (j != index) {
                            mediaInstances[j].pause();
                        }
                    }
                });
                mediaInstances[index].media.addEventListener('ended', function () {
                    if (index != mediaInstances.length-1) {
                        mediaInstances[index+1].play();
                    }
                });
            }
		}
		
		function videoJSAudioReady () {
			for (i = 0; i < mediaInstances.length; i++) {
                let index = i;
                mediaInstances[index].on('play', function () {
                    for (var j = 0; j < mediaInstances.length; j++) {
                        if (j != index) {
                            mediaInstances[j].pause();
                        }
                    }
                });
                mediaInstances[index].on('ended', function () {
                    if (index != mediaInstances.length-1) {
                        mediaInstances[index+1].play();
                    }
                });
            }
		}
    }

    function updateImage (file) {
        var mediaHolder = document.createElement('div');
        mediaHolder.id = 'media-holder';
        document.getElementById('content').appendChild(mediaHolder);

        for (var i = 0; i < file.length; i++) {

            if (file[i].tag != '') {
                let subtitle = document.createElement('p');
                subtitle.setAttribute('class', 'sub-title');
                subtitle.innerHTML = file[i].tag;
                mediaHolder.appendChild(subtitle);
            }

            let imageNode = document.createElement('div');
            let overlay = document.createElement('div');
            let url = file[i].url;

            overlay.classList.add('overlay');
            imageNode.appendChild(overlay);

            imageNode.classList.add('lazyload');
            imageNode.dataset.crossorigin = 'use-credentials';
            imageNode.dataset.src = url;
            imageNode.dataset.alt = document.getElementById('title').innerHTML;
            imageNode.addEventListener('click', function() {
                let param = {
                    url: url,
                    title: document.getElementById('title').innerHTML,
                    token: token
                };
                document.cookie = 'image-param='+encodeURIComponent(JSON.stringify(param))+';max-age=30;path=/' + (debug?'':';domain=.featherine.com;secure;samesite=strict');
                if (debug) {
                    window.location.href = 'image.html';
                } else {
                    window.open ('image');
                }
            });
            imageNode.addEventListener('contextmenu', event => event.preventDefault());
            mediaHolder.appendChild(imageNode);
        }

        lazyloadInitialize ();
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
                addVideoNode (response, {currentTime: currentTime, play: !paused});
            },
            content: "token="+token+"&format="+selectedFormat
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
		if (mediaInstances[0].hlsInstance) {
            mediaInstances[0].hlsInstance.destroy();
        }
		
        let video = mediaInstances[0].media;

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

        if (USE_MSE) {

            var config = {
                enableWebVTT: false,
                enableIMSC1: false,
                enableCEA708Captions: false,
                lowLatencyMode: false,
                enableWorker: true,
                maxFragLookUpTolerance: 0.001,
                testBandwidth: false,
                backBufferLength: 0,
                maxBufferLength: 30,
                maxMaxBufferLength: 60,
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

			mediaInstances[0].attachHls(hls);
            hls.loadSource(url);
        } else if (CAN_PLAY_HLS) {
            video.addEventListener('error', function () {showPlaybackError ();});
            video.setAttribute ('crossorigin', 'use-credentials');
            video.addEventListener('loadedmetadata', function () {
                videoReady ();
            });
            video.src = url;
            video.load();
        } else {
            showCompatibilityError ();
        }
    }

    function showPlaybackError (detail) {
		var messageTitle = document.getElementById('message-title');
        changeColor (messageTitle, 'red');
		messageTitle.innerHTML = 'エラーが発生しました';
        document.getElementById('media-holder').classList.add('hidden');
        document.getElementById('message-body').innerHTML = '<p>再生中にエラーが発生しました。後ほどもう一度お試しいただくか、それでも問題が解決しない場合は管理者にお問い合わせください。</p>'+(detail?('<p>Error detail: '+detail+'</p>'):'');
        document.getElementById('message').classList.remove('hidden');
    }

    function showCompatibilityError () {
		var messageTitle = document.getElementById('message-title');
        changeColor (messageTitle, 'red');
		messageTitle.innerHTML = 'エラーが発生しました';
        document.getElementById('media-holder').classList.add('hidden');
        document.getElementById('message-body').innerHTML = '<p>お使いのブラウザやデバイスはHLSに対応していません。HLSに対応している一般的なブラウザを以下に示します。</p>' + 
        '<ul>' +
            '<li><p>Chrome 39+ for Android</p></li>' +
            '<li><p>Chrome 39+ for Desktop</p></li>' +
            '<li><p>Firefox 41+ for Android</p></li>' +
            '<li><p>Firefox 42+ for Desktop</p></li>' +
            '<li><p>Edge for Windows 10+</p></li>' +
            '<li><p>Safari 6.0+ for macOS, iOS and iPadOS</p></li>' +
        '</ul>';
        document.getElementById('message').classList.remove('hidden');
    }

    function goToEP (dest_series, dest_ep) {
        var url = 'bangumi'+(debug?'.html':'')+'?series='+dest_series+'&ep='+dest_ep;
        window.location.href = url;
    }

    function toggleEpSelector () {
        let clipped = document.getElementById('show-more-button').classList.contains('clipped');
        document.getElementById('show-more-button').innerHTML = clipped ? '非表示にする <span class="symbol">&#xE971;</span>' : 'すべてを見る <span class="symbol">&#xE972;</span>';
        if (clipped) {
            document.getElementById('ep-button-wrapper').style.maxHeight = document.getElementById('ep-button-wrapper').scrollHeight + "px";
        } else {
            document.getElementById('ep-button-wrapper').style.maxHeight = "50vh";
        }
        document.getElementById('show-more-button').classList.toggle('clipped');
    }

    function addAccordionEvent () {
        var acc = document.getElementsByClassName("accordion");
        var i;

        for (i = 0; i < acc.length; i++) {
            acc[i].addEventListener("click", function() {
                this.classList.toggle("active");
                var panel = this.nextElementSibling;
                if (panel.style.maxHeight) {
                    panel.style.maxHeight = null;
                    panel.style.padding = '0px 1em';
                } else {
                    panel.style.maxHeight = panel.scrollHeight + "px";
                    panel.style.padding = '1em';
                }
            });
        }
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
                if (video.currentTime <= startTime) {
                    mediaInstances[0].seekingForward = true;
                }
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
        if (!DOWNLOAD_SUPPORTED) {
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
						window.location.href = response;
					}
                },
                content: "token="+token+((formatIndex==null)?'':('&format='+formatIndex))
            });
        });
        accordionPanel.appendChild(downloadButton);

        var downloadElem = document.createElement('div');
        downloadElem.classList.add('download');
        downloadElem.appendChild(accordion);
        downloadElem.appendChild(accordionPanel);
        document.getElementById('content').appendChild(downloadElem);
    }


    function updateURLParam (key, value) {
        var url = 'bangumi'+(debug?'.html':'')+'?series='+seriesID+'&ep='+(epIndex+1);
        var currentFormat = getURLParam ('format');
        var currentTimestamp = getURLParam ('timestamp');
        if (key == 'format') {
            url += '&format='+value+((currentTimestamp==null)?'':('&timestamp='+currentTimestamp));
        } else if (key == 'timestamp') {
            url += ((currentFormat==null)?'':('&format='+currentFormat))+'&timestamp='+value;
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
	
});