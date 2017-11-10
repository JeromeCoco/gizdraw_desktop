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
	var isConnected = false;

	var ppts = [];
	var dataX, dataY;
	var tmp_canvas, tmp_ctx;
	var touchstate;
	var currpreset = "preset-first";
	var points = [], isDrawing, lastPoint;
	var brushstate;
	var xdata, ydata;
	var canvasPic = new Image();
	var cStep, cPushArray = new Array();
	var canvasMainWidth, canvasMainHeight;

	$('.simple_color_live_preview').simpleColor({ livePreview: true, cellWidth: 5, cellHeight: 5 });

	generateIP();

	socket = io('http://localhost:3000');
	socket.on("connect", function(){
		isConnected = true;

		socket.on('sendtopc', function(data){
			$("#status").html("Connected.");
			$("#status").css("font-size", "20px");
			$("#status").css("color", "white");
			$(".modal-content").css("height", "120px");
			$(".above-text").css("display", "none");
			$("#randompin").css("display", "none");
			$(".close").css("display", "block");
		});

		socket.on('sendActiveToolToPC', function(data){
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
			currpreset = data;
		});

		socket.on('onTouchBrushStartToPC', function(data){
			brushstate = data;
		});

		socket.on('onTouchBrushEndToPC', function(data){
			brushstate = data;
			isDrawing = false;
			points.length = 0;
		});

		socket.on('onSendPenColor', function (data) {
			markerColor = data;
		});

		socket.on('onSendPenWidth', function (data) {
			markerWidth = data;
			tmp_ctx.lineWidth = markerWidth;
		});

		socket.on('onColorSendToPC', function (data) {
			markerColor = data;
		});

		socket.on('onUndoReceive', function (data) {
			canvasPic.src = data;
			canvasPic.onload = function (){ 
	        	ctx.clearRect(0, 0, canvas.width, canvas.height);
	        	ctx.drawImage(canvasPic, 0, 0); 
	        }
		});

		socket.on('onRedoReceive', function (data) {
			canvasPic.src = data;
			canvasPic.onload = function (){ 
	        	ctx.clearRect(0, 0, canvas.width, canvas.height);
	        	ctx.drawImage(canvasPic, 0, 0); 
	        }
		});
		
		socket.on('onSendGridToPC', function (data) {
			if (data == "showGrid") {
				$('.grid').css('display','none');
			} else {
				$('.grid').css('display','block');
			}
		});

		socket.on('cStepReceive', function (data) {
			cStep = data;
			if (cStep == -1)
			{
				resetCanvas();
			}
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
					onPaint();
				break;
				case 'eraser':
					onErase();
				break;
				case 'brush':
					onBrushPaint();
				break;
			}
		});

		socket.on("onClearCanvasToPC", function(data){
			resetCanvas();
			var cPushArray = new Array();
		});

		socket.on("onDisconnectToPC", function(data){
			location.reload();
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
			$('.simpleColorDisplay').fadeIn('fast');
		} else {
			colored = false;
			$('.simpleColorDisplay').fadeOut('fast');
		}
		preview();
	});

	$('.disconnect-option').click(function(){
		var confirmation = confirm("Are you sure you want to disconnect?");

		if (confirmation) {
			socket.emit("onDisconnectFromPC", "disconnect");
			location.reload();
		}
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
		if ($('#canvas-setup').val() == "Custom") {
			width = $('#canvas-width').val();
			height = $('#canvas-height').val();
		} else {
			width = canvasMainWidth;
			height = canvasMainHeight;
		}
		
		$('#preview').css("display", "inline-block");
		$('#canvas-preview').css("width", width);
		$('#canvas-preview').css("height", height);
		$('#canvas-preview').css("margin-top", "10px");
		$('#canvas-preview').css("margin-left", "10px");
		$('#canvas-preview').css("box-shadow", "0px 3px 15px -6px");

		var color = $('#colorpick').val();
		if (colored) {
			$('#canvas-preview').css("background-color", color);
		} else if ($('#setCanvasColor').val() == "White") {
			$('#canvas-preview').css("background-color", "white");
		}
	}

	$('#show-preview').click(function(){
		var width;
		var height;

		if ($('#canvas-setup').val() == "Custom") {
			width = $('#canvas-width').val();
			height = $('#canvas-height').val();
		} else {
			width = canvasMainWidth;
			height = canvasMainHeight;
		}

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

	$('#btnFullScreenPreview').click(function(){
		$('#preview').toggleClass('showPreviewFull');
		screenwidth = $('.showPreviewFull').width();
		if (screenwidth > 100) {
			$('#btnFullScreenPreview').css("content","url('img/minimize.png')");
		} else {
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

		var width;
		var height;

		aspectRatioChange();

		if ($('#canvas-setup').val() == "Custom") {
			width = $('#canvas-width').val();
			height = $('#canvas-height').val();
		} else {
			width = canvasMainWidth;
			height = canvasMainHeight;
		}

		var canvasDetails = {
			canvasName: $("#canvasName").val(),
			canvasWidth: width,
			canvasHeight: height,
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
		$('#main-sketch').css('height', canvasDetails.canvasHeight);
		$('#main-sketch').css('width', canvasDetails.canvasWidth);
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
		tmp_ctx.lineWidth =markerWidth;
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

	var onBrushPaint = function(){
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

		switch(currpreset){
			case 'preset-first':
				ctx.globalCompositeOperation = 'source-over';
				// var rgbaval = hexToRgbA(markerColor);
				tmp_ctx.strokeStyle = markerColor;
				tmp_ctx.fillStyle = markerColor;
				tmp_ctx.shadowBlur = 0;
				onPreset1();
			break;
			case 'preset-second':
				tmp_ctx.strokeStyle = markerColor;
				ctx.globalCompositeOperation = 'source-over';
				onPreset2();
			break;
			case 'preset-third':
				lastPoint = { x: dataX, y: dataY };
				ctx.strokeStyle = markerColor;
				ctx.globalCompositeOperation = 'source-over';
				onPreset3();
			break;
			case 'preset-fourth':
				ctx.strokeStyle = markerColor;
				ctx.globalCompositeOperation = 'source-over';
				ctx.lineWidth = 1;
	 			ctx.lineJoin = tmp_ctx.lineCap = 'round';
				onPreset4();
			break;
		}
	};
	// Preset 1 TouchStart Function
	var onPreset1 = function () {
		// Saving all the points in an array
		tmp_ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
		tmp_ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
		tmp_ctx.stroke();

		lastPoint = points[points.length-1];

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
	  	tmp_ctx.stroke();
	  	ctx.beginPath();
	  	ctx.strokeStyle = markerColor;
	  	tmp_ctx.shadowBlur = 10;
	  	tmp_ctx.shadowColor = markerColor;
	  	tmp_ctx.lineWidth = markerWidth;
      	ctx.stroke();
	};

	var  onPreset3 = function () {
	  	var currentPoint = { x: dataX, y: dataY };
	  	var dist = distanceBetween(lastPoint, currentPoint);
	  	var angle = angleBetween(lastPoint, currentPoint);
	  
	  	for (var i = 0; i < dist; i+=5) {
	    	x = lastPoint.x + (Math.sin(angle) * i);
	    	y = lastPoint.y + (Math.cos(angle) * i);
	    
	    	var radgrad = ctx.createRadialGradient(x,y,5,x,y,10);
	    	var rgbaval = hexToRgbA(markerColor);

	    	radgrad.addColorStop(0, markerColor);
	    	radgrad.addColorStop(0.5, rgbaval+',0.5)');
	    	radgrad.addColorStop(1, rgbaval+',0)');
	    	tmp_ctx.shadowBlur = 0;
	    	ctx.fillStyle = radgrad;
	    	ctx.fillRect(x-15, y-15, 30, 30);
	  	}
		lastPoint = currentPoint;
	};

	var onPreset4 = function () {
		ctx.beginPath();
		ctx.moveTo(points[points.length - 2].x, points[points.length - 2].y);
		ctx.lineTo(points[points.length - 1].x, points[points.length - 1].y);
		ctx.stroke();

		for (var i = 0, len = points.length; i < len; i++) {
			dx = points[i].x - points[points.length-1].x;
			dy = points[i].y - points[points.length-1].y;
			d = dx * dx + dy * dy;

			if (d < 2000 && Math.random() > d / 2000) {
			  	ctx.beginPath();
			  	var rgbaval = hexToRgbA(markerColor);
			  	tmp_ctx.shadowBlur = 0;
			  	tmp_ctx.lineWidth = 1;
			  	ctx.strokeStyle = rgbaval+',0.3)';
			  	ctx.moveTo( points[points.length-1].x + (dx * 0.5), points[points.length-1].y + (dy * 0.5));
			  	ctx.lineTo( points[points.length-1].x - (dx * 0.5), points[points.length-1].y - (dy * 0.5));
			  	ctx.stroke();
			}
		}
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

	// brush preset 3 configuring distance between points
	function distanceBetween(point1, point2) {
	  return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
	}
	
	// brush preset 3 configuring angle between points
	function angleBetween(point1, point2) {
	  return Math.atan2( point2.x - point1.x, point2.y - point1.y );
	}

	function resetCanvas(){
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	}

	$("#options").click(function(){
		$(".options-list").toggleClass("show-options");
	});

	$("#rotate-canvas").click(function(){

	});

	$("#clear-canvas").click(function(){
		resetCanvas();
		var cPushArray = new Array();
		if (isConnected) {
			socket.emit("onClearCanvasFromPC", "clear canvas");
		}
	});

	$("#canvas-setup").change(function(){
		if ($(this).val() == "Custom") {
			$('.aspect-ratio-opt').css("display","none");
			$('.custom-opt').css("display","table-row");
		} else {
			$('.aspect-ratio-opt').css("display","table-row");
			$('.custom-opt').css("display","none");
		}
	});

	$("#aspect-ratio-size").change(function(){
		aspectRatioChange();
		preview();
	});

	function aspectRatioChange(){
		var aspectRatioSize = $("#aspect-ratio-size").val();
		switch (aspectRatioSize) {
			case "640 x 360":
				canvasMainHeight = 360;
				canvasMainWidth = 640;
			break;
			case "768 x 432":
				canvasMainHeight = 432;
				canvasMainWidth = 768;
			break;
			case "800 x 450":
				canvasMainHeight = 450;
				canvasMainWidth = 800;
			break;
			case "896 x 504":
				canvasMainHeight = 504;
				canvasMainWidth = 896;
			break;
			case "960 x 540":
				canvasMainHeight = 540;
				canvasMainWidth = 960;
			break;
		}
	}
});