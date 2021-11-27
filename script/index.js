// JavaScript Document
window.addEventListener("load", function(){
	if (!window.location.href.startsWith('https://featherine.com') && !debug) {
		window.location.href = redirect ('https://featherine.com');
		return 0;
	}
	
	document.getElementById('nav-btn').addEventListener('click', function () {
		navUpdate ();
	});
	
	document.getElementById('nav-menu-content-1').addEventListener('click', function () {
		goTo('top');
	});
	document.getElementById('nav-menu-content-2').addEventListener('click', function () {
		goTo('account');
	});
	document.getElementById('nav-menu-content-3').addEventListener('click', function () {
		goTo('info');
	});
	document.getElementById('nav-menu-content-4').addEventListener('click', function () {
		logout(function () {window.location.href = redirect (loginURL);});
	});
	
	start ('index', function () {initialize();});

	function initialize () {
		var request='';
		var offset=0;

		if (getURLParam ('ep') != null) {
			window.location.href = redirect('bangumi'+(debug?'.html':''));
			return 0;
		}

		var xmlhttp = new XMLHttpRequest();
		xmlhttp.onreadystatechange = function() {
			if (this.readyState == 4) {
				if (checkXHRResponse (this)) {
					try {
						var series = JSON.parse(this.responseText);
					} catch (e) {
						showMessage ('エラーが発生しました', 'red', 'サーバーが無効な応答を返しました。', topURL, true);
						return 0;
					}
					document.getElementsByTagName("body")[0].classList.remove("hidden");
					document.addEventListener('scroll', infiniteScrolling);
					window.addEventListener("resize", infiniteScrolling);
					showSeries (series);
				}
			}
		};
		xmlhttp.open("POST", serverURL + "/request_series.php",true);
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		xmlhttp.withCredentials = true;
		xmlhttp.send("offset=0");

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

			var xmlhttp = new XMLHttpRequest();
			xmlhttp.onreadystatechange = function() {
				if (this.readyState == 4) {
					if (checkXHRResponse (this)) {
						try {
							var series = JSON.parse(this.responseText);
						} catch (e) {
							showMessage ('エラーが発生しました', 'red', 'サーバーが無効な応答を返しました。', topURL, true);
							return 0;
						}
						document.getElementById('container').innerHTML='';
						offset = 0;
						showSeries (series);
						document.getElementById('container').classList.remove('transparent');
					}
				}
			};
			setTimeout (function () {
				xmlhttp.open("POST", serverURL + "/request_series.php",true);
				xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
				xmlhttp.withCredentials = true;
				if (keywords == '') {
					request = "";
					xmlhttp.send("offset=0");
				} else {
					request = "keywords="+encodeURIComponent(keywords) + '&';
					xmlhttp.send("keywords="+encodeURIComponent(keywords)+"&offset=0");
				}		
			}, 400);
		}

		function infiniteScrolling () {
			var detector = document.getElementById('position-detector');
			var boundingRect = detector.getBoundingClientRect();
			var viewportHeight = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

			if (boundingRect.top-256-24<=viewportHeight*1.5 && offset != 'EOF' && !detector.classList.contains('loading')) {
					detector.classList.add('loading');
					let xmlhttp = new XMLHttpRequest();
					xmlhttp.onreadystatechange = function() {
						if (this.readyState == 4) {
							if (checkXHRResponse (this)) {
								try {
									var series = JSON.parse(this.responseText);
								} catch (e) {
									showMessage ('エラーが発生しました', 'red', 'サーバーが無効な応答を返しました。', topURL, true);
									return 0;
								}
								showSeries (series);
							}
						}
					};
					xmlhttp.open("POST", serverURL + "/request_series.php",true);
					xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
					xmlhttp.withCredentials = true;
					xmlhttp.send(request + "offset=" + offset);
			}
		}
	}
});