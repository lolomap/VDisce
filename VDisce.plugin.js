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

var createDialogTab = function(name, uid)
{
	let existed_elem = document.getElementById("vdisce-tab-"+name);
	//
	//
	if(existed_elem !== null)
		return false;
	let call_oDW = function() {openDialogWin(uid);}
	var TabElement = e("a", {
		class:"channel-2QD9_O da-channel container-2Pjhx- da-container clickable-1JJAn8 da-clickable",
		/*aria-label:name+" (личное сообщение)",
		aria-aetsize:4,
		aria-posinset:2,*/
		id:"private-channels-1",
		tabindex:-1,
		role:"listitem",
		onClick: call_oDW
		//href:"/channels/@me/0"
	}, e("div", {class:"layout-2DM8Md da-layout"}, 
		e("div", {class:"content-3QAtGj da-content"}, 
			e("div", {class:"nameAndDecorators-5FJ2dg da-nameAndDecorators"}, 
				e("div", {class:"name-uJV0GL da-name"}, 
					e("div", {class:"overflow-WK9Ogt da-overflow"}, name))))));
	var DialogPanel = document.querySelector("[class='content-3YMskv da-content']");
	//DialogPanel.innerHTML = DialogPanel.innerHTML + TabElement;
	var SpaceForE = document.createElement("div");
	SpaceForE.setAttribute('id', 'vdisce-tab-'+name)
	var first_dialog = document.querySelector("[class='privateChannelsHeaderContainer-3NB1K1 da-privateChannelsHeaderContainer container-2ax-kl da-container']");
	DialogPanel.insertBefore(SpaceForE, first_dialog);
	BdApi.ReactDOM.render(TabElement, document.getElementById('vdisce-tab-'+name));
}

var openDialogWin = async function(uid)
{
	var friens_list_div = document.querySelector("[class='container-1D34oG da-container']");
	var chat_div = e("div", {class:"chat-3bRxxu da-chat", id: "vdisce-dialog", vkid: uid});
	if (friens_list_div)
		BdApi.ReactDOM.render(chat_div, friens_list_div);
	else
		BdApi.ReactDOM.render(chat_div, document.querySelector("[class='chat-3bRxxu da-chat']"))
	document.getElementById("vdisce-dialog").innerHTML = '<div class="messagesWrapper-1sRNjr da-messagesWrapper group-spacing-16"><div class="scroller-2LSbBU da-scroller auto-Ge5KZx scrollerBase-289Jih disableScrollAnchor-3V9UtP" dir="ltr" data-jump-section="global" tabindex="-1" style="overflow: hidden scroll; padding-right: 0px;"><div class="scrollerContent-WzeG7R da-scrollerContent content-3YMskv da-content"><div class="scrollerInner-2YIMLh da-scrollerInner" aria-label="Сообщения на " role="log" aria-orientation="vertical" data-list-id="chat-messages" tabindex="0" aria-live="off"></div></div></div></div><form class="form-2fGMdU da-form"><div class="channelTextArea-rNsIhG da-channelTextArea channelTextArea-2VhZ6z da-channelTextArea"><div class="scrollableContainer-2NUZem webkit-HjD9Er da-webkit"><div class="inner-MADQqc da-inner sansAttachButton-td2irx da-sansAttachButton"><div class="textArea-12jD-V da-textArea textAreaSlate-1ZzRVj da-textAreaSlate slateContainer-3Qkn2x da-slateContainer"><div class="placeholder-37qJjk da-placeholder fontSize16Padding-3Wk7zP" aria-hidden="true"></div><div aria-label="" aria-multiline="true" data-can-focus="true" data-slate-editor="true" data-key="20" contenteditable="true" class="markup-2BOw-j da-markup slateTextArea-1Mkdgw da-slateTextArea fontSize16Padding-3Wk7zP" autocorrect="off" spellcheck="true" role="textbox" data-gramm="false" style="outline: none; white-space: pre-wrap; overflow-wrap: break-word; -webkit-user-modify: read-write-plaintext-only;"><div data-slate-object="block" data-key="21" style="position: relative;"><span data-slate-object="text" data-key="22"><span data-slate-leaf="true" data-offset-key="22:0"><span data-slate-zero-width="z" data-slate-length="0">&#65279;<br></span></span></span></div></div></div></div></div></div></form>';
	let msg_space = document.getElementById("vdisce-dialog").querySelector("[class='scrollerInner-2YIMLh da-scrollerInner']");
	let spacer = document.createElement("div");
	spacer.setAttribute("class", "scrollerSpacer-avRLaA da-scrollerSpacer");
	msg_space.insertBefore(spacer, msg_space.lastChild);
	
	let msgList = (await vk.api.messages.getHistory({count: 200, user_id: uid, extended: 1})).items;
	let usr = (await vk.api.users.get({user_ids: uid}))[0];
	for (var i = 0; i < msgList.length; i++) {
		if(msgList[i].from_id == self.id)
			createMessageBox(self.first_name + " " + self.last_name, msgList[i].text);
		else if(msgList[i].from_id == uid)
			createMessageBox(usr.first_name + " " + usr.last_name, msgList[i].text);
	}

	let input_el = document.getElementById("vdisce-dialog").querySelector("[class='markup-2BOw-j da-markup slateTextArea-1Mkdgw da-slateTextArea fontSize16Padding-3Wk7zP']");
	
	var insend = async function(e)
	{
		//console.log("key pressed");
		if (e.keyCode == 13)
		{
			console.log("ENTER WAS PRESSED");
			console.log(input_el.value);
			rand_id = Math.floor(Math.random() * Math.floor(1000000000));
			await vk.api.messages.send({user_id: uid, random_id: rand_id, message: input_el.value});
			input_el.value = "";
		}
	}
	input_el.addEventListener('onkeyup', insend, false);
	//console.log(input_el);
}

var createMessageBox = function(name, msg)
{
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
			},[
				e("h2", {class: "header-23xsNx da-header"},
					e("span", {class: "headerText-3Uvj1Y da-headerText"},
						e("span", {class: "username-1A8OIy da-username clickable-1bVtEA da-clickable", tabindex: "0"}, name))),
				e("div", {class: "markup-2BOw-j da-markup messageContent-2qWWxC da-messageContent"}, msg)
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
			createDialogTab(user_name);
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
				if (!UserData.includes(user.id))
				{
					UserData.push(user.id);
					renderUser(user);
					BdApi.saveData("VDisce", "UserData", UserData);

				}
				if(document.getElementById("vdisce-dialog") !== null && document.getElementById("vdisce-dialog").vkid == user.id.toString())
					createMessageBox(from_user.first_name + " " + from_user.last_name, context.text);
			}
		})
		await vk.updates.start();
	}

	async render()
	{
		var renderUsers = async function()
		{
			let users = (await vk.api.users.get({user_ids: UserData}));
			//
			for (var i = 0; i < users.length; i++) {
				let user_name = users[i].first_name + ' ' + users[i].last_name;
				createDialogTab(user_name, users[i].id);
			}
		}
		
		var UserDataLoaded = BdApi.loadData("VDisce", "UserData");
		if (Array.isArray(UserDataLoaded))
			UserData = UserDataLoaded;
		renderUsers();
	}

	async bind_process()
	{
		
		vk = new vk_module.VK({
			token: access_token
		})
		
		self = (await vk.api.account.getProfileInfo());

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