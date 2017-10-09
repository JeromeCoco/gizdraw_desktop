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
	var markerColor = "#000000";
	var canvas = document.querySelector('#main_canvas');
	var mainsketch = document.querySelector('#main-sketch');
	var ctx = canvas.getContext('2d');

	var ppts = [];
	var dataX, dataY;
	var tmp_canvas, tmp_ctx;
	var touchstate;
	var currpreset = "preset-first";
	var points = [], isDrawing;
	var brushstate;
	var xdata, ydata;

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

		socket.on('sendActivePresetToPC', function(data){
			console.log(data);
			currpreset = data;
		});

		socket.on('onTouchBrushStartToPC', function(data){
			console.log(data);
			brushstate = data;
		});

		socket.on('onTouchBrushEndToPC', function(data){
			console.log(data);
			brushstate = data;
			isDrawing = false;
			points.length = 0;
		});

		socket.on('onSendPenColor', function (data) {
			markerColor = data;
			console.log(data);
		});

		socket.on('onSendPenWidth', function (data) {
			markerWidth = data;
			console.log(data);
			tmp_ctx.lineWidth = markerWidth;
		});

		socket.on('sendCoordinatesToPC', function(data){
			dataX = data.x;
			dataY = data.y;
			switch (currTool) {
				case 'pencil':
					ctx.globalCompositeOperation = 'source-over';
					tmp_ctx.strokeStyle = markerColor;
					tmp_ctx.fillStyle = markerColor;
					tmp_ctx.shadowBlur = 0;
					tmp_ctx.lineJoin = 'round';
					tmp_ctx.lineCap = 'round';
					dataX = data.x;
					dataY = data.y;
					onPaint();
				break;
				case 'eraser':
					dataX = data.x;
					dataY = data.y;
					onErase();
				break;
				case 'brush':
					if (currpreset == "preset-first") {
						ctx.globalCompositeOperation = 'source-over';
						var rgbaval = hexToRgbA(markerColor);
						tmp_ctx.strokeStyle = rgbaval+',0.3)';
						tmp_ctx.fillStyle = rgbaval+',0.3)';
						tmp_ctx.shadowBlur = 0;
						dataX = data.x;
						dataY = data.y;
						onPreset1();
						console.log('preset1');
					}
					else {
						console.log('wews');
					}
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

	var onErase = function() {
		// Saving all the points in an array
		ppts.push({x: dataX, y: dataY});
		tmp_ctx.strokeStyle = "#FFF";
		tmp_ctx.fillStyle = "#FFF";
		tmp_ctx.shadowBlur = 0;
		ctx.globalCompositeOperation = 'destination-out';
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

	// Preset 1 TouchStart Function
	var onPreset1 = function () {
		// Saving all the points in an array
		points.push({x: dataX, y: dataY});
		if (points.length < 3) {
			var b = points[0];
			tmp_ctx.beginPath();
			tmp_ctx.arc(b.x, b.y, tmp_ctx.lineWidth / 2, 0, Math.PI * 2, !0);
			tmp_ctx.fill();
			tmp_ctx.closePath();
			return;
		}
		// Tmp canvas is always cleared up before drawing.
		tmp_ctx.clearRect(0, 0, tmp_canvas.width, tmp_canvas.height);
		tmp_ctx.beginPath();
		tmp_ctx.moveTo(points[0].x, points[0].y);
		for (var i = 1; i < points.length - 2; i++) {
			var c = (points[i].x + points[i + 1].x) / 2;
			var d = (points[i].y + points[i + 1].y) / 2;
			tmp_ctx.quadraticCurveTo(points[i].x, points[i].y, c, d);
		}
		// For the last 2 points
		tmp_ctx.quadraticCurveTo(
			points[i].x,
			points[i].y,
			points[i + 1].x,
			points[i + 1].y
		);

		tmp_ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
		tmp_ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
		tmp_ctx.stroke();

		var lastPoint = points[points.length-1];

		for (var i = 0, len = points.length; i < len; i++) {
		    var dx = points[i].x - lastPoint.x;
		    var dy = points[i].y - lastPoint.y;
		    var d = dx * dx + dy * dy;
			    if (d < 1000) {
			      ctx.beginPath();
			      var rgbaval = hexToRgbA(markerColor);
				  ctx.strokeStyle = rgbaval+',0.3)';
				  tmp_ctx.lineWidth = 1;
			      ctx.moveTo(lastPoint.x + (dx * 0.2), lastPoint.y + (dy * 0.2));
			      ctx.lineTo(points[i].x - (dx * 0.2), points[i].y - (dy * 0.2));
			      ctx.stroke();
			    }
	    }
	};

	var onPreset2 = function () {
		
	};
	// hex to rgba conversion
	function hexToRgbA(hex){
	    var c;
	    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
	        c= hex.substring(1).split('');
	        if(c.length== 3){
	            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
	        }
	        c= '0x'+c.join('');
	        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255];
	    }
    // throw new Error('Bad Hex');
	}

	// rgb to hex conversion
	function rgbToHex(R,G,B) {
		return toHex(R)+toHex(G)+toHex(B)
	}

	function toHex(n) {
	  n = parseInt(n,10);
	  if (isNaN(n)) return "00";
	  n = Math.max(0,Math.min(n,255));
	  return "0123456789ABCDEF".charAt((n-n%16)/16)  + "0123456789ABCDEF".charAt(n%16);
	}

	$("#options").click(function(){
		$(".sub-options").toggleClass("show-sub-options");
	});

	$("#rotate-canvas").click(function(){
	});

});