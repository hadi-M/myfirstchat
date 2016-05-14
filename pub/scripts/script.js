$(document).ready(function() { 
	$("#IP_box #port").val(document.URL.split(':')[2].match(/\d+/)[0]);
	$("#IP_box button").click(function(e){
		e.preventDefault();
		ip = $("#ip").val() || "127.0.0.1";
		port = $("#port").val() || 4200;
		var socket = io.connect('http://'+ip+':'+port);
		var blocked_IDs = [];
		socket.on('connect', function(data) {
			socket.emit('join');
		});

		socket.on("success", function(ID){
			// alert("sadf");
			source_ID_num = ID;
			open_chat(ID);
		});
		socket.on("list", function(list) {
			console.log(list);
			text = "";
			for (var i=0; i<list.length; i++) {
				text += "ID" + list[i] + ", ";
			}
			text = text.substring(0, text.length-2);
			$("#list_modal span").html(text);
			$("#modal_hldr").fadeIn(300);
			$("#list_modal").fadeIn(300);
			$("#list_modal button").click(function() {
				$("#list_modal").fadeOut(300);
				$("#modal_hldr").fadeOut(400);
				$("#list_modal button").unbind("click");
			});
			$("#user_intercation").addClass("shown");
		});

		socket.on("request_chat", function(data_num) { //data is number
			// alert(data);
			$("#chat_request").fadeIn(300);
			$("#modal_hldr").fadeIn(300);
			$("#chat_request span").html(data_num);
			$("#chat_request .yep").unbind("click");
			$("#chat_request .yep").click(function(){
				$("#sender").fadeIn(300);
				$("#chat_request").fadeOut(300);
				$("#modal_hldr").fadeOut(400);
				socket.emit("chat_accepted", {"dest_ID_num": data_num, "source_ID_num": source_ID_num } );
				//###########
				text = "<li><div>ID"+data_num+"</li></div>";
				$(".users").prepend(text);
				$(".users li:first div").click(function() {
					if ( blocked_IDs.indexOf(parseInt($(this).html().substring(2))) !== -1) {
						$("#sender input").attr("disabled", "true").attr("placeholder", "You've blocked this guy").css("background-color", "rgb(200, 200, 200)");
						$("#sender").attr("action", "-1");
						$(this).parent().removeClass("selected");
						$(".pm").html("");
					}
					else {
						$("#sender input").removeAttr("disabled", "true").attr("placeholder", "").css("background-color", "rgb(238, 238, 238)")
						if(!$(this).parent().hasClass("blocked")) {
							$(".pm").html("");
							$("#sender").attr("action", data_num);
							$("li.selected").removeClass("selected");
							$(this).parent().addClass("selected");
							socket.emit("request_pms", {"dest_ID_num": data_num, "source_ID_num": source_ID_num})
						}
						else {
							$(".pm").html("");
							$("li.selected").removeClass("selected");
							$("#sender").attr("action", "-1");
						}
					}
				});
				$(".users li:first div").trigger("click");
			});
			$("#chat_request .nope").unbind("click");
			$("#chat_request .nope").click(function(){
				$("#chat_request").fadeOut(300);
				$("#modal_hldr").fadeOut(400);
				socket.emit("chat_declined", data_num);
			});
		});

		socket.on("chat_success", function(dest_ID_num) {
			// alert("success!");
			text = "<li><div>ID"+dest_ID_num+"</li></div>";
			$(".users").prepend(text);
			$(".users li:first div").click(function() {
				if ( blocked_IDs.indexOf(parseInt($(this).html().substring(2))) !== -1) {
					$("#sender input").attr("disabled", "true").attr("placeholder", "You've blocked this guy").css("background-color", "rgb(200, 200, 200)");
					$("#sender").attr("action", "-1");
					$("li.selected").removeClass("selected");
					$(".pm").html("");
				}
				else {
					$("#sender input").removeAttr("disabled", "true").attr("placeholder", "").css("background-color", "rgb(238, 238, 238)");
					if(!$(this).parent().hasClass("blocked")) {
						$(".pm").html("");
						$("#sender").fadeIn(300);
						$("#sender").attr("action", dest_ID_num);
						$("li.selected").removeClass("selected");
						$(this).parent().addClass("selected");
						socket.emit("request_pms", {"dest_ID_num": dest_ID_num, "source_ID_num": source_ID_num});
					};
				}
			});
			$(".users li:first div").trigger("click");
		});
		socket.on("chat_failed", function(){
			$("#chat_declined").fadeIn(300);
			$("#modal_hldr").fadeIn(300);
			$("#chat_declined button").click(function() {
				$("#chat_declined").fadeOut(300);
				$("#modal_hldr").fadeOut(400);
				$("#chat_declined button").unbind("click");
			});
		});

		socket.on("already_exist_chat", function() {
			$("#already_exist").fadeIn(300);
			$("#modal_hldr").fadeIn(300);
			$("#already_exist button").click(function() {
				$("#already_exist").fadeOut(300);
				$("#modal_hldr").fadeOut(400);
				$("#already_exist button").unbind("click");
			});
		});

		socket.on("take_pms", function(data){
			if (data["relating_ID"] === parseInt($("#sender").attr("action")) ) {
				var sum = "";
				for (var i = 0; i < data["chat"].length; i++) {
					template = `
					<div class="pm_text {{class}} clearfix">
					<div>
					<div class="name-hldr">
					<div class="name">ID{{ID_num}}</div>
					</div>
					<div class="text">
					{{text}}
					</div>
					</div>
					</div>
					`;
					if (data["chat"][i][0] == source_ID_num) {
						template = template.replace("{{class}}", "yours");
						template = template.replace("{{ID_num}}", source_ID_num);
					}
					else {
						template = template.replace("{{class}}", "his");
						template = template.replace("{{ID_num}}", data["chat"][i][0]);
					}
					template = template.replace("{{text}}", data["chat"][i][1]);
					sum += template;
				}
				$(".pm").html(sum);
			}
		});

		socket.on("terminate", function(data) {
			dest_ID_num = data["relating_ID"];
			user_btn = chat_exists(dest_ID_num);
			if (parseInt($("#sender").attr("action")) === dest_ID_num) {
				$(".pm").html("");
				$("#sender").fadeOut(300);
			}
			user_btn.parent().remove();
		});

		socket.on("blocked", function(data) {
			dest_ID_num = data["relating_ID"];
			user_btn = chat_exists(dest_ID_num);
			user_btn.parent().addClass("blocked");
			if (parseInt($("#sender").attr("action")) === dest_ID_num) {
				$(".pm").html("");
				// $("#sender").fadeOut(300);
				$("li.selected").removeClass("selected");
			}
		});

		socket.on("unblocked", function(data) {
			$(".blocked").removeClass("blocked");
		});

		var open_chat = function(ID) {
			$("#ID_modal span").html(ID);
			$("#terminal_ID").html("ID"+ID+':$ ');
			$("#modal_hldr").fadeIn(300);
			$("#ID_modal").fadeIn(300);
			$("#IP_box").addClass("closed");
			$("#ID_modal button").click(function() {
				$("#ID_modal").fadeOut(300);
				$("#modal_hldr").fadeOut(300);
				$("#ID_modal button").unbind("click");
			});
			$("#user_intercation").addClass("shown");
		}

		$("#terminal form").submit(function(e) {
			e.preventDefault();
			console.log("azaza");
			command = $("#terminal input").val();
			if(command == "GetList") {
				getlist();
			}
			else if(command.indexOf("Connect") > -1) {
				connect(command.split(" ")[1]);
			}
			else if(command.indexOf("TerminateChat") > -1) {
				terminate(command.split(" ")[1]);
			}
			else if(command.indexOf("Block") > -1) {
				block(command.split(" ")[1]);
			}
			else if(command.indexOf("Unblock") > -1) {
				unblock(command.split(" ")[1]);
			}
			else {
				$("#modal_hldr").fadeIn(300);
				$("#what").fadeIn(300);
				$("#IP_box").addClass("closed");
				$("#what button").click(function() {
					$("#what").fadeOut(300);
					$("#modal_hldr").fadeOut(300);
					$("#what button").unbind("click");
				});
			}
			$("#terminal input").val("");
		});

		$("#sender").submit(function(e) {
			e.preventDefault();
			console.log("sender");
			var text = $("#sender input").val();
			$("#sender input").val("");
			if (text !== "") {
				socket.emit('chat_message', {"dest_ID_num":parseInt($("#sender").attr("action")), "source_ID_num": source_ID_num, "text": text});
			}
		});

		var getlist = function () {
			socket.emit('getlist');
		};

		var connect = function (dest_ID) {
			dest_ID_num = parseInt(dest_ID.substring(2, dest_ID.length));
			if (source_ID_num === dest_ID_num) {
				$("#modal_hldr").fadeIn(300);
				$("#chat_yourself").fadeIn(300);
				$("#IP_box").addClass("closed");
				$("#chat_yourself button").click(function() {
					$("#chat_yourself").fadeOut(300);
					$("#modal_hldr").fadeOut(300);
					$("#chat_yourself button").unbind("click");
				});
			}
			else {
				socket.emit('connect_chat', {"source_ID_num": source_ID_num, "dest_ID_num": dest_ID_num});
			}//data snet is like "ID1" not only number
		};

		var chat_exists = function(ID_num) {
			for (var i = 0; i< $(".users li div").length; i++) {
				if (parseInt($($(".users li div")[i]).html().match(/\d+/)[0]) === ID_num) {
					return $($(".users li div")[i]);
				}
			}
			return -1;
		}

		var terminate = function(dest_ID) {
			dest_ID_num = parseInt(dest_ID.substring(2, dest_ID.length));
			user_btn = chat_exists(dest_ID_num);
			if (user_btn !== -1) {
				socket.emit('terminate_chat', {"source_ID_num": source_ID_num, "dest_ID_num": dest_ID_num});
				if (parseInt($("#sender").attr("action")) === dest_ID_num) {
					$(".pm").html("");
					$("#sender").fadeOut(300);

				}
				user_btn.parent().remove();
			}
			else {
				$("#modal_hldr").fadeIn(300);
				$("#doesnt_exist").fadeIn(300);
				$("#doesnt_exist button").click(function() {
					$("#doesnt_exist").fadeOut(300);
					$("#modal_hldr").fadeOut(400);
					$("#doesnt_exist button").unbind("click");
				});
			}
		}
		var block =  function(dest_ID) {
			dest_ID_num = parseInt(dest_ID.substring(2, dest_ID.length));
			if (blocked_IDs.indexOf(dest_ID_num) !== -1) {
				//already blocked
				$("#modal_hldr").fadeIn(300);
				$("#already_blocked").fadeIn(300);
				$("#IP_box").addClass("closed");
				$("#already_blocked button").click(function() {
					$("#already_blocked").fadeOut(300);
					$("#modal_hldr").fadeOut(300);
					$("#already_blocked button").unbind("click");
				});
			}
			else {
				blocked_IDs.push(dest_ID_num);
				if (dest_ID_num === parseInt($("#sender").attr("action")) ) {
					$(".pm").html("");
				}
				socket.emit("block", {"source_ID_num": source_ID_num, "dest_ID_num": dest_ID_num})
			}
		}

		var unblock =  function(dest_ID) {
			dest_ID_num = parseInt(dest_ID.substring(2, dest_ID.length));
			if(blocked_IDs.indexOf(dest_ID_num) !== -1) {
				socket.emit("unblock", {"source_ID_num": source_ID_num, "dest_ID_num": dest_ID_num})
				blocked_IDs.splice(blocked_IDs.indexOf(dest_ID_num), 1);
			}
			else {
				$("#modal_hldr").fadeIn(300);
				$("#wasnt_blocked").fadeIn(300);
				$("#IP_box").addClass("closed");
				$("#wasnt_blocked button").click(function() {
					$("#wasnt_blocked").fadeOut(300);
					$("#modal_hldr").fadeOut(300);
					$("#wasnt_blocked button").unbind("click");
				});
			}
		}

	});
});