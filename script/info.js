// JavaScript Document

window.addEventListener("load", function(){
	var mainLocal = main;
	var debug = mainLocal.debug;
	var navListeners = mainLocal.navListeners;
	var appearanceSwitching = mainLocal.appearanceSwitching;
	var topURL = mainLocal.topURL;
	var sendServerRequest = mainLocal.sendServerRequest;
	var showMessage = mainLocal.showMessage;
	
	if (!window.location.href.startsWith('https://featherine.com/info') && !debug) {
		window.location.href = 'https://featherine.com/info';
		return;
	}
	
	appearanceSwitching();
	navListeners();
	
	sendServerRequest('get_info.php', {
        callback: function (response) {
            if (response.startsWith('INFOBODY:') && response.endsWith('EOF')) {
				document.getElementById('content').innerHTML = response.slice(9, -3);
				document.body.classList.remove("hidden");
				var scrollID = window.location.hash;
				if (scrollID != '') {
					var elem = document.getElementById(scrollID.substr(1));
					if (elem) {
						elem.scrollIntoView({
							behavior: 'smooth'
						});
					}
				}
			} else {
				showMessage({url: topURL});
			}
        },
		method: 'GET'
	});
});
