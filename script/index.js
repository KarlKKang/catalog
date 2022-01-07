// JavaScript Document
window.addEventListener("load", function(){
	var mainLocal = main;
	var debug = mainLocal.debug;
	var navListeners = mainLocal.navListeners;
	var redirect = mainLocal.redirect;
	var appearanceSwitching = mainLocal.appearanceSwitching;
	var loginURL = mainLocal.loginURL;
	var sendServerRequest = mainLocal.sendServerRequest;
	var showMessage = mainLocal.showMessage;
	var getURLParam = mainLocal.getURLParam;
	
	if (!window.location.href.startsWith('https://featherine.com') && !debug) {
		window.location.href = redirect ('https://featherine.com');
		return;
	}
	
	appearanceSwitching();
	navListeners();
	
    var request='';
    var offset=0;

    if (getURLParam ('ep') != null) {
        window.location.href = redirect('bangumi'+(debug?'.html':''));
        return;
    }

    sendServerRequest('get_series.php', {
        callback: function (response) {
            try {
                var series = JSON.parse(response);
            } catch (e) {
                showMessage ('エラーが発生しました', 'red', 'サーバーが無効な応答を返しました。', loginURL, true);
                return;
            }
            document.body.classList.remove("hidden");
            document.addEventListener('scroll', infiniteScrolling);
            window.addEventListener("resize", infiniteScrolling);
            showSeries (series);
        }, 
        content: "offset=0"
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
        for (var i=0; i<series.length; i++) {
            if (series[i] == 'EOF') {
                offset='EOF';
                break;
            }

            let seriesNode = document.createElement('div');
            let thumbnailNode = document.createElement('div');
            let overlay = document.createElement('div');
            let titleNode = document.createElement('p');

            seriesNode.appendChild(thumbnailNode);
            seriesNode.appendChild(titleNode);

            overlay.classList.add('overlay');
            thumbnailNode.appendChild(overlay);
            thumbnailNode.classList.add('lazyload');
            thumbnailNode.dataset.src = series[i].thumbnail;
            thumbnailNode.dataset.alt = 'thumbnail: ' + series[i].thumbnail;
            titleNode.innerHTML = series[i].title;

            let index = i;
            seriesNode.addEventListener("click", function(){goToSeries (series[index].id);});
            seriesNode.classList.add('series');

            document.getElementById('container').appendChild(seriesNode);
        }

        lazyloadInitialize ();

        document.getElementById('position-detector').classList.remove('loading');
        infiniteScrolling ();
    }

    function goToSeries (id) {
        var url = 'bangumi'+(debug?'.html':'')+'?series='+id+'&ep=1';
        window.location.href = url;
    }

    function search () {
        document.getElementById('position-detector').classList.add('loading');

        document.getElementById('container').classList.add('transparent');
        var keywords = document.getElementById('search-bar').getElementsByTagName('input')[0].value;

        setTimeout (function () {
            if (keywords == '') {
                request = "";
            } else {
                request = "keywords="+encodeURIComponent(keywords) + '&';
            }

            sendServerRequest('get_series.php', {
                callback: function (response) {
                    try {
                        var series = JSON.parse(response);
                    } catch (e) {
                        showMessage ('エラーが発生しました', 'red', 'サーバーが無効な応答を返しました。', loginURL, true);
                        return;
                    }
                    document.getElementById('container').innerHTML='';
                    offset = 0;
                    showSeries (series);
                    document.getElementById('container').classList.remove('transparent');
                },
                content: request+"offset=0"
            });
        }, 400);
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
                        showMessage ('エラーが発生しました', 'red', 'サーバーが無効な応答を返しました。', loginURL, true);
                        return;
                    }
                    showSeries (series);
                },
                content: request + "offset=" + offset
            });
        }
    }
});