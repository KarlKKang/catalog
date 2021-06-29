// JavaScript Document
window.addEventListener("load", function(){
	if (!window.location.href.startsWith('https://featherine.com') && !debug) {
		window.location.href = redirect ('https://featherine.com');
	}
	
    start ('index');
});

function initialize () {

if (getURLParam ('ep') != null) {
	window.location.href = redirect('bangumi.html');
	return 0;
}

var xmlhttp = new XMLHttpRequest();
xmlhttp.onreadystatechange = function() {
	if (this.readyState == 4) {
		if (checkXHRResponse (this)) {
			showSeries (JSON.parse(this.responseText));
		}
	}
};
xmlhttp.open("POST", serverURL + "/request_series.php",true);
xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
xmlhttp.send("user="+encodeURIComponent(JSON.stringify(user))+"&expires="+expires+"&signature="+encodeURIComponent(signature));
	
document.getElementById('search-bar').getElementsByClassName('icon')[0].onclick = search;
document.getElementById('search-bar').getElementsByTagName('input')[0].addEventListener('keyup', function () {
	if (event.key === "Enter") {
		search ();
	}
});

function showSeries (series) {
	document.getElementById('container').innerHTML='';
	
	for (var i=0; i<series.length; i++) {
		var seriesNode = document.createElement('div');
		var thumbnailNode = document.createElement('div');
		var titleNode = document.createElement('p');
		
		seriesNode.appendChild(thumbnailNode);
		seriesNode.appendChild(titleNode);
		
		thumbnailNode.classList.add('lazy');
		thumbnailNode.dataset.bg = series[i].thumbnail;
		titleNode.innerHTML = series[i].title;
		
		let index = i;
		seriesNode.addEventListener("click", function(){goToSeries (series[index].id);});
		seriesNode.classList.add('series');
		
		document.getElementById('container').appendChild(seriesNode);
	}
	
	var lazyLoadInstance = new LazyLoad();
	//lazyLoadInstance.update();
}

function goToSeries (id) {
	var url = 'bangumi.html?series='+id+'&ep=1';
	window.location.href = url;
}

function search () {
	document.getElementById('container').style.opacity = 0;
	var keywords = document.getElementById('search-bar').getElementsByTagName('input')[0].value;
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (this.readyState == 4) {
			if (checkXHRResponse (this)) {
				showSeries (JSON.parse(this.responseText));
				document.getElementById('container').style.opacity = 1;
			}
		}
	};
	setTimeout (function () {
		xmlhttp.open("POST", serverURL + "/request_series.php",true);
		xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
		if (keywords == '') {
			xmlhttp.send("user="+encodeURIComponent(JSON.stringify(user))+"&expires="+expires+"&signature="+encodeURIComponent(signature));
		} else {
			xmlhttp.send("user="+encodeURIComponent(JSON.stringify(user))+"&expires="+expires+"&signature="+encodeURIComponent(signature)+"&keywords="+encodeURIComponent(keywords));
		}		
	}, 400);
}
}