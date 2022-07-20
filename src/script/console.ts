// JavaScript Document
import "core-js";
import {
	DEVELOPMENT,
	sendServerRequest,
	clearCookies,
	hashPassword,
	
	w,
	addEventListener,
	getHref,
	redirect,
	getById,
	removeClass,
	getBody,
	getParent,
	getDescendantsByClassAt,
	getDescendantsByTag,
	addClass,
	containsClass,
	getByClass
} from './module/main';

addEventListener(w, 'load', function(){
	clearCookies();

	var completeCallback = function (response: string) {
		if (setOutput (response)) {
			alert ('Operation completed');
		}
	};
	
	if (getHref()!='https://featherine.com/console' && !DEVELOPMENT) {
		redirect('https://featherine.com/console', true);
		return;
	}
	
	sendServerRequest('console.php', {
		callback: function (response: string) {
			if (response != 'APPROVED') {
				redirect('https://featherine.com', true);
			} else {
				addEventListener(getById('get-series-table'), 'click', function () {
					getSeriesTable ();
				});
				addEventListener(getById('get-account-table'), 'click', function () {
					getAccountTable ();
				});
				addEventListener(getById('get-invite-table'), 'click', function () {
					getInviteTable ();
				});
				addEventListener(getById('get-log-table'), 'click', function () {
					getLogTable ();
				});
				addEventListener(getById('generate-id'), 'click', function () {
					generate ('id');
				});
				addEventListener(getById('generate-series-id'), 'click', function () {
					generate ('series_id');
				});
				addEventListener(getById('clear-cdn-cache'), 'click', function () {
					clearCDNCache();
				});
				addEventListener(getById('clear-key-cache'), 'click', function () {
					clearKeyCache();
				});
				addEventListener(getById('rebuild-index'), 'click', function () {
					rebuildIndex();
				});
				addEventListener(getById('rebuild-search-index'), 'click', function () {
					rebuildSearchIndex();
				});
				addEventListener(getById('rebuild-all'), 'click', function () {
					rebuildAll();
				});
				addEventListener(getById('verify'), 'click', function () {
					verify();
				});
				addEventListener(getById('show-databases'), 'click', function () {
					showDatabases();
				});
				addEventListener(getById('run-debug'), 'click', function () {
					run('debug');
				});
				addEventListener(getById('run-benchmark'), 'click', function () {
					run('benchmark');
				});
				removeClass(getBody(), "hidden");
			}
		},
		content: "p="+encodeURIComponent(JSON.stringify ({'command': 'authenticate'}))
	});

/*------------------------------------------------------------------------------------Series Functions------------------------------------------------------------------------------------*/

function getSeriesTable () {
	let param = {
		'command': 'get',
		'table': 'series'
	};
	let paramString = JSON.stringify (param);
	
	sendServerRequest('console.php', {
		callback: function (response: string) {
			setOutput (response);
		},
		content: "p="+encodeURIComponent(paramString)
	});
}

function modifySeries (button: Element) {
	var record = getParent(getParent(button));
	var id = getDescendantsByClassAt(record, 'id', 0).innerHTML; 
	var title = (getDescendantsByClassAt(record, 'title', 0) as HTMLTextAreaElement).value; 
	var thumbnail = (getDescendantsByClassAt(record, 'thumbnail', 0) as HTMLTextAreaElement).value; 
	var isPublic = (getDescendantsByClassAt(record, 'public', 0) as HTMLInputElement).checked;
	var series_id = (getDescendantsByClassAt(record, 'series-id', 0) as HTMLTextAreaElement).value; 
	var season_name = (getDescendantsByClassAt(record, 'season-name', 0) as HTMLTextAreaElement).value; 
	var season_order = (getDescendantsByClassAt(record, 'season-order', 0) as HTMLTextAreaElement).value; 
	var keywords = (getDescendantsByClassAt(record, 'keywords', 0) as HTMLTextAreaElement).value; 
	
	var parsedRecord = parseSeriesRecord (id, title, thumbnail, isPublic, series_id, season_name, season_order, keywords);
	if (!parsedRecord) {
		return;
	}
	
	var param = {
		command: 'modify',
		table: 'series',
		...parsedRecord
	};

	var confirm;
	do {
		confirm = prompt('Type "modify" to confirm.');
		if (confirm === null) {
			return;
		}
	} while (confirm != "modify");
	
	sendServerRequest('console.php', {
		callback: completeCallback,
		content: "p="+encodeURIComponent(JSON.stringify (param))
	});
}

function deleteSeries (id: string) {
	
	var confirm;
	do {
		confirm = prompt('Type "delete" to confirm.');
		if (confirm === null) {
			return;
		}
	} while (confirm != "delete");
	
	var param = {
		'command': 'delete',
		'table': 'series',
		'id': id
	};
	
	sendServerRequest('console.php', {
		callback: completeCallback,
		content: "p="+encodeURIComponent(JSON.stringify (param))
	});
}

function addSeries (button: Element) {
	var record = getParent(getParent(button));
	var id = (getDescendantsByClassAt(record, 'id', 0) as HTMLTextAreaElement).value; 
	var title = (getDescendantsByClassAt(record, 'title', 0) as HTMLTextAreaElement).value; 
	var thumbnail = (getDescendantsByClassAt(record, 'thumbnail', 0) as HTMLTextAreaElement).value; 
	var isPublic = (getDescendantsByClassAt(record, 'public', 0) as HTMLInputElement).checked;
	var series_id = (getDescendantsByClassAt(record, 'series-id', 0) as HTMLTextAreaElement).value; 
	var season_name = (getDescendantsByClassAt(record, 'season-name', 0) as HTMLTextAreaElement).value; 
	var season_order = (getDescendantsByClassAt(record, 'season-order', 0) as HTMLTextAreaElement).value; 
	var keywords = (getDescendantsByClassAt(record, 'keywords', 0) as HTMLTextAreaElement).value; 
	
	var parsedRecord = parseSeriesRecord (id, title, thumbnail, isPublic, series_id, season_name, season_order, keywords);
	if (!parsedRecord) {
		return;
	}
	var param = {
		command: 'insert',
		table: 'series',
		...parsedRecord
	}
	
	var confirm;
	do {
		confirm = prompt('Type "insert" to confirm.');
		if (confirm === null) {
			return;
		}
	} while (confirm != "insert");
	
	sendServerRequest('console.php', {
		callback: completeCallback,
		content: "p="+encodeURIComponent(JSON.stringify (param))
	});
}

function parseSeriesRecord (id: string, title: string, thumbnail: string, isPublic: boolean, series_id: string, season_name: string, season_order: string, keywords: string) {
	if (id=='') {
		alert ("ERROR: 'id' is required");
		return false;
	} 

	if (!/^[a-zA-Z0-9~_-]+$/.test(id)) {
		alert ("ERROR: Invalid value for 'id'");
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
	
	let series_id_parsed: string | null;
	if (series_id=='') {
		series_id_parsed=null;
	} else if (!/^[a-zA-Z0-9~_-]+$/.test(id)) {
		alert ("ERROR: Invalid value for 'series_id'");
		return false;
	} else {
		series_id_parsed = series_id;
	}
	
	let season_name_parsed: string | null;
	if (season_name=='') {
		if (series_id_parsed!==null) {
			alert ("ERROR: 'season_name' must be specified when 'series_id' is specified");
			return false;
		}
		season_name_parsed=null;
	} else {
		season_name_parsed = season_name;
	}
	
	let season_order_parsed: number | null;
	if (season_order=='') {
		if (series_id_parsed!==null) {
			alert ("ERROR: 'season_order' must be specified when 'series_id' is specified");
			return false;
		}
		season_order_parsed=null;
	} else {
		season_order_parsed = parseInt(season_order);
		if (isNaN(season_order_parsed)) {
			alert ("ERROR: Invalid value for 'season_order'");
			return false;
		} else if (season_order_parsed>255 || season_order_parsed<0) {
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
		'series_id': series_id_parsed, 
		'season_name': season_name_parsed, 
		'season_order': season_order_parsed, 
		'keywords': keywords
	};
}

function generate (type: string) {
	var param = {
		'command': 'generate',
		'type': type
	};
	
	sendServerRequest('console.php', {
		callback: function (response: string) {
			setOutput (response, 'id-output');
		},
		content: "p="+encodeURIComponent(JSON.stringify (param))
	});
}


function updateTime (id: string) {
	var param = {
		'command': 'updatetime',
		'id': id
	};
	
	sendServerRequest('console.php', {
		callback: completeCallback,
		content: "p="+encodeURIComponent(JSON.stringify (param))
	});
}

/*------------------------------------------------------------------------------------Account Functions------------------------------------------------------------------------------------*/

function getAccountTable () {
	var param = {
		'command': 'get',
		'table': 'account'
	};
	
	sendServerRequest('console.php', {
		callback: function (response: string) {
			setOutput (response);
		},
		content: "p="+encodeURIComponent(JSON.stringify (param))
	});
}

async function addAccount (button: Element) {
	var record = getParent(getParent(button));
	var email = (getDescendantsByClassAt(record, 'email', 0) as HTMLTextAreaElement).value; 
	var username = (getDescendantsByClassAt(record, 'username', 0) as HTMLTextAreaElement).value; 
	var password = (getDescendantsByClassAt(record, 'password', 0) as HTMLTextAreaElement).value; 
	
	var selections = (getDescendantsByTag(getDescendantsByClassAt(record, 'user-group', 0), 'input') as HTMLCollectionOf<HTMLInputElement>);
	var user_group='';
	for (let selection of selections) {
		if (selection.checked) {
			user_group = selection.value;
			break;
		}
	}
	
	selections = (getDescendantsByTag(getDescendantsByClassAt(record, 'status', 0), 'input') as HTMLCollectionOf<HTMLInputElement>);
	var status='';
	for (let selection of selections) {
		if (selection.checked) {
			status = selection.value;
			break;
		}
	}
	
	var available_invite = (getDescendantsByClassAt(record, 'available-invite', 0) as HTMLTextAreaElement).value; 
	
	var parsedRecord = await parseAccountRecord (email, username, password, user_group, status, available_invite);
	if (!parsedRecord) {
		return;
	}
	
	if (parsedRecord.password === null) {
		alert ("ERROR: 'password' is required");
		return;
	}
	
	var param = {
		command: 'insert',
		table: 'account',
		...parsedRecord
	};
	
	var confirm;
	do {
		confirm = prompt('Type "insert" to confirm.');
		if (confirm === null) {
			return;
		}
	} while (confirm != "insert");
	
	sendServerRequest('console.php', {
		callback: completeCallback,
		content: "p="+encodeURIComponent(JSON.stringify (param))
	});
}

async function modifyAccount (button: Element, originalEmail: string) {
	var record = getParent(getParent(button));
	var email = (getDescendantsByClassAt(record, 'email', 0) as HTMLTextAreaElement).value; 
	var username = (getDescendantsByClassAt(record, 'username', 0) as HTMLTextAreaElement).value; 
	var password = (getDescendantsByClassAt(record, 'password', 0) as HTMLTextAreaElement).value; 

	var selections = (getDescendantsByTag(getDescendantsByClassAt(record, 'user-group', 0), 'input') as HTMLCollectionOf<HTMLInputElement>);
	var user_group='';
	for (let selection of selections) {
		if (selection.checked) {
			user_group = selection.value;
			break;
		}
	}
	
	selections = (getDescendantsByTag(getDescendantsByClassAt(record, 'status', 0), 'input') as HTMLCollectionOf<HTMLInputElement>);
	var status='';
	for (let selection of selections) {
		if (selection.checked) {
			status = selection.value;
			break;
		}
	}
	
	var available_invite = (getDescendantsByClassAt(record, 'available-invite', 0) as HTMLTextAreaElement).value; 
		
	var parsedRecord = await parseAccountRecord (email, username, password, user_group, status, available_invite);
	if (!parsedRecord) {
		return;
	}
	
	var param = {
		command: 'modify',
		table: 'account',
		original_email: originalEmail,
		...parsedRecord
	};

	var confirm;
	do {
		confirm = prompt('Type "modify" to confirm.');
		if (confirm === null) {
			return;
		}
	} while (confirm != "modify");
	
	sendServerRequest('console.php', {
		callback: completeCallback,
		content: "p="+encodeURIComponent(JSON.stringify (param))
	});
}

async function parseAccountRecord (email: string, username: string, password: string, user_group: string, status: string, available_invite: string) {
	if (email=='') {
		alert ("ERROR: 'email' is required");
		return false;
	}
	
	if (username=='') {
		alert ("ERROR: 'username' is required");
		return false;
	}
	
	let password_parsed: string | null;
	if (password=='') {
		password_parsed = null;
	} else if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[A-Za-z\d`~!@#$%^&*()\-=_+\[\]{}\\|;:'",<.>\/?]{8,}$/.test(password)) {
		alert ("ERROR: password requirements not met");
		return false;
	} else {
		password_parsed = await hashPassword(password);
	}
	
	let user_group_parsed: number;
	if (user_group=='admin') {
		user_group_parsed = 0;
	} else if (user_group=='user') {
		user_group_parsed = 1;
	} else {
		alert ("ERROR: Invalid value for 'user_group'");
		return false;
	}
	
	let status_parsed: number;
	if (status=='active') {
		status_parsed = 0;
	} else if (status=='deactivated') {
		status_parsed = 1;
	} else if (status=='banned') {
		status_parsed = 2;
	} else {
		alert ("ERROR: Invalid value for 'status'");
		return false;
	}
	
	let available_invite_parsed: number;
	if (available_invite=='') {
		alert ("ERROR: 'available_invite' is required");
		return false;
	} 
	available_invite_parsed = parseInt(available_invite);
	if (isNaN(available_invite_parsed)) {
		alert ("ERROR: Invalid value for 'available_invite'");
		return false;
	} else if (available_invite_parsed>255 || available_invite_parsed<0) {
		alert ("ERROR: 'available_invite' should be in range 0-255");
		return false;
	}
	
	return {
		'email': email, 
		'username': username, 
		'password': password_parsed, 
		'user_group': user_group_parsed, 
		'status': status_parsed,
		'available_invite': available_invite_parsed
	};
}

function deleteAccount (email: string) {
	var confirm;
	do {
		confirm = prompt('Type "delete" to confirm. Deleting an account is NOT recommended. Use "status" option instead.');
		if (confirm === null) {
			return;
		}
	} while (confirm != "delete");
	
	var param = {
		'command': 'delete',
		'table': 'account',
		'email': email
	};
	
	sendServerRequest('console.php', {
		callback: completeCallback,
		content: "p="+encodeURIComponent(JSON.stringify (param))
	});
}

/*------------------------------------------------------------------------------------Invite Functions------------------------------------------------------------------------------------*/

function getInviteTable () {
	var param = {
		'command': 'get',
		'table': 'invite'
	};
	
	sendServerRequest('console.php', {
		callback: function (response: string) {
			setOutput (response);
		},
		content: "p="+encodeURIComponent(JSON.stringify (param))
	});
}

/*------------------------------------------------------------------------------------Log Functions------------------------------------------------------------------------------------*/

function getLogTable () {
	var param = {
		'command': 'get',
		'table': 'log'
	};
	
	sendServerRequest('console.php', {
		callback: function (response: string) {
			setOutput (response);
		},
		content: "p="+encodeURIComponent(JSON.stringify (param))
	});
}

/*------------------------------------------------------------------------------------Show All Databases------------------------------------------------------------------------------------*/
function showDatabases () {
	var param = {
		'command': 'get',
		'table': 'all'
	};
	
	sendServerRequest('console.php', {
		callback: function (response: string) {
			setOutput (response);
		},
		content: "p="+encodeURIComponent(JSON.stringify (param))
	});
}

/*------------------------------------------------------------------------------------Run Functions------------------------------------------------------------------------------------*/
function run (type: string) {
	var param = {
		'command': 'run',
		'type': type
	};
	
	sendServerRequest('console.php', {
		callback: function (response: string) {
			setOutput (response);
		},
		content: "p="+encodeURIComponent(JSON.stringify (param))
	});
}
	
/*------------------------------------------------------------------------------------Cache Functions------------------------------------------------------------------------------------*/
function clearCDNCache () {
	var dir = (getById('clear-cache-dir') as HTMLTextAreaElement).value; 
	if (!dir.startsWith('/') || dir.includes('..')) {
		alert('ERROR: Invalid format for dir');
		return;
	}
	
	var confirm;
	do {
		confirm = prompt('Type "clear" to confirm deleting cache for the following directory: ' + dir);
		if (confirm === null) {
			return;
		}
	} while (confirm != "clear");
	
	var param = {
		'command': 'clear',
		'type': 'cdn_cache',
		'dir': dir
	};
	
	sendServerRequest('console.php', {
		callback: function (response: string) {
			alert(response);
		},
		content: "p="+encodeURIComponent(JSON.stringify (param))
	});
}
	
function clearKeyCache () {
	var confirm;
	do {
		confirm = prompt('Type "clear" to confirm deleting expired key cache');
		if (confirm === null) {
			return;
		}
	} while (confirm != "clear");
	
	var param = {
		'command': 'clear',
		'type': 'key_cache'
	};
	
	sendServerRequest('console.php', {
		callback: function (response: string) {
			alert(response);
		},
		content: "p="+encodeURIComponent(JSON.stringify (param))
	});
}
	
function rebuildIndex () {
	var confirm;
	do {
		confirm = prompt('Type "rebuild" to confirm rebuilding the index.');
		if (confirm === null) {
			return;
		}
	} while (confirm != "rebuild");
	
	var param = {
		'command': 'rebuild',
		'type': 'index'
	};
	
	sendServerRequest('console.php', {
		callback: function (response: string) {
			alert(response);
		},
		content: "p="+encodeURIComponent(JSON.stringify (param))
	});
}
	
function rebuildSearchIndex () {
	var confirm;
	do {
		confirm = prompt('Type "rebuild" to confirm rebuilding the search index.');
		if (confirm === null) {
			return;
		}
	} while (confirm != "rebuild");
	
	var param = {
		'command': 'rebuild',
		'type': 'search_index'
	};
	
	sendServerRequest('console.php', {
		callback: function (response: string) {
			alert(response);
		},
		content: "p="+encodeURIComponent(JSON.stringify (param))
	});
}
	
function rebuildAll () {
	var confirm;
	do {
		confirm = prompt('Type "rebuild" to confirm rebuilding all index.');
		if (confirm === null) {
			return;
		}
	} while (confirm != "rebuild");
	
	var param = {
		'command': 'rebuild',
		'type': 'all'
	};
	
	sendServerRequest('console.php', {
		callback: function (response: string) {
			alert(response);
		},
		content: "p="+encodeURIComponent(JSON.stringify (param))
	});
}
	

/*------------------------------------------------------------------------------------Verify Functions------------------------------------------------------------------------------------*/
function verify () {
	var id = (getById('verify-id') as HTMLTextAreaElement).value; 
	if (!/^[a-zA-Z0-9~_-]+$/.test(id)) {
		alert ("ERROR: Invalid value for 'id'");
		return;
	}
	
	var confirm;
	do {
		confirm = prompt('Type "verify" to confirm verifying the series: ' + id);
		if (confirm === null) {
			return;
		}
	} while (confirm != "verify");
		
	var param = {
		'command': 'verify',
		'series': id
	};
	
	sendServerRequest('console.php', {
		callback: function (response: string) {
			alert(response);
		},
		content: "p="+encodeURIComponent(JSON.stringify (param))
	});
}

/*------------------------------------------------------------------------------------Utility Functions------------------------------------------------------------------------------------*/

function setOutput (response: string, outputElementID?: string) {
	if (outputElementID === undefined) {
		outputElementID = 'output';
	}
	var error = response.includes('ERROR:');
	if (error) {
		alert (response);
	} else {
		getById(outputElementID).innerHTML = response;
		updateEventHandlers ();
	}
	return !error;
}

function changed (elem: Element) {
	addClass(getParent(elem), 'changed');
}

function updateEventHandlers () {
	var buttons = getByClass('add-series'); 

	for (let button of buttons) {
		if (!containsClass(button, 'initialized')) { 
			addClass(button, 'initialized');
			addEventListener(button, 'click', function() {
				addSeries(button);
			});
		}
	}
	
	buttons = getByClass('update-time'); 
	for (let button of (buttons as HTMLCollectionOf<HTMLElement>)) {
		if (!containsClass(button, 'initialized')) {
			addClass(button, 'initialized');
			addEventListener(button, 'click', function() {
				if (button.dataset.id === undefined) {
					alert ("ERROR: 'id' attribute on the element is undefined.");
					return;
				}
				updateTime(button.dataset.id);
			});
		}
	}
	
	buttons = getByClass('delete-series');
	for (let button of (buttons as HTMLCollectionOf<HTMLElement>)) {
		if (!containsClass(button, 'initialized')) {
			addClass(button, 'initialized');
			addEventListener(button, 'click', function() {
				if (button.dataset.id === undefined) {
					alert ("ERROR: 'id' attribute on the element is undefined.");
					return;
				}
				deleteSeries(button.dataset.id);
			});
		}
	}
	
	buttons = getByClass('add-account'); 
	for (let button of buttons) {
		if (!containsClass(button, 'initialized')) {
			addClass(button, 'initialized');
			addEventListener(button, 'click', function() {
				addAccount(button);
			});
		}
	}
	
	buttons = getByClass('modify-series');
	for (let button of buttons) {
		if (!containsClass(button, 'initialized')) {
			addClass(button, 'initialized');
			addEventListener(button, 'click', function() {
				modifySeries(button);
			});
		}
	}
	
	buttons = getByClass('modify-account');
	for (let button of (buttons as HTMLCollectionOf<HTMLElement>)) {
		if (!containsClass(button, 'initialized')) {
			addClass(button, 'initialized');
			addEventListener(button, 'click', function() {
				if (button.dataset.email === undefined) {
					alert ("ERROR: 'email' attribute on the element is undefined.");
					return;
				}
				modifyAccount(button, button.dataset.email);
			});
		}
	}
	
	buttons = getByClass('delete-account'); 
	for (let button of (buttons as HTMLCollectionOf<HTMLElement>)) {
		if (!containsClass(button, 'initialized')) {
			addClass(button, 'initialized');
			addEventListener(button, 'click', function() {
				if (button.dataset.email === undefined) {
					alert ("ERROR: 'email' attribute on the element is undefined.");
					return;
				}
				deleteAccount(button.dataset.email);
			});
		}
	}
	
	var elems = getByClass('onchange');
	for (let elem of elems) {
		if (!containsClass(elem, 'initialized')) {
			addClass(elem, 'initialized');
			addEventListener(elem, 'change', function() {
				changed(elem);
			});
		}
	}
	
	elems = getByClass('oninput');
	for (let elem of elems) {
		if (!containsClass(elem, 'initialized')) {
			addClass(elem, 'initialized');
			addEventListener(elem, 'input', function() {
				changed(elem);
			});
		}
	}
}
});
