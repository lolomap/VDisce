/**
 * @name ВДиске
 * @author lolmap
 * @description Интегрирует мессенджер ВКонтакте в Дискорд
 * @version 2.0.0
 * @source https://github.com/lolomap/VDisce
 */

var vk_module = require('./node_modules/vk-io');
var vk_auth_module = require('./node_modules/@vk-io/authorization')

const e = BdApi.React.createElement;
var h1 = function(x) {return e("h1", null, x);}
var br = function() {return e("br", null);}
var b = function(x) {return e("b", {style: {color: "white"}}, x);}

var callbackService = null;
var direct = null;

var vk = null;
var access_token = null;

var login_ = '';
var password_ = '';
var self;

let UserData = [];
var process_id = -1;

var msg_input_text = "";

var log = function(...x){console.log("%c[VDisce]", "color: blue; font-style: italic;", x);}

function sleep(ms) 	
{
  return new Promise(resolve => setTimeout(resolve, ms));
}


var createDialogTab = function(name, uid, profile_image)
{
	let existed_elem = document.getElementById("vdisce-tab-"+name);
	if(existed_elem !== null)
		return false;
	let call_oDW = function() {openDialogWin(uid);}
	var TabElement = e("a", {
		class:"channel-2QD9_O da-channel container-2Pjhx- da-container clickable-1JJAn8 da-clickable",
		id:"private-channels-1",
		tabindex:-1,
		role:"listitem",
		onClick: call_oDW
	}, e("div", {class:"layout-2DM8Md da-layout"}, 
		[
			e("div", {role: "img", style: {width: "50px", height: "50px"}},
				e("img", {src: profile_image, class: "avatar-1BDn8e da-avatar clickable-1bVtEA da-clickable"})),
			e("div", {class:"content-3QAtGj da-content"}, 
				e("div", {class:"nameAndDecorators-5FJ2dg da-nameAndDecorators"}, 
					e("div", {class:"name-uJV0GL da-name"}, 
						e("div", {class:"overflow-WK9Ogt da-overflow"}, name))))
		]));
	var DialogPanel = document.querySelector("[class='content-3YMskv da-content']");
	var SpaceForE = document.createElement("div");
	SpaceForE.setAttribute('id', 'vdisce-tab-'+name)
	var first_dialog = document.querySelector("[class='privateChannelsHeaderContainer-3NB1K1 da-privateChannelsHeaderContainer container-2ax-kl da-container']");
	DialogPanel.insertBefore(SpaceForE, first_dialog);
	BdApi.ReactDOM.render(TabElement, document.getElementById('vdisce-tab-'+name));
}

var photos_at_count = 0;
var photos_loaded = 0;
var getContentFromMessage = async function(msg)
{
	const max_image_size = 400;
	let content = {};
	content.text = [e("span", null ,msg.text), br()];
	content.images = [];
	content.doc = [];
	content.wall = [];
	if(typeof msg !== "undefined" && typeof msg.attachments !== "undefined")
	{
		photos_at_count++;
		let forwarded;
		if(false)//typeof msg.fwd_messages !== "undefined")
		{
			if(msg.fwd_messages.length > 0)
			{
				forwarded = (await getTextForFwd(msg));
			}
			content.text.push(forwarded);
		}

		for (var j = 0; j < msg.attachments.length; j++)
		{
			let atinfo = msg.attachments[j];
			if (atinfo.type == "photo")
			{
				photos_at_count++;
				let sizes_count = atinfo.photo.sizes.length;
				let max_size = atinfo.photo.sizes[sizes_count - 1].url;
				content.images.push(e("img", {src: atinfo.photo.sizes[0].url,
					onClick: function()
					{
						let iw;
						let ih;
						if (atinfo.photo.sizes[sizes_count-1].width > atinfo.photo.sizes[sizes_count-1].height * 1.5)
							iw = true;
						else iw = false;
						if (atinfo.photo.sizes[sizes_count-1].height > document.documentElement.clientHeight / 1.5)
							ih = true;
						else ih = false;
						openPhoto(max_size, iw, ih);
					},
					onLoad: function()
					{
						photos_loaded++;
						if (photos_at_count === photos_loaded)
							scrollMessagesBottom();
					}}));
				content.images.push(br());
			}
			else if (atinfo.type == "doc")
			{
				let doc_el =
				e("div", {class: "container-1ov-mD da-container"},
					e("div", {class: "attachment-33OFj0 horizontal-2EEEnY flex-1O1GKY directionRow-3v3tfG alignCenter-1dQNNs da-attachment da-horizontal da-flex da-directionRow da-alignCenter embedWrapper-lXpS3L da-embedWrapper"},
						e("div", {class: "attachmentInner-3vEpKt da-attachmentInner"},
							e("div", {class: "filenameLinkWrapper-1-14c5 da-filenameLinkWrapper"},
								e("a",
									{
										rel: "noreferrer noopener",
										target: "_blank",
										href: atinfo.doc.url,
										class: "anchor-3Z-8Bb da-anchor anchorUnderlineOnHover-2ESHQB da-anchorUnderlineOnHover fileNameLink-9GuxCo da-fileNameLink"
									},
									atinfo.doc.title
								)
							)
						)
					)
				);
				content.doc.push(doc_el);
				content.doc.push(br());
			}
			else if (atinfo.type == "sticker")
			{
				photos_at_count++;
				content.images.push(e("img", {src: atinfo.sticker.images[atinfo.sticker.images.length - 2].url,
					onLoad: function()
					{
						photos_loaded++;
						if (photos_at_count === photos_loaded)
							scrollMessagesBottom();
					}}));
				content.images.push(br());
			}
			else if (atinfo.type == "wall")
			{
				try
				{
					let post = (await vk.api.wall.getById({posts: atinfo.wall.to_id + "_" + atinfo.wall.id}))[0];
					let post_content = (await getContentFromMessage(post));
					content.wall.push(
						[
							textToQuote(post_content.text),
							textToQuote(post_content.images),
							textToQuote(post_content.doc),
							textToQuote(post_content.wall),
							br()
						]);
				}
				catch(err)
				{
					content.wall.push([e("b", null, "Запись со стены не доступна"), br()]);
					log(err);
				}
			}
		}
	}
	return content;
}

var textToQuote = function(text)
{
	let elem =
		e("div",{class: "blockquoteContainer-U5TVEi da-blockquoteContainer slateBlockquoteContainer-u5zDDJ da-slateBlockquoteContainer"},
			[
				e("div",
					{
						contenteditable: false,
						class: "blockquoteDivider-2hH8H6 da-blockquoteDivider"
					}
				),
				e("blockquote", null, text)
			]
		);
	return elem;
}

var getTextForFwd = async function(msg)
{
	let txt = [];
	if(typeof msg.fwd_messages !== "undefined")
	{
		for (var i = 0; i < msg.fwd_messages.length; i++)
		{
			let cntnt = (await getContentFromMessage(msg.fwd_messages[i]));
			let uinfo = (await vk.api.messages.getById({message_ids: msg.fwd_messages[i].id, extended: true})).profiles[0];
			let name = uinfo.first_name + " " + uinfo.last_name;
			let out = 
			[
				e("span", {class: "username-1A8OIy da-username clickable-1bVtEA da-clickable", tabindex: "0"}, name),
				br(),
				cntnt.text,
				cntnt.images,
				cntnt.doc
			];
			txt.push(textToQuote(out));
			txt.push(textToQuote((await getTextForFwd(msg.fwd_messages[i]))));
		}
	}
	return txt;
}

var openPhoto = async function(url, isWidth, isHeight)
{
	let pageWidth = document.documentElement.clientWidth;
	let pageHeight = document.documentElement.clientHeight;
	let neededHeight = Math.round(pageHeight / 1.5);
	let neededWidth = Math.round(pageWidth / 1.75);
	let img_element;
	let arg = {}
	if(isWidth)
		arg.width = neededWidth;
	if (isHeight)
		arg.height = neededHeight;
	arg.src = url;
	img_element = e("img", arg);
	await BdApi.alert("ВДиске", e("div", {id: "vdisce-photo-alert"}));
	let container = document.querySelector("[class='root-1gCeng da-root small-3iVZYw fullscreenOnMobile-1bD22y da-fullscreenOnMobile']");
	container.setAttribute("class", "root-1gCeng da-root fullscreenOnMobile-1bD22y da-fullscreenOnMobile")
	BdApi.ReactDOM.render(img_element, document.getElementById("vdisce-photo-alert").parentElement);
	let button = document.querySelector("[class='button-38aScr da-button lookFilled-1Gx00P colorRed-1TFJan sizeMedium-1AC_Sl grow-q77ONN da-grow']");
	button.textContent = "ОК";
}

var scrollMessagesBottom = function()
{
	let msg_space = document.getElementById("vdisce-dialog").querySelector("[class='scroller-2LSbBU da-scroller auto-Ge5KZx scrollerBase-289Jih disableScrollAnchor-3V9UtP']");
	msg_space.scrollTop = msg_space.scrollHeight;
	//msg_space.lastChild.scrollIntoView(false);

}
var isScrolled = function()
{
	let msg_space = document.getElementById("vdisce-dialog").querySelector("[class='scroller-2LSbBU da-scroller auto-Ge5KZx scrollerBase-289Jih disableScrollAnchor-3V9UtP']");
	if(msg_space.scrollHeight - msg_space.scrollTop === msg_space.clientHeight)
		return true;
	else return false;
}

var openDialogWin = async function(uid)
{
	photos_at_count = 0;
	photos_loaded = 0;
	var friens_list_div = document.querySelector("[class='container-1D34oG da-container']");
	var chat_div = e("div", {class:"chat-3bRxxu da-chat", id: "vdisce-dialog", vkid: uid});
	if (friens_list_div)
		BdApi.ReactDOM.render(chat_div, friens_list_div);
	else
		BdApi.ReactDOM.render(chat_div, document.querySelector("[class='chat-3bRxxu da-chat']"))
	document.getElementById("vdisce-dialog").innerHTML = '<div class="messagesWrapper-1sRNjr da-messagesWrapper group-spacing-16"><div class="scroller-2LSbBU da-scroller auto-Ge5KZx scrollerBase-289Jih disableScrollAnchor-3V9UtP" dir="ltr" data-jump-section="global" tabindex="-1" style="overflow: hidden scroll; padding-right: 0px;"><div class="scrollerContent-WzeG7R da-scrollerContent content-3YMskv da-content"><div class="scrollerInner-2YIMLh da-scrollerInner" aria-label="Сообщения на " role="log" aria-orientation="vertical" data-list-id="chat-messages" tabindex="0" aria-live="off"></div></div></div></div><div id="vdisce-input-form"><input id="vdisce-input-msg"></input></div>';
	let msg_space = document.getElementById("vdisce-dialog").querySelector("[class='scrollerInner-2YIMLh da-scrollerInner']");
	let spacer = document.createElement("div");
	spacer.setAttribute("class", "scrollerSpacer-avRLaA da-scrollerSpacer");
	msg_space.insertBefore(spacer, msg_space.lastChild);
	
	let incontainer = document.getElementById("vdisce-input-form");
	incontainer.setAttribute("style", "padding: 16px; height: 5%");
	let input_el = document.getElementById("vdisce-input-msg");
	let inputStyle = "background: #40444b;font-size: 100%;color: white;border-radius: 8px;border: 0px;width: 100%;height: 75%;";
	input_el.setAttribute("style", inputStyle);
	input_el.setAttribute("placeholder", "Написать пользователю");
	var insend = async function(e)
	{
		//log("key pressed");
		if (e.keyCode == 13)
		{
			rand_id = Math.floor(Math.random() * Math.floor(1000000000));
			await vk.api.messages.send({user_id: uid, random_id: rand_id, message: input_el.value});
			input_el.value = "";
		}
	}
	input_el.onkeyup = insend;

	let msgList = [];
	let block = [];
	let n = 0;
	/*
	do*/
	{
		block = (await vk.api.messages.getHistory({count: 200, user_id: uid, extended: 1, rev: 0, offset: n})).items;
		//log(block);
		for (var i = 0; i < block.length; i++) {
			msgList.push(block[i]);
		}
		n = n + 200;
	}
	/*while (block.length == 200)*/

	
	let usr = (await vk.api.users.get({user_ids: uid, fields: "photo_50"}))[0];
	let content;
	for (var i = 0; i < msgList.length; i++)
	{
		content = (await getContentFromMessage(msgList[i]));
		if(msgList[i].from_id == self.id)
			createMessageBox(self.first_name + " " + self.last_name, content, self.photo_50);
		else if(msgList[i].from_id == uid)
			createMessageBox(usr.first_name + " " + usr.last_name, content, usr.photo_50);
	}

	if(photos_at_count === 0)
		scrollMessagesBottom();
}

var createMessageBox = function(name, msg, profile_image)
{
	let out = 
	[
		msg.text,
		msg.images,
		msg.doc,
		msg.wall
	];
	var box = e("div",
		{
			class:"message-2qnXI6 da-message cozyMessage-3V1Y8y da-cozyMessage groupStart-23k01U da-groupStart wrapper-2a6GCs da-wrapper cozy-3raOZG da-cozy zalgo-jN1Ica da-zalgo",
			role:"listitem",
			tabindex:"-1"
		},
		e("div",
			{
				class: "contents-2mQqc9 da-contents",
				role: "document"
			},
			[
				e("img", {class: "avatar-1BDn8e da-avatar clickable-1bVtEA da-clickable", alt: " ", src: profile_image,
					onLoad: function()
					{
						photos_loaded++;
						if (photos_at_count === photos_loaded)
							scrollMessagesBottom();
					}}),
				e("h2", {class: "header-23xsNx da-header"},
					e("span", {class: "headerText-3Uvj1Y da-headerText"},
						e("span", {class: "username-1A8OIy da-username clickable-1bVtEA da-clickable", tabindex: "0"}, name))),
				e("div", {class: "markup-2BOw-j da-markup messageContent-2qWWxC da-messageContent"}, out)
			]));
	var chat_div = document.getElementById("vdisce-dialog").querySelector("[class='scrollerInner-2YIMLh da-scrollerInner']");
	var space = document.createElement("div");
	chat_div.insertBefore(space, chat_div.firstChild);
	BdApi.ReactDOM.render(box, space);
}

module.exports = class VDisce {

	async button_bind()
	{
		callbackService = new vk_module.CallbackService();
		direct = new vk_auth_module.DirectAuthorization({
			callbackService,

			clientId: 3697615,
			clientSecret: 'AlVXZFMUqyrnABp8ncuU',

			login: login_,
			password: password_,
			scope: 'photos,users,messages,offline'
		});
		var container_element = document.getElementById("auth_panel_vdisce");
		try
		{
			var response = (await direct.run());
			
			access_token = response.token;
			container_element.innerHTML = '<b style="color:white">Вы успешно авторизировались</b>';	
		}
		catch(err)
		{
			container_element.innerHTML = '<b style="color:white">Ошибка авторизации</b><br>'
				+'<p style="color:white">'+err.message+'</p><br>'
				+'<b style="color:white">Перезапустите плагин</b>';
			return false;
		}
		BdApi.saveData('VDisce', 'token', access_token);
		BdApi.saveData('VDisce', 'is_auth', true);
		this.bind_process();
	}

	auth()
	{
		var button_event = function() {this.button_bind();}
    	button_event = button_event.bind(this);
	    var panel = function(x) {return e("div", {id: "auth_panel_vdisce"}, x)}
    	var in_login = function() {return e("input", {type: 'text',
    		onChange: function(syntheticEvent) {login_ = syntheticEvent.target.value} }); }
    	var in_password = function() {return e("input", {type: 'password',
    		onChange: function(syntheticEvent) {password_ = syntheticEvent.target.value} }); }
    	var button = function(x) {return e("button", {onClick: button_event}, x);}

    	var content = 
    	[
    		b('Логин:'),
    		br(),
    		in_login(),
    		br(),
    		b('Пароль:'),
    		br(),
    		in_password(),
    		br(),
    		button('Войти')
    	]

    	BdApi.alert('Авторизация ВКонтакте', panel(content));
	}

	async process()
	{
		process_id = process_id + 1;
		if (process_id > 0)
			return false;

		var testAuth = async function()
		{
			try
			{
				var user = (await vk.api.users.get({user_ids: 0}));
				return true;
			}
			catch(err)
			{
				
				return false;
			}
		}

		var renderUser = function(uobj)
		{
			let user_name = uobj.first_name + ' ' + uobj.last_name;
			createDialogTab(user_name, uobj.photo_50);
		}

		if(!(await testAuth()))
		{
			BdApi.alert("ВДиске", "Ошибка авторизации. Перезапустите плагин");
			return false;
		}


		vk.updates.stop();
		vk.updates.on("message_new", async(context) =>
		{
			if (context.isFromUser)// && context.payload.message.random_id == 0)
			{
				let user = (await vk.api.users.get({user_ids: context.senderId}))[0];
				
				let from_user;
				if (context.payload.message.random_id != 0)
					from_user = self;
				else
					from_user = user;

				if(document.getElementById("vdisce-dialog") !== null && document.getElementById("vdisce-dialog").getAttribute("vkid") == user.id.toString())
				{
					//log(context);
					let message_full_info = (await vk.api.messages.getById({message_ids: context.payload.message.id})).items[0];
					let content = (await getContentFromMessage(message_full_info));
					createMessageBox(from_user.first_name + " " + from_user.last_name, content, from_user.photo_50);
					scrollMessagesBottom();
				}
			}
		})
		await vk.updates.start();
	}

	async render()
	{
		await sleep(1000);
		var isPrivate = document.querySelector("[class='privateChannels-1nO12o da-privateChannels']") !== null;
		//log("IsPrivate", isPrivate);
		if (!isPrivate)
			return false;

		let conv_users = []
		let all_conv = (await vk.api.messages.getConversations({count: 200})).items;
		for (var i = 0; i < all_conv.length; i++) {
			if (all_conv[i].conversation.peer.type == "user")
			{
				conv_users.push(all_conv[i].conversation.peer.id);
			}
		}

		let users = (await vk.api.users.get({user_ids: conv_users, fields: "photo_50"}));
		for (var i = 0; i < users.length; i++) {
			let user_name = users[i].first_name + ' ' + users[i].last_name;
			createDialogTab(user_name, users[i].id, users[i].photo_50);
		}
	}

	async bind_process()
	{
		
		vk = new vk_module.VK({
			token: access_token
		})
		
		self = (await vk.api.users.get({user_ids: (await vk.api.account.getProfileInfo()).id, fields: "photo_50"}));

		let MsgWinBtn = document.querySelectorAll("[class='listItem-2P_4kh da-listItem']");
		if(MsgWinBtn != null)
		{
			for (var i = 0; i < MsgWinBtn.length; i++) {
				let onclick = MsgWinBtn[i].getAttribute("onclick");
				MsgWinBtn[i].addEventListener('click', this.render, false);
			}
		}
		await this.process();
		await this.render();
	}

	unbind_process()
	{
		let MsgWinBtn = document.querySelectorAll("[class='listItem-2P_4kh da-listItem']");
		if(MsgWinBtn != null)
		{
			for (var i = 0; i < MsgWinBtn.length; i++) {
				let onclick = MsgWinBtn[i].getAttribute("onclick");
				MsgWinBtn[i].removeEventListener('click', this.process, false);
			}
		}
	}

    load() {} // Optional function. Called when the plugin is loaded in to memory

    // Required function. Called when the plugin is activated (including after reloads)s
    async start() 
    {
    	//this.createDialogTab("TIXon (VK)");
    	var is_auth = BdApi.loadData('VDisce', 'is_auth');
    	if (is_auth)
    	{
    		
    		access_token = BdApi.loadData('VDisce', 'token');
    		this.bind_process();
    	}
    	else
		{
			
			access_token = null;
			await this.auth();
		}
    }

    async stop()
    {
    	if (vk != null)
    	{
    		
    		vk.updates.stop();
    		this.unbind_process();
    	}
    }

    observer(changes) {} 
    // Optional function. Observer for the `document`.
}