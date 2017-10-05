$(document).ready(function(){

	$('#recent-panel').addClass('show');
	$('#setup-canvas-panel').addClass('hide');
	$('#about-panel').addClass('hide');
	$('#colorpick').addClass('hide');
	$('#sketchpad').css("display", "none");
	var colored = false;
	var myIP;
	var socket;
	var currTool = "pencil";
	var markerWidth = 5;	
	var markerColor = "#000";
	var canvas = document.querySelector('#main_canvas');
	var mainsketch = document.querySelector('#main-sketch');
	var ctx = canvas.getContext('2d');
	var ppts = [];
	var dataX, dataY;
	var tmp_canvas, tmp_ctx;
	var touchstate;

	generateIP();

	socket = io('http://localhost:3000');
	socket.on("connect", function(){

		socket.on('sendtopc', function(data){
			$("#status").html("Connected.");
			$("#status").css("font-size", "25px");
			$("#status").css("color", "white");
			$(".close").css("display", "block");
		});

		socket.on('sendActiveToolToPC', function(data){
			console.log("Active tool"+ data);
			currTool = data;
		});

		socket.on('onTouchStartToPC', function(data){
			touchstate = data;
		});

		socket.on('onTouchEndToPC', function(data){
			touchstate = data;
			ctx.drawImage(tmp_canvas, 0, 0);
			tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);
			ppts = [];
		});

		socket.on('sendCoordinatesToPC', function(data){
			switch (currTool) {
				case 'pencil':
					ctx.globalCompositeOperation = 'source-over';
					markerColor = "#000";
					tmp_ctx.strokeStyle = markerColor;
					tmp_ctx.fillStyle = markerColor;
					tmp_ctx.shadowBlur = 0;
					dataX = data.x;
					dataY = data.y;
					onPaint();
				break;	
			}
		});
	});

	if ($('#randompin').html() == "") {
		$('#randompin').html("<p style='color:red;font-size:20px;padding:10px;'>Connect your device to a network.</p>");
	}

	function generateIP() {
		window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;   //compatibility for firefox and chrome
    	var pc = new RTCPeerConnection({iceServers:[]}), noop = function(){};      
    	pc.createDataChannel("");    //create a bogus data channel
    	pc.createOffer(pc.setLocalDescription.bind(pc), noop);    // create offer and set local description
    	pc.onicecandidate = function(ice){  //listen for candidate events
        	if(!ice || !ice.candidate || !ice.candidate.candidate)  return;
        	myIP = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/.exec(ice.candidate.candidate)[1];
        	$('#randompin').html(myIP);
        	pc.onicecandidate = noop;
    	};
	}

	function changePanel(){
		$('.menu-item').removeClass('active');
		$('.panel').removeClass('show');
		$('.panel').addClass('hide');
	}

	$('#setCanvasColor').change(function(){
		var set = $(this).val();
		if (set == "Color") {
			colored = true;
			$('#colorpick').fadeIn('fast');
		} else {
			colored = false;
			$('#colorpick').fadeOut('fast');
		}
		preview();
	});

	$('#connect-new').click(function(){
		$('#enterPin').css("display", "block");
		generateIP();
	});

	$('#disconnect').click(function(){
		$('#enterPin').css("display", "block");
		generateIP();
	});

	$('#recent').click(function(){
		changePanel();
		$(this).addClass('active');
		$('#recent-panel').removeClass('hide');
		$('#recent-panel').addClass('show');
	});

	$('#new-canvas').click(function(){
		changePanel();
		$(this).addClass('active');
		$('#setup-canvas-panel').removeClass('hide');
		$('#setup-canvas-panel').addClass('show');
	});

	$('#settings').click(function(){
		$(this).toggleClass('active');
		$('.sub-settings').toggleClass('show-settings');
	});

	$('#about').click(function(){
		changePanel();
		$(this).addClass('active');
		$('#about-panel').removeClass('hide');
		$('#about-panel').addClass('show');
	});

	$('#colorpick').change(function(){
		$('#canvas-preview').css("background-color", $(this).val());
	});

	function preview() {
		var width = $('#canvas-width').val();
		var height = $('#canvas-height').val();
		var color = $('#colorpick').val();
		
		$('#preview').css("display", "inline-block");
		$('#canvas-preview').css("width", width);
		$('#canvas-preview').css("height", height);
		$('#canvas-preview').css("margin-top", "10px");
		$('#canvas-preview').css("margin-left", "10px");
		$('#canvas-preview').css("box-shadow", "0px 3px 15px -6px");

		if (colored) {
			$('#canvas-preview').css("background-color", color);
		} else if ($('#setCanvasColor').val() == "White") {
			$('#canvas-preview').css("background-color", "white");
		}
	}

	$('#show-preview').click(function(){
		var width = $('#canvas-width').val();
		var height = $('#canvas-height').val();

		if (width <= 1000 && width >= 300) {
			if (height <= 550 && height >= 300) {
				preview();
			} else {
				$('#canvas-height').css("background-color", "#e44d2e");
			}
		} else {
			$('#canvas-width').css("background-color", "#e44d2e");
		}
	});

	$('#canvas-width').change(function(){
		var width = $(this).val();

		if (width <= 1000 && width >= 300) {
			preview();
			$(this).css("background-color", "#aaaaaa");
			$('#create-canvas').css("display", "block");
		} else {
			$(this).css("background-color", "#e44d2e");
			$('#create-canvas').css("display", "none");
		}
	});

	$('#canvas-height').change(function(){
		var height = $(this).val();

		if (height <= 550 && height >= 300) {
			preview();
			$(this).css("background-color", "#aaaaaa");
			$('#create-canvas').css("display", "block");
		} else {
			$(this).css("background-color", "#e44d2e");
			$('#create-canvas').css("display", "none");
		}
	});

	/*$('#backToMenu').click(function(){
		$('#menu').css("display", "block");
		$('.panel').removeClass('show');
		$('.panel').addClass('hide');
		$('#setup-canvas-panel').removeClass('hide');
		$('#setup-canvas-panel').addClass('show');
		$('#main-sketch').css('display', "none");
		$('#sketchpad').css('display', "none");
		$('body').css("background-color", "white");
	});*/

	$('#btnFullScreenPreview').click(function(){
		$('#preview').toggleClass('showPreviewFull');
		screenwidth = $('.showPreviewFull').width();
		if (screenwidth>100) {
			$('#btnFullScreenPreview').css("content","url('img/minimize.png')");
		}
		else {
			$('#btnFullScreenPreview').css("content","url('img/fullscreen.png')");	
		}
	});

	$('#create-canvas').click(function(){

		var canvasColor;
		if ($("#setCanvasColor").val() == "White") {
			canvasColor = "white";
		} else if ($("#setCanvasColor").val() == "Color") {
			canvasColor = $("#colorpick").val();
		}

		var canvasDetails = {
			canvasName: $("#canvasName").val(),
			canvasWidth: $("#canvas-width").val(),
			canvasHeight: $("#canvas-height").val(),
			canvasBackgroundColor: canvasColor
		}

		// Creating a tmp canvas
		tmp_canvas = document.createElement('canvas');
		tmp_ctx = tmp_canvas.getContext('2d');
		tmp_canvas.id = 'tmp_canvas';
		tmp_canvas.width = canvasDetails.canvasWidth;
		tmp_canvas.height = canvasDetails.canvasHeight;
		canvas.height = canvasDetails.canvasHeight;
		canvas.width = canvasDetails.canvasWidth;
		mainsketch.appendChild(tmp_canvas);
		$('#tmp_canvas').css("position","absolute");
		$('#tmp_canvas').css("top","50px");
		socket.emit("createCanvas", canvasDetails);
	});


	var onPaint = function() {
		// Saving all the points in an array
		ppts.push({x: dataX, y: dataY});
		if (ppts.length < 3) {
			var b = ppts[0];
			tmp_ctx.beginPath();
			tmp_ctx.arc(b.x, b.y, tmp_ctx.lineWidth / 2, 0, Math.PI * 2, !0);
			tmp_ctx.fill();
			tmp_ctx.closePath();
			return;
		}
		// Tmp canvas is always cleared up before drawing.
		tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);
		tmp_ctx.beginPath();
		tmp_ctx.moveTo(ppts[0].x, ppts[0].y);
		for (var i = 1; i < ppts.length - 2; i++) {
			var c = (ppts[i].x + ppts[i + 1].x) / 2;
			var d = (ppts[i].y + ppts[i + 1].y) / 2;
			tmp_ctx.quadraticCurveTo(ppts[i].x, ppts[i].y, c, d);
		}
		// For the last 2 points
		tmp_ctx.quadraticCurveTo(
			ppts[i].x,
			ppts[i].y,
			ppts[i + 1].x,
			ppts[i + 1].y
		);
		tmp_ctx.stroke();
	};

});