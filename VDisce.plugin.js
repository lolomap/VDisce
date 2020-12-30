/**
 * @name ВДиске
 * @author lolmap
 * @description Интегрирует мессенджер ВКонтакте в Дискорд
 * @version 0.0.1
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


module.exports = class VDisce {

    load() {} // Optional function. Called when the plugin is loaded in to memory

    popup(msg, context, user)
	{
		console.log('USER_NAME:', user);
		var send_msg = '';

		var user_text = function(x) {return e("b", {id: 'user_name_vdisce', style: {color: "white"}}, x);}
		var msg_text = function(x) {return e("b", {id: 'message_text_vdisce', style: {color: "white"}}, x);}
		var is_attachments_text = function(x) {return e("b", {id: 'is_attachments_vdisce', style: {color: "white"}}, x);}
		var input = function() {return e("input", {id: 'send_input', type: 'text',
			onChange: function(syntheticEvent) {send_msg = syntheticEvent.target.value} }); }
		var button = function(x) {return e("button", {
			onClick: async function() {
				if (send_msg != '')
				{
					console.log('BUTTON WORKS');
					await context.send(send_msg);
					console.log("MESSAGE FOR SEND:", send_msg);
					document.getElementById('send_input').value = '';
				}
			}}, x);}


		var content =
		[
			b('Новые сообщения:'),
			br(),
			user_text(user),
			br(),
			br(),
			msg_text(msg),
			br(),
			br()
		];

		if (context.payload.message.attachments.length > 0)
		{
			content.push(is_attachments_text('Есть прикрепленные вложения'));
			content.push(br());
		}
		else
		{
			content.push(is_attachments_text(''));
			content.push(br());
		}

		content.push(input());
		content.push(button('Отправить'));

		BdApi.alert('ВДиске', content);
	}

	re_popup(msg, context, user)
	{
		console.log('USER_NAME:', user);
		document.getElementById('user_name_vdisce').innerHTML = user;
		var msgs_element = document.getElementById('message_text_vdisce');
		msgs_element.innerHTML = msgs_element.innerHTML + "<br>" + msg;
		if (context.payload.message.attachments.length > 0)
			document.getElementById('is_attachments_vdisce').innerHTML = 'Есть прикрепленные вложенияа';
	}

	async process()
	{
		BdApi.saveData('VDisce', 'token', access_token);
		BdApi.saveData('VDisce', 'is_auth', true);

		console.log('ACCESS TOKEN',access_token);
		if (typeof(access_token) != typeof('string'))
		{
			console.log('TOKEN IS NOT STRING');
			BdApi.saveData('VDisce', 'is_auth', false);
			return;
		}
		console.log("Connecting VK...");
		vk = new vk_module.VK({
			token: access_token
		})
		console.log("VK is connected");
		var message = '';
		var user='';
		var last_user_name = '';
		var user_name = '';
		vk.updates.on('message_new', async(context) =>
		{
			console.log('CONTEXT:', context);
			console.log('payload:', context.payload);
			if (context.isFromUser && context.payload.message.random_id == 0)
			{
				message = context.text;
				user = (await vk.api.users.get({user_ids: context.senderId}))[0];
				user_name = user.first_name + ' ' + user.last_name;
				var win = document.getElementById('send_input');
				if (!win || last_user_name != user_name)
	    			await this.popup(message, context, user_name);
	    		else
	    		{
	    			console.log("POPUP BLOCKED");
	    			await this.re_popup(message, context, user_name);
	    		}
	    		last_user_name = user_name;
	    	}
		})
		await vk.updates.start();
	}

    async vk_auth()
    {
		const response = (await direct.run());
		console.log(response);
		return response.token;
	}

	async button_bind()
	{
		callbackService = new vk_module.CallbackService();
		direct = new vk_auth_module.DirectAuthorization({
			callbackService,

			clientId: 3697615,
			clientSecret: 'AlVXZFMUqyrnABp8ncuU',

			login: login_,
			password: password_,
			scope: 'messages,offline'
		});
		var container_element = document.getElementById("auth_panel_vdisce");
		try
		{
			var response = (await direct.run());
			console.log(response.token);
			access_token = response.token;
			container_element.innerHTML = '<b style="color:white">Вы успешно авторизировались</b>';	
		}
		catch
		{
			container_element.innerHTML = '<b style="color:white">Ошибка авторизации</b><br>'
				+'<b style="color:white">Перезапустите плагин</b>';
			return false;
		}
		await this.process();
    }

    async auth_popup()
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


    // Required function. Called when the plugin is activated (including after reloads)s
    async start() 
    {
    	var is_auth = BdApi.loadData('VDisce', 'is_auth');
    	if (is_auth)
    	{
    		console.log("USER IS AUTH");
    		access_token = BdApi.loadData('VDisce', 'token');
    		await this.process();
    	}
    	else
		{
			console.log("USER IS NOT AUTH");
			access_token = null;
			await this.auth_popup();
		}
    }

    async stop()
    {
    	if (vk != null) {await vk.updates.stop();}
    }

    observer(changes) {} 
    // Optional function. Observer for the `document`. 
    //Better documentation than I can provide is found here: <https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver>
}