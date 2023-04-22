const ACCESS_TOKEN = "vSwlEgvqmF9spgonbEm3v9JEzUxBPUiysyF9HHfwkVtjZ9UyC5bwKb8yyzv/io2WA9jcSz8PESjQOUFUSz6mzCh0k9dgfM71FWpFLu0lLp/j1tsvXtkXXe0h4JIr2dgKZf8tMp/M08wj3A83g2UyOwdB04t89/1O/w1cDnyilFU=";
const API_KEY = "ad5f4f84-db97-f272-2c9c-1d8a80e27607:fx";
const API_URL = 'https://api-free.deepl.com/v2/translate';

const FETCH_WAIT = 200;

// DeepL翻訳関数
function deepltranslate(text, src, tgt) {

	let t = text.toString();
	let url = API_URL;
	let content = encodeURI('auth_key=' + API_KEY + '&text=' + t
			+ '&source_lang=' + src + '&target_lang=' + tgt);
	const postheader = {
		"accept" : "gzip, */*",
		"timeout" : "20000",
		"Content-Type" : "application/x-www-form-urlencoded"
	}

	const parameters = {
		"method" : "post",
		"headers" : postheader,
		'payload' : content
	}

	// スプレッドシートから大量に呼ばれる可能性があるのでウェイトを入れておく
	Utilities.sleep(FETCH_WAIT);
	let response = ''
	try {
		response = UrlFetchApp.fetch(url, parameters);
	} catch (e) {
		Logger.log(e.toString());
		return 'DeepL:Exception';
	}

	let response_code = response.getResponseCode().toString();

	Logger.log(response_code + ':' + url);

	if (response_code != 200)
		return 'DeepL:HTTP Error(' + response_code + ')'

		// JSONからテキストを取り出す
	let json = JSON.parse(response.getContentText('UTF-8'));

  let source_lang = json.translations[0].detected_source_language
	if (source_lang == 'JA') {
    Logger.log("JA→EN：" + json.translations[0].text);
		return json.translations[0].text;
	} else {
		let content_new = encodeURI('auth_key=' + API_KEY + '&text=' + t
				+ '&source_lang=' + src + '&target_lang=ja');
		const parameters_new = {
			"method" : "post",
			"headers" : postheader,
			'payload' : content_new
		}

		// スプレッドシートから大量に呼ばれる可能性があるのでウェイトを入れておく
		Utilities.sleep(FETCH_WAIT);
		try {
			response = UrlFetchApp.fetch(url, parameters_new);
		} catch (e) {
			Logger.log(e.toString());
			return 'DeepL:Exception';
		}

		let response_code_new = response.getResponseCode().toString();

		Logger.log(response_code_new + ':' + url);

		if (response_code_new != 200)
			return 'DeepL:HTTP Error(' + response_code_new + ')'

			// JSONからテキストを取り出す
		let json_new = JSON.parse(response.getContentText('UTF-8'));
		Logger.log("EN→JA：" + json_new.translations[0].text);
    return json_new.translations[0].text;
	};
}

function deepltranslateBase(text) {
	return deepltranslate(text, '', 'en');
}

function deepltranslateje(text) {
	return deepltranslate(text, 'ja', 'en');
}

function deepltranslateej(text) {
	return deepltranslate(text, 'en', 'ja');
}

async function doPost(e) {
	for (let i = 0; i < JSON.parse(e.postData.contents).events.length; i++) {
		const event = JSON.parse(e.postData.contents).events[i];
		const message = await
		eventHandle(event);
		// 応答するメッセージがあった場合
		if (message !== undefined) {
			const replyToken = event.replyToken;
			const replyUrl = "https://api.line.me/v2/bot/message/reply";
			UrlFetchApp.fetch(replyUrl, {
				headers : {
					"Content-Type" : "application/json; charset=UTF-8",
					Authorization : "Bearer " + ACCESS_TOKEN,
				},
				method : "post",
				payload : JSON.stringify({
					replyToken : replyToken,
					messages : [ message ],
				}),
			});
		}
	}
	return ContentService.createTextOutput(JSON.stringify({
		content : "post ok"
	})).setMimeType(ContentService.MimeType.JSON);
}

async function eventHandle(event) {
	let message;
	console.log(event)
	switch (event.type) {
	case "message":
		message = await
		messagefunc(event);
		break;
	case "postback":
		message = await
		postbackFunc(event);
		break;
	case "follow":
		message = await
		followFunc(event);
		break;
	case "unfollow":
		message = unfolowFunc(event);
		break;
	}
	return message;
}
// メッセージイベントの処理
async function messagefunc(event) {
	if (event.message.type !== 'text') {
		return;
	}
	if (event.message.text.slice(0, 8) === 'https://') {
		return;
	}

	// let isJapanese = false;
	let message = "";
	// for (var i = 0; i < event.message.text.toString().length; i++) {// 言語判別
	// 	// if(40959 >= event.message.text.toString().charCodeAt(i) >= 11776 ||
	// 	// 64255 >= event.message.text.toString().charCodeAt(i) >= 63744 ||
	// 	// 65535 >= event.message.text.toString().charCodeAt(i) >= 65024) {
	// 	// isJapanese = true;
	// 	// break;
	// 	// }
	// 	if (event.message.text.toString().charCodeAt(i) >= 11776) {
	// 		isJapanese = true;
	// 		break;
	// 	}
	// }
	// switch (isJapanese) {
	// case true:
	// 	message = deepltranslateje(event.message.text);
	// 	break;
	// case false:
	// 	message = deepltranslateej(event.message.text);
	// 	break;
	// }
	message = deepltranslateBase(event.message.text);
	return {
		type : "text",
		text : message
	};
}
// ポストバックイベントの処理
async function postbackFunc(event) {
	return {
		type : "text",
		text : event.postback.data
	};
}
// 友達登録時の処理
async function followFunc(event) {
	return {
		type : "text",
		text : "友達登録ありがとうございます!!"
	};
}
// 友達解除後の処理
async function unfollowFunc() {
	return undefined;
}
