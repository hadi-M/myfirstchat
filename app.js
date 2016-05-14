var express = require('express');  
var app = express();  
var server = require('http').createServer(app);  
var io = require('socket.io')(server);

app.use('/pub', express.static(__dirname + '/pub'));
app.use(express.static(__dirname + '/bower_components'));  
app.get('/', function(req, res,next) {  
	res.sendFile(__dirname + '/index.html');
});

server.listen(process.argv[2]);

var ID = 0;

var connected_clients = []; // [[1, 2], [3, 5]]
var chats = []; // [[1, 3, [pms]], pms = [[1, "text"], [3, "text"]]
var client_ID = []; // [1, 2, 3, 6]
var clients_sockets = {}; //{1: socket, 2:socket }
var blocks = {}; //{1:[3,4,5], 3:[9, 10, 11]}

Object.prototype.getKeyByValue = function( value ) {
	for( var prop in this ) {
		if( this.hasOwnProperty( prop ) ) {
			if( this[ prop ] === value )
				return prop;
		}
	}
}

var del_duplecate = function(arr) {
	for (var i=0; i< arr.length-1; i++) {
		if (arr[i] === arr[i+1]) {
			arr.splice(i, 1);
		}
	}
}

var check_existion = function(arr, source) {
	for (var i=0; i<source.length; i++) {
		if((arr[0] == source[i][0] && arr[1] == source[i][1]) || (arr[1] == source[i][0] && arr[0] == source[i][1])) {
			return true;
		}
	}
	return false;
}

var give_chats_index = function(ID_source, ID_dest) {
	var i =0;
	for (i = 0; i<chats.length; i++) {
		if ((chats[i][0] == ID_source && chats[i][1] == ID_dest) || (chats[i][1] == ID_source && chats[i][0] == ID_dest)) {
			return i;
		}
	}
}

var save_new_pm_or_give_pms = function(ID_source, ID_dest, text) {
	index = give_chats_index(ID_source, ID_dest);
	if(text !== "") {
		chats[index][2].push([ID_source, text]);
	}
	return chats[index][2];
}

var update_your_chats = function(ID_num, arr) {

}

io.on('connection', function(client) {  
	console.log('Client connected...');

	clients_sockets[ID] = client;
	client_ID.push(ID);
	// del_duplecate(client_ID);
	client.on('join', function() {
		console.log('client joined');
		client.emit("success", ID);
		ID += 1;
		console.log(ID);
	});

	client.on("disconnect", function() {
		ID_num = clients_sockets.getKeyByValue(client);
		console.log("client: "+ID_num+" got disconnected");
		delete clients_sockets[ID_num];
		client_ID.splice(client_ID.indexOf(parseInt(ID_num)), 1);
	})

	client.on('getlist' , function() {
		client.emit("list", client_ID);
		console.log("xsxsx");
	});

	client.on('connect_chat', function(data){
		dest_ID_num = data["dest_ID_num"]
		source_ID_num = data["source_ID_num"];
		if (check_existion([source_ID_num, dest_ID_num], connected_clients)) {
			client.emit("already_exist_chat");
		}
		else {
			clients_sockets[dest_ID_num].emit("request_chat", data["source_ID_num"]);
		}
	});

	client.on('chat_accepted', function(data){
		connected_clients.push([data["dest_ID_num"], data["source_ID_num"]]);
		chats.push([data["dest_ID_num"], data["source_ID_num"], []]);
		clients_sockets[data["dest_ID_num"].toString()].emit("chat_success", data["source_ID_num"]);
	});

	client.on('chat_declined', function(data){
		clients_sockets[data.toString()].emit("chat_failed");
	});

	client.on('request_pms', function(data){
		chat = save_new_pm_or_give_pms(data["source_ID_num"], data["dest_ID_num"], "");
		client.emit("take_pms", {"chat": chat, "relating_ID": data["dest_ID_num"]});
	});

	client.on('chat_message', function(data){
		chat = save_new_pm_or_give_pms(data["source_ID_num"], data["dest_ID_num"], data["text"]);
		clients_sockets[data["dest_ID_num"].toString()].emit("take_pms", {"chat": chat, "relating_ID": data["source_ID_num"]} );
		clients_sockets[data["source_ID_num"].toString()].emit("take_pms", {"chat": chat, "relating_ID": data["dest_ID_num"]});
	});

	client.on('terminate_chat', function(data){
		clients_sockets[data["dest_ID_num"].toString()].emit("terminate", {"relating_ID": data["source_ID_num"]} );
		var arr = [data["dest_ID_num"], data["source_ID_num"]];
		for (var i=0; i<connected_clients.length; i++) {
			if((arr[0] == connected_clients[i][0] && arr[1] == connected_clients[i][1]) || (arr[1] == connected_clients[i][0] && arr[1] == connected_clients[i][0])) {
				connected_clients.splice(i, 1);
				break;
			}
		}
		chats.splice(give_chats_index(data["dest_ID_num"], data["source_ID_num"]), 1);
	});

	client.on('block', function(data){
		clients_sockets[data["dest_ID_num"].toString()].emit("blocked", {"relating_ID": data["source_ID_num"]} );
		if (blocks[data["dest_ID_num"].toString()]=== undefined) {
			blocks[data["dest_ID_num"].toString()] = [];				
		}
		blocks[data["dest_ID_num"].toString()].push(data["source_ID_num"]);
	});

	client.on('unblock', function(data){
		clients_sockets[data["dest_ID_num"].toString()].emit("unblocked", {"relating_ID": data["source_ID_num"]} );
	});

});