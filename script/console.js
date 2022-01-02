// JavaScript Document

window.addEventListener("load", function(){
	if (!window.location.href.startsWith('https://featherine.com/console') && !debug) {
		window.location.href = 'https://featherine.com/console';
		return 0;
	}
	
	document.getElementById('get-series-table').addEventListener('click', function () {
		getSeriesTable ();
	});
	document.getElementById('get-account-table').addEventListener('click', function () {
		getAccountTable ();
	});
	document.getElementById('get-invite-table').addEventListener('click', function () {
		getInviteTable ();
	});
	document.getElementById('get-log-table').addEventListener('click', function () {
		getLogTable ();
	});
	document.getElementById('generate-id').addEventListener('click', function () {
		generate ('id');
	});
	document.getElementById('generate-series-id').addEventListener('click', function () {
		generate ('series-id');
	});
	document.getElementById('clear-cache').addEventListener('click', function () {
		clearCache();
	});
	document.getElementById('rebuild-index').addEventListener('click', function () {
		rebuildIndex();
	});
	
	start ('console', function () {initialize();});
	
function initialize () {
	
	var param = {
		'command': 'authenticate'
	};
	param = JSON.stringify (param);
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (checkXHRStatus (this.status)) {
			if (this.readyState == 4) {
				if (this.responseText!='APPROVED') {
					window.location.href = 'https://featherine.com/404';
				} else {
					document.getElementsByTagName("body")[0].classList.remove("hidden");
				}
			}
		}
	};
	addXHROnError(xmlhttp);
	xmlhttp.open("POST", serverURL + "/console.php",true);
	xmlhttp.withCredentials = true;
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("p="+encodeURIComponent(param));
	
}

/*------------------------------------------------------------------------------------Series Functions------------------------------------------------------------------------------------*/

function getSeriesTable () {
	var param = {
		'command': 'get',
		'table': 'series'
	};
	param = JSON.stringify (param);
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (checkXHRStatus (this.status)) {
			if (this.readyState == 4) {
				setOutput (this.responseText);
			}
		}
	};
	addXHROnError(xmlhttp);
	xmlhttp.open("POST", serverURL + "/console.php",true);
	xmlhttp.withCredentials = true;
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("p="+encodeURIComponent(param));
}

function modifySeries (button) {
	var record = button.parentNode.parentNode;
	var id = record.getElementsByClassName('id')[0].innerHTML;
	var title = record.getElementsByClassName('title')[0].value;
	var thumbnail = record.getElementsByClassName('thumbnail')[0].value;
	var isPublic = record.getElementsByClassName('public')[0].checked;
	var series_id = record.getElementsByClassName('series-id')[0].value;
	var season_name = record.getElementsByClassName('season-name')[0].value;
	var season_order = record.getElementsByClassName('season-order')[0].value;
	var keywords = record.getElementsByClassName('keywords')[0].value;
	
	var param = parseSeriesRecord (id, title, thumbnail, isPublic, series_id, season_name, season_order, keywords);
	if (!param) {
		return 0;
	}
	
	param.command = 'modify';
	param.table = 'series';
	param = JSON.stringify (param);

	var confirm;
	do {
		confirm = prompt('Type "modify" to confirm.');
		if (confirm === null) {
			return 0;
		}
	} while (confirm != "modify");

	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (checkXHRStatus (this.status)) {
			if (this.readyState == 4) {
				if (setOutput (this.responseText)) {
					alert ('Operation completed');
				}
			}
		}
	};
	addXHROnError(xmlhttp);
	xmlhttp.open("POST", serverURL + "/console.php",true);
	xmlhttp.withCredentials = true;
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("p="+encodeURIComponent(param));
}

function deleteSeries (id) {
	
	var confirm;
	do {
		confirm = prompt('Type "delete" to confirm.');
		if (confirm === null) {
			return 0;
		}
	} while (confirm != "delete");
	
	var param = {
		'command': 'delete',
		'table': 'series',
		'id': parseInt(id)
	};
	param = JSON.stringify (param);

	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (checkXHRStatus (this.status)) {
			if (this.readyState == 4) {
				if (setOutput (this.responseText)) {
					alert ('Operation completed');
				}
			}
		}
	};
	addXHROnError(xmlhttp);
	xmlhttp.open("POST", serverURL + "/console.php",true);
	xmlhttp.withCredentials = true;
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("p="+encodeURIComponent(param));
}

function addSeries (button) {
	var record = button.parentNode.parentNode;
	var id = record.getElementsByClassName('id')[0].value;
	var title = record.getElementsByClassName('title')[0].value;
	var thumbnail = record.getElementsByClassName('thumbnail')[0].value;
	var isPublic = record.getElementsByClassName('public')[0].checked;
	var series_id = record.getElementsByClassName('series-id')[0].value;
	var season_name = record.getElementsByClassName('season-name')[0].value;
	var season_order = record.getElementsByClassName('season-order')[0].value;
	var keywords = record.getElementsByClassName('keywords')[0].value;
	
	var param = parseSeriesRecord (id, title, thumbnail, isPublic, series_id, season_name, season_order, keywords);
	if (!param) {
		return 0;
	}
	
	param.command = 'insert';
	param.table = 'series';
	param = JSON.stringify (param);
	
	var confirm;
	do {
		confirm = prompt('Type "insert" to confirm.');
		if (confirm === null) {
			return 0;
		}
	} while (confirm != "insert");

	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (checkXHRStatus (this.status)) {
			if (this.readyState == 4) {
				if (setOutput (this.responseText)) {
					alert ('Operation completed');
				}
			}
		}
	};
	addXHROnError(xmlhttp);
	xmlhttp.open("POST", serverURL + "/console.php",true);
	xmlhttp.withCredentials = true;
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("p="+encodeURIComponent(param));
}

function parseSeriesRecord (id, title, thumbnail, isPublic, series_id, season_name, season_order, keywords) {
	if (id=='') {
		alert ("ERROR: 'id' is required");
		return false;
	} 
	id = parseInt(id);
	if (isNaN(id)) {
		alert ("ERROR: Invalid value for 'id'");
		return false;
	} else if (id>4294967295 || id<0) {
		alert ("ERROR: 'id' should be in range 0-4294967295");
		return false;
	}
	
	if (title=='') {
		alert ("ERROR: 'title' is required");
		return false;
	}
	
	if (thumbnail=='') {
		alert ("ERROR: 'thumbnail' is required");
		return false;
	}
	
	if (series_id=='') {
		series_id=null;
	} else {
		series_id = parseInt(series_id);
		if (isNaN(series_id)) {
			alert ("ERROR: Invalid value for 'series_id'");
			return false;
		} else if (series_id>4294967295 || series_id<0) {
			alert ("ERROR: 'series_id' should be in range 0-4294967295");
			return false;
		}
	}
	
	if (season_name=='') {
		if (series_id!==null) {
			alert ("ERROR: 'season_name' must be specified when 'series_id' is specified");
			return false;
		}
		season_name=null;
	}
	
	if (season_order=='') {
		if (series_id!==null) {
			alert ("ERROR: 'season_order' must be specified when 'series_id' is specified");
			return false;
		}
		season_order=null;
	} else {
		season_order = parseInt(season_order);
		if (isNaN(season_order)) {
			alert ("ERROR: Invalid value for 'season_order'");
			return false;
		} else if (season_order>255 || season_order<0) {
            alert ("ERROR: 'season_order' should be in range 0-255");
			return false;
        }
	}
	
	if (keywords=='') {
		alert ("ERROR: 'keywords' is required");
		return false;
	}
	
	return {
		'id': id,
		'title': title,
		'thumbnail': thumbnail, 
		'public': isPublic,
		'series_id': series_id, 
		'season_name': season_name, 
		'season_order': season_order, 
		'keywords': keywords
	};
}

function generate (type) {
	var param = {
		'command': 'generate-'+type
	};
	param = JSON.stringify (param);
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (checkXHRStatus (this.status)) {
			if (this.readyState == 4) {
				setOutput (this.responseText, 'id-output');
			}
		}
	};
	addXHROnError(xmlhttp);
	xmlhttp.open("POST", serverURL + "/console.php",true);
	xmlhttp.withCredentials = true;
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("p="+encodeURIComponent(param));
}


function updateTime (id) {
	var param = {
		'command': 'updatetime',
		'id': parseInt(id)
	};
	param = JSON.stringify (param);
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (checkXHRStatus (this.status)) {
			if (this.readyState == 4) {
				if (setOutput (this.responseText)) {
					alert ('Operation completed');
				}
			}
		}
	};
	addXHROnError(xmlhttp);
	xmlhttp.open("POST", serverURL + "/console.php",true);
	xmlhttp.withCredentials = true;
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("p="+encodeURIComponent(param));
}

/*------------------------------------------------------------------------------------Account Functions------------------------------------------------------------------------------------*/

function getAccountTable () {
	var param = {
		'command': 'get',
		'table': 'account'
	};
	param = JSON.stringify (param);
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (checkXHRStatus (this.status)) {
			if (this.readyState == 4) {
				setOutput (this.responseText);
			}
		}
	};
	addXHROnError(xmlhttp);
	xmlhttp.open("POST", serverURL + "/console.php",true);
	xmlhttp.withCredentials = true;
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("p="+encodeURIComponent(param));
}

function addAccount (button) {
	var record = button.parentNode.parentNode;
	var email = record.getElementsByClassName('email')[0].value;
	var username = record.getElementsByClassName('username')[0].value;
	var password = record.getElementsByClassName('password')[0].value;
	
	var selections = record.getElementsByClassName('user-group')[0].getElementsByTagName('input');
	var user_group='';
	for (var i = 0; i< selections.length; i++) {
		if (selections[i].checked) {
			user_group = selections[i].value;
			break;
		}
	}
	
	
	selections = record.getElementsByClassName('status')[0].getElementsByTagName('input');
	var status='';
	for (i = 0; i< selections.length; i++) {
		if (selections[i].checked) {
			status = selections[i].value;
			break;
		}
	}
	
	var available_invite = record.getElementsByClassName('available-invite')[0].value;
	
	var param = parseAccountRecord (email, username, password, user_group, status, available_invite);
	if (!param) {
		return 0;
	}
	
	if (param.password === null) {
		alert ("ERROR: 'password' is required");
		return 0;
	}
	
	param.command = 'insert';
	param.table = 'account';
	param = JSON.stringify (param);
	
	var confirm;
	do {
		confirm = prompt('Type "insert" to confirm.');
		if (confirm === null) {
			return 0;
		}
	} while (confirm != "insert");

	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (checkXHRStatus (this.status)) {
			if (this.readyState == 4) {
				if (setOutput (this.responseText)) {
					alert ('Operation completed');
				}
			}
		}
	};
	addXHROnError(xmlhttp);
	xmlhttp.open("POST", serverURL + "/console.php",true);
	xmlhttp.withCredentials = true;
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("p="+encodeURIComponent(param));
}

function modifyAccount (button, originalEmail) {
	var record = button.parentNode.parentNode;
	var email = record.getElementsByClassName('email')[0].value;
	var username = record.getElementsByClassName('username')[0].value;
	var password = record.getElementsByClassName('password')[0].value;
	
	var selections = record.getElementsByClassName('user-group')[0].getElementsByTagName('input');
	var user_group='';
	for (var i = 0; i< selections.length; i++) {
		if (selections[i].checked) {
			user_group = selections[i].value;
			break;
		}
	}
	
	
	selections = record.getElementsByClassName('status')[0].getElementsByTagName('input');
	var status='';
	for (i = 0; i< selections.length; i++) {
		if (selections[i].checked) {
			status = selections[i].value;
			break;
		}
	}
	
	var available_invite = record.getElementsByClassName('available-invite')[0].value;
	
	var param = parseAccountRecord (email, username, password, user_group, status, available_invite);
	if (!param) {
		return 0;
	}
	
	param.command = 'modify';
	param.table = 'account';
	param.original_email = originalEmail;
	param = JSON.stringify (param);

	var confirm;
	do {
		confirm = prompt('Type "modify" to confirm.');
		if (confirm === null) {
			return 0;
		}
	} while (confirm != "modify");

	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (checkXHRStatus (this.status)) {
			if (this.readyState == 4) {
				if (setOutput (this.responseText)) {
					alert ('Operation completed');
				}
			}
		}
	};
	addXHROnError(xmlhttp);
	xmlhttp.open("POST", serverURL + "/console.php",true);
	xmlhttp.withCredentials = true;
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("p="+encodeURIComponent(param));
}

function parseAccountRecord (email, username, password, user_group, status, available_invite) {
	if (email=='') {
		alert ("ERROR: 'email' is required");
		return false;
	}
	
	if (username=='') {
		alert ("ERROR: 'username' is required");
		return false;
	}
	
	if (password=='') {
		password = null;
	} else if (password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z0-9+_!@#$%^&*.,?-]{8,}$/)===null) {
		alert ("ERROR: password requirements not met");
		return false;
	} else {
		var hash = forge.md.sha512.sha256.create();
		hash.update(password);
		password = hash.digest().toHex();
	}
	
	if (user_group=='admin') {
		user_group = 0;
	} else if (user_group=='user') {
		user_group = 1;
	} else {
		alert ("ERROR: Invalid value for 'user_group'");
		return false;
	}
	
	if (status=='active') {
		status = 0;
	} else if (status=='deactivated') {
		status = 1;
	} else if (status=='banned') {
		status = 2;
	} else {
		alert ("ERROR: Invalid value for 'status'");
		return false;
	}
	
	if (available_invite=='') {
		alert ("ERROR: 'available_invite' is required");
		return false;
	} 
	available_invite = parseInt(available_invite);
	if (isNaN(available_invite)) {
		alert ("ERROR: Invalid value for 'available_invite'");
		return false;
	} else if (available_invite>255 || available_invite<0) {
		alert ("ERROR: 'available_invite' should be in range 0-255");
		return false;
	}
	
	return {
		'email': email, 
		'username': username, 
		'password': password, 
		'user_group': user_group, 
		'status': status,
		'available_invite': available_invite
	};
}

function deleteAccount (email) {
	var confirm;
	do {
		confirm = prompt('Type "delete" to confirm. Deleting an account is NOT recommended. Use "status" option instead.');
		if (confirm === null) {
			return 0;
		}
	} while (confirm != "delete");
	
	var param = {
		'command': 'delete',
		'table': 'account',
		'email': email
	};
	param = JSON.stringify (param);

	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (checkXHRStatus (this.status)) {
			if (this.readyState == 4) {
				if (setOutput (this.responseText)) {
					alert ('Operation completed');
				}
			}
		}
	};
	addXHROnError(xmlhttp);
	xmlhttp.open("POST", serverURL + "/console.php",true);
	xmlhttp.withCredentials = true;
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("p="+encodeURIComponent(param));
}

/*------------------------------------------------------------------------------------Invite Functions------------------------------------------------------------------------------------*/

function getInviteTable () {
	var param = {
		'command': 'get',
		'table': 'invite'
	};
	param = JSON.stringify (param);
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (checkXHRStatus (this.status)) {
			if (this.readyState == 4) {
				setOutput (this.responseText);
			}
		}
	};
	addXHROnError(xmlhttp);
	xmlhttp.open("POST", serverURL + "/console.php",true);
	xmlhttp.withCredentials = true;
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("p="+encodeURIComponent(param));
}

/*------------------------------------------------------------------------------------Log Functions------------------------------------------------------------------------------------*/

function getLogTable () {
	var param = {
		'command': 'get',
		'table': 'log'
	};
	param = JSON.stringify (param);
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (checkXHRStatus (this.status)) {
			if (this.readyState == 4) {
				setOutput (this.responseText);
			}
		}
	};
	addXHROnError(xmlhttp);
	xmlhttp.open("POST", serverURL + "/console.php",true);
	xmlhttp.withCredentials = true;
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("p="+encodeURIComponent(param));
}
	
/*------------------------------------------------------------------------------------Cache Functions------------------------------------------------------------------------------------*/
function clearCache () {
	var dir = document.getElementById('clear-cache-dir').value;
	if (!dir.startsWith('/') || dir.includes('..')) {
		alert('ERROR: Invalid format for dir');
	}
	
	var confirm;
	do {
		confirm = prompt('Type "clear" to confirm deleting cache for the following directory: ' + dir);
		if (confirm === null) {
			return 0;
		}
	} while (confirm != "clear");
	
	var param = {
		'command': 'clear-cache',
		'dir': dir
	};
	param = JSON.stringify (param);
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (checkXHRStatus (this.status)) {
			if (this.readyState == 4) {
				alert(this.responseText);
			}
		}
	};
	addXHROnError(xmlhttp);
	xmlhttp.open("POST", serverURL + "/console.php",true);
	xmlhttp.withCredentials = true;
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("p="+encodeURIComponent(param));
}
	
function rebuildIndex () {
	var confirm;
	do {
		confirm = prompt('Type "rebuild" to confirm rebuilding the index.');
		if (confirm === null) {
			return 0;
		}
	} while (confirm != "rebuild");
	
	var param = {
		'command': 'rebuild-index'
	};
	param = JSON.stringify (param);
	
	var xmlhttp = new XMLHttpRequest();
	xmlhttp.onreadystatechange = function() {
		if (checkXHRStatus (this.status)) {
			if (this.readyState == 4) {
				alert(this.responseText);
			}
		}
	};
	addXHROnError(xmlhttp);
	xmlhttp.open("POST", serverURL + "/console.php",true);
	xmlhttp.withCredentials = true;
	xmlhttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
	xmlhttp.send("p="+encodeURIComponent(param));
}

/*------------------------------------------------------------------------------------Utility Functions------------------------------------------------------------------------------------*/

function setOutput (response, outputElementID) {
	if (outputElementID === undefined) {
		outputElementID = 'output';
	}
	var error = response.includes('ERROR:');
	if (error) {
		alert (response);
	} else {
		document.getElementById(outputElementID).innerHTML = response;
		updateEventHandlers ();
	}
	return !error;
}

function changed (textarea) {
	textarea.parentNode.classList.add('changed');
}

function updateEventHandlers () {
	var buttons = document.getElementsByClassName('add-series');
	var i;
	for (i=0; i<buttons.length; i++) {
		if (!buttons[i].classList.contains('initialized')) {
			buttons[i].classList.add('initialized');
			buttons[i].addEventListener('click', function() {
				addSeries(this);
			});
		}
	}
	
	buttons = document.getElementsByClassName('update-time');
	for (i=0; i<buttons.length; i++) {
		if (!buttons[i].classList.contains('initialized')) {
			buttons[i].classList.add('initialized');
			buttons[i].addEventListener('click', function() {
				updateTime(this.dataset.id);
			});
		}
	}
	
	buttons = document.getElementsByClassName('delete-series');
	for (i=0; i<buttons.length; i++) {
		if (!buttons[i].classList.contains('initialized')) {
			buttons[i].classList.add('initialized');
			buttons[i].addEventListener('click', function() {
				deleteSeries(this.dataset.id);
			});
		}
	}
	
	buttons = document.getElementsByClassName('add-account');
	for (i=0; i<buttons.length; i++) {
		if (!buttons[i].classList.contains('initialized')) {
			buttons[i].classList.add('initialized');
			buttons[i].addEventListener('click', function() {
				addAccount(this);
			});
		}
	}
	
	buttons = document.getElementsByClassName('modify-series');
	for (i=0; i<buttons.length; i++) {
		if (!buttons[i].classList.contains('initialized')) {
			buttons[i].classList.add('initialized');
			buttons[i].addEventListener('click', function() {
				modifySeries(this);
			});
		}
	}
	
	buttons = document.getElementsByClassName('modify-account');
	for (i=0; i<buttons.length; i++) {
		if (!buttons[i].classList.contains('initialized')) {
			buttons[i].classList.add('initialized');
			buttons[i].addEventListener('click', function() {
				modifyAccount(this, this.dataset.email);
			});
		}
	}
	
	buttons = document.getElementsByClassName('delete-account');
	for (i=0; i<buttons.length; i++) {
		if (!buttons[i].classList.contains('initialized')) {
			buttons[i].classList.add('initialized');
			buttons[i].addEventListener('click', function() {
				deleteAccount(this.dataset.email);
			});
		}
	}
	
	var elem = document.getElementsByClassName('onchange');
	for (i=0; i<elem.length; i++) {
		if (!elem[i].classList.contains('initialized')) {
			elem[i].classList.add('initialized');
			elem[i].addEventListener('change', function() {
				changed(this);
			});
		}
	}
	
	elem = document.getElementsByClassName('oninput');
	for (i=0; i<elem.length; i++) {
		if (!elem[i].classList.contains('initialized')) {
			elem[i].classList.add('initialized');
			elem[i].addEventListener('input', function() {
				changed(this);
			});
		}
	}
}
});
