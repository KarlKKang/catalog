// JavaScript Document
window.addEventListener("load", function(){
	var mainLocal = main;
	var debug = mainLocal.debug;
	var navListeners = mainLocal.navListeners;
	var redirect = mainLocal.redirect;
	var appearanceSwitching = mainLocal.appearanceSwitching;
	var topURL = mainLocal.topURL;
	var loginURL = mainLocal.loginURL;
	var sendServerRequest = mainLocal.sendServerRequest;
	var showMessage = mainLocal.showMessage;
	var getURLParam = mainLocal.getURLParam;
	var cdnURL = mainLocal.cdnURL;
	
	if (!window.location.href.startsWith('https://featherine.com') && !debug) {
		window.location.replace(topURL);
		return;
	}
	
	appearanceSwitching();
	
    var offset=0;

    if (getURLParam ('series') != null) {
        window.location.replace(redirect(debug?'bangumi.html':(topURL+'/bangumi/')));
        return;
    }
	
	var keywords = '';
	updateKeywords ();
	
	var pivot = '';

    sendServerRequest('get_series.php', {
        callback: function (response) {
            try {
                var series = JSON.parse(response);
            } catch (e) {
                showMessage ({message: 'サーバーが無効な応答を返しました。このエラーが続く場合は、管理者にお問い合わせください。', url: loginURL, logout: true});
                return;
            }
            document.addEventListener('scroll', infiniteScrolling);
            window.addEventListener("resize", infiniteScrolling);
            showSeries (series);
			navListeners();
			document.body.classList.remove("hidden");
        }, 
        content: keywords+"offset=0"
    });

    document.getElementById('search-bar').getElementsByClassName('icon')[0].addEventListener('click', function () {
        search ();
    });
    document.getElementById('search-bar').getElementsByTagName('input')[0].addEventListener('keyup', function () {
        if (event.key === "Enter") {
            search ();
        }
    });

    function showSeries (series) {
        offset ++;
        for (var i=0; i<series.length-1; i++) {

            let seriesNode = document.createElement('div');
            let thumbnailNode = document.createElement('div');
            let overlay = document.createElement('div');
            let titleNode = document.createElement('p');

            seriesNode.appendChild(thumbnailNode);
            seriesNode.appendChild(titleNode);

            overlay.classList.add('overlay');
            thumbnailNode.appendChild(overlay);
            thumbnailNode.classList.add('lazyload');
            thumbnailNode.dataset.src = cdnURL + '/thumbnails/' + series[i].thumbnail;
            thumbnailNode.dataset.alt = 'thumbnail: ' + series[i].thumbnail;
            titleNode.innerHTML = series[i].title;

            let index = i;
            seriesNode.addEventListener("click", function(){goToSeries (series[index].id);});
            seriesNode.classList.add('series');

            document.getElementById('container').appendChild(seriesNode);
        }
		
		offset = series[series.length-1];
		
		if (offset != 'EOF' && keywords != '') {
			pivot = 'pivot=' + series[series.length-2].id + '&';
		} else {
			pivot = '';
		}

        lazyloadInitialize ();

        document.getElementById('position-detector').classList.remove('loading');
        infiniteScrolling ();
    }

    function goToSeries (id) {
		var url;
		if (debug) {
			url = 'bangumi.html'+'?series='+id;
		} else {
			url = topURL+'/bangumi/'+id;
		}
        window.location.href = url;
    }

    function search () {
        document.getElementById('position-detector').classList.add('loading');

        var searchBarInput = document.getElementById('search-bar').getElementsByTagName('input')[0].value.substring(0, 50);
		
		if (searchBarInput == '') {
            keywords = "";
			history.pushState(null, '', topURL);
        } else {
            keywords = "keywords="+encodeURIComponent(searchBarInput);
			history.pushState(null, '', topURL + '?' + keywords);
			keywords += '&';
        }
		
		requestSearchResults ();
    }
	
	function requestSearchResults () {
		sendServerRequest('get_series.php', {
            callback: function (response) {
                try {
                    var series = JSON.parse(response);
                } catch (e) {
                    showMessage ({message: 'サーバーが無効な応答を返しました。このエラーが続く場合は、管理者にお問い合わせください。', url: loginURL, logout: true});
                    return;
                }
				document.getElementById('container').classList.add('transparent');
				setTimeout (function () {
					document.getElementById('container').innerHTML='';
					offset = 0;
					showSeries (series);
					document.getElementById('container').classList.remove('transparent');
				}, 400);
            },
            content: keywords+"offset=0"
        });
	}
	
	window.addEventListener('popstate', function () {
		updateKeywords ();
		requestSearchResults ();
	});
	
	function updateKeywords () {
		keywords = getURLParam ('keywords');
		if (keywords == null) {
			keywords = "";
			document.getElementById('search-bar').getElementsByTagName('input')[0].value = '';
		} else {
			keywords = decodeURIComponent(keywords).substring(0, 50);
			document.getElementById('search-bar').getElementsByTagName('input')[0].value = keywords;
			keywords = "keywords=" + encodeURIComponent(keywords) + "&";
		}
	}

    function infiniteScrolling () {
        var detector = document.getElementById('position-detector');
        var boundingRect = detector.getBoundingClientRect();
        var viewportHeight = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

        if (boundingRect.top-256-24<=viewportHeight*1.5 && offset != 'EOF' && !detector.classList.contains('loading')) {
            detector.classList.add('loading');

            sendServerRequest('get_series.php', {
                callback: function (response) {
                    try {
                        var series = JSON.parse(response);
                    } catch (e) {
                        showMessage ({message: 'サーバーが無効な応答を返しました。このエラーが続く場合は、管理者にお問い合わせください。', url: loginURL, logout: true});
                        return;
                    }
                    showSeries (series);
                },
                content: keywords + pivot + "offset=" + offset
            });
        }
    }
});