/**
 * @name ВДиске
 * @author lolmap
 * @description Интегрирует мессенджер ВКонтакте в Дискорд
 * @version 0.0.1
 * @source https://github.com/lolomap/VDisce
 */

var vk_module = require('./node_modules/vk-io');
var vk_auth_module = require('./node_modules/@vk-io/authorization')
const callbackService = new vk_module.CallbackService();
const direct = new vk_auth_module.DirectAuthorization({
	callbackService,

	clientId: 3697615,
	clientSecret: 'AlVXZFMUqyrnABp8ncuU',

	login: '',
	password: '',
	scope: 'messages,offline'
});
const vk = new vk_module.VK({
	token: 'token'
})

module.exports = class VDisce {

    load() {} // Optional function. Called when the plugin is loaded in to memory

    async vk_auth()
    {
		const response = await direct.run();
		console.log(response.token);
		return response.token;
	}

    popup(msg, context, user)
    {
    	console.log('USER_NAME:', user);
    	var send_msg = '';
    	const e = BdApi.React.createElement;

    	var h1 = function(x) {return e("h1", null, x);}
    	var b = function(x) {return e("b", null, x);}
    	var br = function() {return e("br", null);}
    	var input = function() {return e("input", {type: 'text',
    		onChange: function(syntheticEvent) {send_msg = syntheticEvent.target.value} }); }
    	var button = function(x) {return e("button", {
    		onClick: async function() {
    			if (send_msg != '')
    			{
    				console.log('BUTTON WORKS');
    				await context.send(send_msg);
    				console.log("MESSAGE FOR SEND:", send_msg);

    			}
    		}}, x);}

    	var content =
    	[
    		user,
    		'Новое сообщение:',
    		br(),
    		msg,
    		br(),
    		input(),
    		button('Отправить')
    	];
    	BdApi.alert('ВДиске', content);
    }

    // Required function. Called when the plugin is activated (including after reloads)s
    async start() 
    {
    	/*var is_auth = true;//BdApi.loadData('VDisce', 'is_auth');
    	var token = '';
    	if (is_auth)
    		{token = BdApi.loadData('VDisce', 'token');}
    	else
    		{
    			var res = this.vk_auth();
    			token = res;
    			BdApi.saveData('VDisce', 'token', token);
    			BdApi.saveData('VDisce', 'is_auth', true);
    		}*/
    	
    	var message = '';
    	var user='';
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
	    		await this.popup(message, context, user_name);
	    	}
    	})
    	await vk.updates.start();
    }

    stop() {} // Required function. Called when the plugin is deactivated

    observer(changes) {} 
    // Optional function. Observer for the `document`. 
    //Better documentation than I can provide is found here: <https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver>
}