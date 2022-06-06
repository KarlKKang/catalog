import {
	debug,
	topURL,
    loginURL
} from './constant.js';

import {keyExists, getHref} from './javascript_wrapper.js';

const defaultErrorSuffix = 'このエラーが続く場合は、管理者にお問い合わせください。';
const browserCompatibilitySuffix = '別のブラウザで、もう一度お試しください。';

const titleAndBody = {
    title: {
        defaultError: 'エラーが発生しました',
        expired: '期限が切れています',
        completed: '完了しました',
        rejected: 'リクエストは拒否されました',
        emailSent: '送信されました',
        unrecommendedBrowser: 'お使いのブラウザは推奨環境ではありません',
        server: {
            connectionError: 'サーバーに接続できません',
            '429': "429 Too Many Requests",
            '503': "メンテナンス中",
        }
    },
    body: {
        defaultErrorSuffix: defaultErrorSuffix,
        browserCompatibilitySuffix: browserCompatibilitySuffix,
        unknownError: '不明なエラーが発生しました。' + defaultErrorSuffix,
        expired: 'もう一度やり直してください。',
        emailChanged: 'メールアドレスが変更されました。',
        incompletedInvitation: '未完成の招待があります。招待が完了するまでお待ちください。',
        invitationOnly: '現在、登録は招待制となっています。',
        registerComplete: 'アカウントが登録されました。',
        emailSent: 'メールボックスをご確認ください。届くまでに時間がかかる場合があります。',
        passwordChanged: 'パスワードを変更しました。',
        specialRegistrationOnly: '現在、一般登録の受付を開始しています。ボタンをクリックして、登録ページにお進みください。',
        unrecommendedBrowser: '一部のコンテンツが正常に再生されない場合は、他のブラウザをお使いください。',
        server: {
            invalidResponse: 'サーバーが無効な応答を返しました。' + defaultErrorSuffix,
            connectionError: '数分待ってから、もう一度お試しください。' + defaultErrorSuffix,
            '429': "サーバーにリクエストを送信する頻度が高すぎる。数分待ってから、もう一度お試しください。",
            '503': "ご不便をおかけして申し訳ありません。後ほどもう一度お試しください。",
            '400And500': function (responseText) {
                return 'サーバーからの応答：' + responseText + '<br>' + defaultErrorSuffix;
            },
            '403': "サーバーがリクエストを拒否しました。" + defaultErrorSuffix
        },
        moduleImportError: function (e) {
            return 'モジュールの読み込みに失敗しました。' + defaultErrorSuffix + "<br>" + e;
        },
        cssVarError: function (e) {
            return "cssの解析に失敗しました。" + browserCompatibilitySuffix + "<br>" + e;
        }
    },
};

const inline = {
    invalidEmailFormat: '有効なメールアドレスを入力してください。',

    emailAlreadyRegistered: 'このメールアドレスはすでに登録済みです。',
    emailAlreadyInvited: 'このメールアドレスはすでに招待されています。',
    emailAlreadyInvitedOrRegistered: 'このメールアドレスは、登録または招待されています。',
    specialRegistrationOnly: '現在、一般登録を受け付けています。featherine.com/special_register で登録することができます。',
    emailSent: 'メールが送信されました。届くまでに時間がかかる場合があります。',
    invitationNotQualified: '招待状を送る条件を満たしていません。',
    invitationClosed: '現在、新規登録は受け付けておりません。',
    incompletedInvitation: titleAndBody.body.incompletedInvitation,

    duplicatedRequest: '同じリクエストがまだ進行中です。新しいリクエストを送信する前に、、しばらくお待ちください。',

    passwordChanged: titleAndBody.body.passwordChanged,
    invalidPasswordFormat: 'パスワードが要件を満たしていません。',
    passwordConfirmationMismatch: 'パスワードの確認再入力が一致しません。',

    usernameEmpty: 'ユーザー名を空欄にすることはできません。',
    usernameUnchanged: '新しいユーザー名は元のユーザー名と同じです。',
    usernameChanged: 'ユーザー名を変更しました。',
    usernameTaken: 'このユーザーネームはすでに使われています。別のユーザー名を入力してください。',
    
    loginFailed: 'アカウントIDかパスワードが正しくありません。',
};

const mediaIncompatibleSuffix = '他のブラウザでご覧いただくか、デスクトップでファイルをダウンロードし、ローカルで再生してください。';
const media = {
    title: {
        defaultError: titleAndBody.title.defaultError,
        incompatible: '再生できません',
    }, 
    body: {
        defaultErrorSuffix: defaultErrorSuffix,
        incompatibleSuffix: mediaIncompatibleSuffix,
    }
}

const param = {
    moduleImportError: function (e) {
        return {
            message: titleAndBody.body.moduleImportError(e)
        };
    },
    cssVarError: function (e) {
        return {
            message: titleAndBody.body.cssVarError(e)
        };
    },
    expired: {
        title: titleAndBody.title.expired,
        message: titleAndBody.body.expired,
        url: loginURL
    },
    emailChanged: {
        title: titleAndBody.title.completed,
		message: titleAndBody.body.emailChanged,
		color: 'green',
		url: loginURL
    },
    incompletedInvitation: {
        title: titleAndBody.title.rejected,
        message: titleAndBody.body.incompletedInvitation,
        url: loginURL
    },
    invitationOnly: {
        title: titleAndBody.title.rejected,
	    message: titleAndBody.body.invitationOnly,
		url: loginURL
    },
    registerComplete: {
        title: titleAndBody.title.completed,
		message: titleAndBody.body.registerComplete,
		color: 'green',
		url: loginURL
    },
    emailSent: {
        title: titleAndBody.title.emailSent,
		message: titleAndBody.body.emailSent,
		color: 'green',
		url: loginURL
    },
    passwordChanged: {
        title: titleAndBody.title.completed,
		message: titleAndBody.body.passwordChanged,
		color: 'green',
		url: loginURL
    },
    specialRegistrationOnly: {
        title: titleAndBody.title.rejected,
        message: titleAndBody.body.specialRegistrationOnly,
        url: 'special_register'+(debug?'.html':'')
    },
    unrecommendedBrowser: function (redirectURL) {
        return {
            title: titleAndBody.title.unrecommendedBrowser,
            message: titleAndBody.body.unrecommendedBrowser,
            color: 'orange', 
            url: redirectURL
        }
    },
    server: {
        invalidResponse: (function() { //This is NOT a runtime function
            const href = getHref();
            if (href == topURL) {
                return {
                    message: titleAndBody.body.server.invalidResponse,
                    url: loginURL,
                    logout: true
                };
            } else if (href == loginURL) {
                return {
                    message: titleAndBody.body.server.invalidResponse
                };
            } else {
                return {
                    message: titleAndBody.body.server.invalidResponse,
                    url: topURL,
                };
            }
        })(),
        connectionError: {
            title: titleAndBody.title.server.connectionError,
            message: titleAndBody.body.server.connectionError
        },
        '429': {
            title: titleAndBody.title.server['429'],
            message: titleAndBody.body.server['429']
        },
        '503': {
            title: titleAndBody.title.server['503'],
            message: titleAndBody.body.server['503'],
            color: 'orange'
        },
        '400And500': function (responseText) {
            return {
                message: titleAndBody.body.server['400And500'](responseText)
            };
        },
        '403': {
            message: titleAndBody.body.server['403']
        }
    }
};

function showMessage (param) {
	if (param === undefined) { 
        param = {};
        const href = getHref();
		if (href == topURL) {
            param.logout = true;
            param.url = loginURL;
        } else if (href != loginURL) {
            param.url = topURL;
        }
	}
	
	if (!keyExists(param, 'title')) {
		param.title = titleAndBody.title.defaultError;
	}
	if (!keyExists(param, 'message')) {
		param.message = titleAndBody.body.unknownError;
	}
	if (!keyExists(param, 'color')) {
		param.color = 'red';
	}
	if (!keyExists(param, 'logout')) {
		param.logout = false;
	}
	if (!keyExists(param, 'url')) {
		param.url = null;
	}
	
	param.htmlTitle = document.title;
	document.cookie = 'local-message-param='+encodeURIComponent(JSON.stringify(param))+';max-age=86400;path=/' + (debug?'':';domain=.featherine.com;secure;samesite=strict');
	window.location.replace(debug?'message.html':(topURL+'/message'));
}


const message = {
    template: {
        title: titleAndBody.title,
        body: titleAndBody.body,
        inline: inline,
        media: media,
        param: param
    },
    show: showMessage
};

export {message as default};