$(document).ready(function(){
	var colored = false;
	var myIP, socket;
	var currTool = "pencil";
	var markerWidth;
	var markerColor = "#000000";
	var canvas = document.querySelector('#main_canvas');
	var mainsketch = document.querySelector('#main-sketch');
	var ctx = canvas.getContext('2d');
	var isConnected = false;
	var ppts = [];
	var dataX, dataY;
	var tmp_canvas, tmp_ctx;
	var touchstate, brushstate;
	var currpreset = "first-preset";
	var points = [], isDrawing, lastPoint;
	var xdata, ydata;
	var canvasPic = new Image();
	var canvasPicSrc;
	var cStep, cPushArray = new Array();
	var canvasMainWidth, canvasMainHeight;
	var resizeState = false;
	var bgColor = "#FFF";
	var bgIsColored = false;
	var rotation = 0;
	var canvasSize, createLevel, canvasSizeH, canvasSizeW;
	var canvasSendSrc;
	var cStepLength;
	var logcStep;
	var toolLog;
	var logDetails, logCount = 0, logNum, logLength, logId;
	var prvX, prvY, gridState = false, snap;
	var onTemplate = false;

	$('.simple_color_live_preview').simpleColor({ livePreview: true, cellWidth: 5, cellHeight: 5 });
	$("#enterPin").css("display", "block");
	$('#recent-panel').addClass('show');
	$('#setup-canvas-panel').addClass('hide');
	$('#about-panel').addClass('hide');
	$('#colorpick').addClass('hide');
	$('#sketchpad').css("display", "none");

	generateIP();

	function removeElement(elementId) {
	    var element = document.getElementById(elementId);
	    element.parentNode.removeChild(element);
	}

	socket = io('http://localhost:3000');
	socket.on("connect", function(){
		isConnected = true;
		socket.on('sendtopc', function(data){
			$("#status").removeClass("blink");
			$("#status").html("Connected.");
			$("#status").css("margin-top", "22px");
			$("#status").css("font-size", "20px");
			$("#status").css("color", "#212121");
			$("#enterPin .modal-content").css("height", "120px");
			$("#enterPin .modal-content").css("border-radius", "5px");
			$(".above-text, #randompin, #option-qr, #qrcode").css("display", "none");
			$(".close").css("display", "block");
			$(".close").css("color", "#212121");
			$(".close").css("background", "#e4e4e4");
		});

		socket.on('sendActiveToolToPC', function(data){
			currTool = data;
		});

		socket.on('onTouchStartToPC', function(data){
			touchstate = data.state;
			prvX = data.mX;
			prvY = data.mY;
		});

		socket.on('onTouchEndToPC', function(data){
			touchstate = data.drawState;
			var logstep = parseInt(data.logstep);
			// console.log("loop till "+cStepLength);
			// console.log(logstep+1);
			var first = true;
			if (logstep > -2){
				for (i = logNum; i <= logCount; i++) {
					if(!first){
				    	$("li[data-log-count="+i+"]").remove();
				    }
				    first=false;
				}
			}
			ctx.stroke();
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
				gridState = true;
			}
		});

		socket.on('cStepReceive', function (data) {
			cStep = data;
			if (cStep == -1) {
				resetCanvas();
			}
		});

		socket.on('sendCoordinatesToPC', function(data){
			dataX = data.x;
			dataY = data.y;
			switch (currTool) {
				case 'pencil':
					toolLog = "Draw";
					ctx.globalCompositeOperation = 'source-over';
					tmp_ctx.strokeStyle = markerColor;
					tmp_ctx.fillStyle = markerColor;
					tmp_ctx.shadowBlur = 0;
					tmp_ctx.lineJoin = 'round';
					tmp_ctx.lineCap = 'round';
					tmp_ctx.lineWidth = markerWidth;
					if(gridState){
						if(snap <= 2){
							onSnap();
						} else {
							onPaint();
						}
					} else {
						onPaint();
					}
				break;
				case 'eraser':
					toolLog = "Erase";
					onErase();
				break;
				case 'brush':
					toolLog = "Draw";
					onBrushPaint();
				break;
				case 'line':
					toolLog = "Draw";
					onDrawLine();
				break;
			}
		});

		socket.on("onClearCanvasToPC", function(data){
			resetCanvas();
			var cPushArray = new Array();
			$('.event-logs-li').remove();
			$(".event-logs-container div").fadeIn('fast');
		});

		socket.on("onDisconnectToPC", function(data){
			location.reload();
			isConnected = false;
		});

		socket.on("onBgChangeToPC", function(data){
			bgColor = data.bgColor;
			bgIsColored = data.bgIsColored;
			if (bgIsColored) {
				$('#main-sketch').css("background-color", bgColor);
			} else {
				$('#main-sketch').css("background-color", "white");
			}
		});

		socket.on("changeToolToPC", function(data){
			$("#activeTool").html(data);
			$(".activeToolNotificationBar").toggleClass('toggleNotification');
			$(".activeToolNotificationBar").fadeIn("fast");
			$(".activeToolContainer").toggleClass("activeToolShow");

			setTimeout(function(){
				$(".activeToolContainer").css("display", "block");
			}, 100);

			setTimeout(function(){
				$(".activeToolNotificationBar").toggleClass('toggleNotification');
				$(".activeToolContainer").css("display", "none");
			}, 2000);

			logDetails = "Change Tool: "+data;
			var logidcnt = 1;
			logidcnt++;
			logId = "ct"+logidcnt;
			appendli(logDetails, logId, canvas.width, canvas.height, null);
		});

		socket.on("onReceivecStep", function(data){
			canvasPicSrc = data.canvasPiccStep;
		});

		socket.on("onReceiveEventLog", function(data){
		});

		socket.on("cPushArrayReceive", function(data){
			saveGdw(data);
		});

		socket.on("receiveImageToPCFromMobile", function(data){
			var image = new Image();
			image.src = data.image;
			tmp_canvas.width = data.width;
			tmp_canvas.height = data.height;
			canvas.width = data.width;
			canvas.height = data.height;
			$("#canvas-name-active").html(data.filename);
			createLevel = "open";
			$("#main-sketch").css({height: data.height+'px',width: data.width+'px'});;
			ctx.drawImage(image, 0, 0);
			$('#template-image').removeAttr('src');
			onTemplate = false;
		});

		socket.on("receiveLogFunctions", function(data){
			logId = data.lcStep;
			logDetails = "Draw";
			appendli(logDetails, logId, canvas.width, canvas.height, data.lcanvasSrc);
			$("#"+logId).attr('data-cStep', data.lcStep);
			cStepLength = data.lcStep;
		});


		socket.on("receiveSnap", function(data){
			snap = data;
		});

		socket.on("receiveTemplateFromMobileToPC", function(data){
			onTemplate = true;
			canvas.width = 600;
			canvas.height = 350;
			tmp_canvas.width = 600;
			tmp_canvas.height = 350;
			$("#main-sketch").css("width", "600px");
			$("#main-sketch").css("height", "350px");
			$("#template-image").attr('src', 'img/templates/'+data.image+'.PNG');
			if (data.type == "drawing") {
				$("#template-image").css("z-index", "-1");
			} else {
				$("#template-image").css("z-index", "0");
			}
			$('#canvas-name-active').html("*Untitled");
		});

		socket.on("onClearTemplateToPC", function(data){
			$('#template-image').removeAttr('src');
			onTemplate = false;
		})

	});

	// list recent files
	try {
		var fs = require('fs');
		var reader = fs.readFile('gizdraw.data', 'utf-8', function (err, data) {
			var list = JSON.parse(data);
			$("#welcomeMessage").css("display", "none");
			for (var i = 1; i <= Object.keys(list).length; i++) {
				var fileName = list["file"+i]["file_name"];
				var fileLocation = list["file"+i]["file_location"];
				var fileExtension = fileName.split(".");
				var displayIcon;
				switch (fileExtension[1]) {
					case "gdw":
						displayIcon = "file-default-image";
						break;
					case "png":
						displayIcon = "file-default-image-png";
						break;
					case "jpg":
						displayIcon = "file-default-image-jpg";
						break;
				}

				$("#file").append('<div class="file-item" id="file'+i+'"> <img src="img/'+displayIcon+'.jpg"> <p>'+fileName+'</p> <p>'+fileLocation+'</p> </div> ');
			}
		});
	} catch(e) {
		$("#file").append("<p id='welcomeMessage'><b>Giz</b>Draw</p>");
	}

	if(reader == undefined){
		$("#file").append("<p id='welcomeMessage'><b>Giz</b>Draw</p>");
	}

	$(document).on( "click", ".file-item", function(){
		var selectedFile = $(this).attr('id');
		fs.readFile('gizdraw.data', 'utf-8', function (err, data) {
			var list = JSON.parse(data);
			var fileName = list[selectedFile]["file_name"];
			var fileLocation = list[selectedFile]["file_location"];
			$("#canvas-name-active").html(fileName);

			var fileExtension = fileLocation.split(".");
			if (fileExtension[1] == "gdw") {
				gdwReader(fileLocation);
			} else {
				imageReader(fileLocation);
			}
		});
	});

	$(".close").click(function() {
		$("#enterPin").css("display", "none");
	});

	function saveGdw(data) {
		const {app} = require("electron").remote;
		var fs = require('fs');
		var gdwObject = new Object();
		var image;
		var saveName;

		switch (createLevel) {
			case 'open':
				var splitGdw = $("#canvas-name-active").html().split('.');
				saveName = splitGdw[0];
				console.log(saveName);
				break;
			case 'form1':
				saveName = $("#canvasName").val();
				break;
			case 'form2':
				saveName = $("#canvasName2").val();
				break;
		}

		for (var i = 0; i <= data.length; i++) {
			gdwObject[i] = data[i];
		}

		gdwObject['width'] = canvas.width;
		gdwObject['height'] = canvas.height;
		gdwObject['bgColor'] = bgColor;

		image = JSON.stringify(gdwObject, null, 2);

		var convertedImage;
		for (var i = 0; i < image.length; i++) {
			convertedImage += image[i].charCodeAt(0).toString(2);
		}
		/*console.log(convertedImage);*/

		fs.mkdir(app.getPath('pictures') + "/GizDraw");
		fs.writeFile(app.getPath('pictures') + "/GizDraw/" + saveName +'.gdw', image, function (err) {
			throw err;
		});

		$("#saveNotificationBar").fadeIn('slow');
		$("#canvas-name-active").html(saveName + ".gdw");
	}

	if ($('#randompin').html() == "") {
		$('#randompin').html("<p style='margin-top:4px;font-size:17px;padding:10px;'>Connect your device to a network.</p>");
		$("#status, #option-qr").css("display", "none");
		$("#enterPin .modal-content").css("height", "130px");
	}

	var convertSetFromIPToLetter = {
        1 : 'aa', 2 : 'ab', 3 : 'ac', 4 : 'ad', 5 : 'ae', 6 : 'ba', 7 : 'bb', 8 : 'bc', 9 : 'bd', 10 : 'be',
        11 : 'ca', 12 : 'cb', 13 : 'cc', 14 : 'cd', 15 : 'ce', 16 : 'da', 17 : 'db', 18 : 'dc', 19 : 'dd', 20 : 'de',
        21 : 'ea', 22 : 'eb', 23 : 'ec', 24 : 'ed', 25 : 'ee', 26 : 'fa', 27 : 'fb', 28 : 'fc', 29 : 'fd', 30 : 'fe',
        31 : 'ga', 32 : 'gb', 33 : 'gc', 34 : 'gd', 35 : 'ge', 36 : 'ha', 37 : 'hb', 38 : 'hc', 39 : 'hd', 40 : 'he',
        41 : 'ia', 42 : 'ib', 43 : 'ic', 44 : 'id', 45 : 'ie', 46 : 'ja', 47 : 'jb', 48 : 'jc', 49 : 'jd', 50 : 'je',
        51 : 'ka', 52 : 'kb', 53 : 'kc', 54 : 'kd', 55 : 'ke', 56 : 'la', 57 : 'lb', 58 : 'lc', 59 : 'ld', 60 : 'le',
        61 : 'ma', 62 : 'mb', 63 : 'mc', 64 : 'md', 65 : 'me', 66 : 'na', 67 : 'nb', 68 : 'nc', 69 : 'nd', 70 : 'ne',
        71 : 'oa', 72 : 'ob', 73 : 'oc', 74 : 'od', 75 : 'oe', 76 : 'pa', 77 : 'pb', 78 : 'pc', 79 : 'pd', 80 : 'pe',
        81 : 'qa', 82 : 'qb', 83 : 'qc', 84 : 'qd', 85 : 'qe', 86 : 'ra', 87 : 'rb', 88 : 'rc', 89 : 'rd', 90 : 're',
        91 : 'sa', 92 : 'sb', 93 : 'sc', 94 : 'sd', 95 : 'se', 96 : 'ta', 97 : 'tb', 98 : 'tc', 99 : 'td', 100 : 'te',
        101 : 'ua', 102 : 'ub', 103 : 'uc', 104 : 'ud', 105 : 'ue', 106 : 'va', 107 : 'vb', 108 : 'vc', 109 : 'vd', 110 : 've',
        111 : 'wa', 112 : 'wb', 113 : 'wc', 114 : 'wd', 115 : 'we', 116 : 'xa', 117 : 'xb', 118 : 'xc', 119 : 'xd', 120 : 'xe',
        121 : 'ya', 122 : 'yb', 123 : 'yc', 124 : 'yd', 125 : 'ye', 126 : 'za', 127 : 'zb', 128 : 'zc', 129 : 'zd', 130 : 'ze',
        131 : 'Aa', 132 : 'Ab', 133 : 'Ac', 134 : 'Ad', 135 : 'Ae', 136 : 'Ba', 137 : 'Bb', 138 : 'Bc', 139 : 'Bd', 140 : 'Be',
        141 : 'Ca', 142 : 'Cb', 143 : 'Cc', 144 : 'Cd', 145 : 'Ce', 146 : 'Da', 147 : 'Db', 148 : 'Dc', 149 : 'Dd', 150 : 'De',
        151 : 'Ea', 152 : 'Eb', 153 : 'Ec', 154 : 'Ed', 155 : 'Ee', 156 : 'Fa', 157 : 'Fb', 158 : 'Fc', 159 : 'Fd', 160 : 'Fe',
        161 : 'Ga', 162 : 'Gb', 163 : 'Gc', 164 : 'Gd', 165 : 'Ge', 166 : 'Ha', 167 : 'Hb', 168 : 'Hc', 169 : 'Hd', 170 : 'He',
        171 : 'Ia', 172 : 'Ib', 173 : 'Ic', 174 : 'Id', 175 : 'Ie', 176 : 'Ja', 177 : 'Jb', 178 : 'Jc', 179 : 'Jd', 180 : 'Je',
        181 : 'Ka', 182 : 'Kb', 183 : 'Kc', 184 : 'Kd', 185 : 'Ke', 186 : 'La', 187 : 'Lb', 188 : 'Lc', 189 : 'Ld', 190 : 'Le',
        191 : 'Ma', 192 : 'Mb', 193 : 'Mc', 194 : 'Md', 195 : 'Me', 196 : 'Na', 197 : 'Nb', 198 : 'Nc', 199 : 'Nd', 200 : 'Ne',
        201 : 'Oa', 202 : 'Ob', 203 : 'Oc', 204 : 'Od', 205 : 'Oe', 206 : 'Pa', 207 : 'Pb', 208 : 'Pc', 209 : 'Pd', 210 : 'Pe',
        211 : 'Qa', 212 : 'Qb', 213 : 'Qc', 214 : 'Qd', 215 : 'Qe', 216 : 'Ra', 217 : 'Rb', 218 : 'Rc', 219 : 'Rd', 220 : 'Re',
        221 : 'Sa', 222 : 'Sb', 223 : 'Sc', 224 : 'Sd', 225 : 'Se', 226 : 'Ta', 227 : 'Tb', 228 : 'Tc', 229 : 'Td', 230 : 'Te',
        231 : 'Ua', 232 : 'Ub', 233 : 'Uc', 234 : 'Ud', 235 : 'Ue', 236 : 'Va', 237 : 'Vb', 238 : 'Vc', 239 : 'Vd', 240 : 'Ve',
        241 : 'Wa', 242 : 'Wb', 243 : 'Wc', 244 : 'Wd', 245 : 'We', 246 : 'Xa', 247 : 'Xb', 248 : 'Xc', 249 : 'Xd', 250 : 'Xe',
        251 : 'Ya', 252 : 'Yb', 253 : 'Yc', 254 : 'Yd', 255 : 'Ye'
    }

	function generateIP() {
		window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;   //compatibility for firefox and chrome
    	var pc = new RTCPeerConnection({iceServers:[]}), noop = function(){};
    	pc.createDataChannel("");    //create a bogus data channel
    	pc.createOffer(pc.setLocalDescription.bind(pc), noop);    // create offer and set local description
    	pc.onicecandidate = function(ice){  //listen for candidate events
	        if(!ice || !ice.candidate || !ice.candidate.candidate)  return;
	        var myIP = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/.exec(ice.candidate.candidate)[1];
	        // split ip
	        var splitIP = myIP.split(".");
	        var part1 = splitIP[0], part2 = splitIP[1], part3 = splitIP[2], part4 = splitIP[3];
	        // display to letters
	        $("#status, #option-qr").css("display", "block");
			$("#enterPin .modal-content").css("height", "410px");
	        $('#randompin').html(convertSetFromIPToLetter[parseInt(part1)] + convertSetFromIPToLetter[parseInt(part2)] + convertSetFromIPToLetter[parseInt(part3)] + convertSetFromIPToLetter[parseInt(part4)]);
	        /*$('#randompin').html(myIP);*/
			var stringPin = convertSetFromIPToLetter[parseInt(part1)] + convertSetFromIPToLetter[parseInt(part2)] + convertSetFromIPToLetter[parseInt(part3)] + convertSetFromIPToLetter[parseInt(part4)] + ' ';
	        $("#qrcode").qrcode({
			    width: 128,
			    height: 128,
			    text: stringPin
			});
	        pc.onicecandidate = noop;
    	};
	}

	function changePanel() {
		$('.menu-item').removeClass('active');
		$('.panel').removeClass('show');
		$('.panel').addClass('hide');
	}

	$('#setCanvasColor').change(function() {
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

	function disconnectDevice() {
		var confirmation = confirm("Are you sure you want to disconnect?");
		if (confirmation) {
			socket.emit("onDisconnectFromPC", "disconnect");
			location.reload();
			isConnected = false;
		}
	}

	$('.disconnect-option').click(disconnectDevice);

	$('#recent').click(function() {
		changePanel();
		$(this).addClass('active');
		$('#recent-panel').removeClass('hide');
		$('#recent-panel').addClass('show');
	});

	$('#new-canvas').click(function() {
		changePanel();
		$(this).addClass('active');
		$('#setup-canvas-panel').removeClass('hide');
		$('#setup-canvas-panel').addClass('show');
	});

	$('#settings').click(function() {
		$(this).toggleClass('active');
		$('.sub-settings').toggleClass('show-settings');
	});

	$('#about').click(function() {
		changePanel();
		$(this).addClass('active');
		$('#about-panel').removeClass('hide');
		$('#about-panel').addClass('show');
	});

	$('#colorpick').change(function() {
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

	$('#show-preview').click(function() {
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

	function checkWidth(control, width, button) {
		if (width <= 1000 && width >= 300) {
			preview();
			control.css("background-color", "#aaaaaa");
			button.css("display", "block");
		} else {
			control.css("background-color", "rgb(105, 105, 105)");
			button.css("display", "none");
		}
	}

	$('#canvas-width').change(function() {
		checkWidth($(this), $(this).val(), $('#create-canvas'));
	});

	$('#canvas-width2').change(function() {
		checkWidth($(this), $(this).val(), $('#create-canvas2'));
	});

	function checkHeight(control, height, button) {
		if (height <= 550 && height >= 300) {
			preview();
			control.css("background-color", "#aaaaaa");
			button.css("display", "block");
		} else {
			control.css("background-color", "rgb(105, 105, 105)");
			button.css("display", "none");
		}
	}

	$('#canvas-height').change(function() {
		checkHeight($(this), $(this).val(), $('#create-canvas'));
	});

	$('#canvas-height2').change(function() {
		checkHeight($(this), $(this).val(), $('#create-canvas2'));
	});

	$('#btnFullScreenPreview').click(function() {
		$('#preview').toggleClass('showPreviewFull');
		screenwidth = $('.showPreviewFull').width();
		if (screenwidth > 100) {
			$('#btnFullScreenPreview').css("content","url('img/minimize.png')");
		} else {
			$('#btnFullScreenPreview').css("content","url('img/fullscreen.png')");
		}
	});

	function setupDesktopView() {
		$('#menu').css("display", "none");
		$('#setup-canvas-panel').addClass('hide');
		$('#main-sketch').css('display', "block");
		$('#sketchpad').css('display', "block");
		$('body').css("background-color", "#d2d2d2");
	}

	$('#create-canvas').click(function() {
		if ($('#canvasName').val() != "") {
			// setup on desktop
			$('#canvas-name-active').html($('#canvasName').val());
			setupDesktopView();
			if ($('#setCanvasColor').val() == "Color") {
				$('#main-sketch').css('background-color', $('#colorpick').val());
			} else {
				$('#main-sketch').css('background-color', "white");
			}
			$('#canvasName').css('background-color',"#aaaaaa");

			// setup on mobile
			createLevel = 'form1';
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
				canvasBackgroundColor: canvasColor,
				state: "create",
				createVersion: "first"
			}

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
			$('#tmp_canvas').css("top","0");
			socket.emit("createCanvas", canvasDetails);
		} else {
			$('#canvasName').css('background-color', "rgb(105, 105, 105)");
		}
	});

	$('#create-canvas2').click(function() {
		if ($('#canvasName2').val() != "") {
			// setup on desktop
			$('#template-image').removeAttr('src');
			onTemplate = false;
			socket.emit("onClearTemplateFromPC", 'clear');
			$('#canvas-name-active').html($('#canvasName2').val());
			setupDesktopView();
			if ($('#changeBackground2').val() == "Color") {
				$('#main-sketch').css('background-color', $('.custom-bg-color2').val());
			} else {
				$('#main-sketch').css('background-color', "white");
			}

			// setup on mobile
			createLevel = 'form2';
			var canvasColor;
			if ($("#changeBackground2").val() == "White") {
				canvasColor = "white";
			} else if ($("#changeBackground2").val() == "Color") {
				canvasColor = $(".custom-bg-color2").val();
			}

			var width;
			var height;
			aspectRatioChange();
			if ($('#canvasOption2').val() == "Custom") {
				width = $('#canvas-width2').val();
				height = $('#canvas-height2').val();
			} else {
				width = canvasMainWidth;
				height = canvasMainHeight;
			}

			var canvasDetails = {
				canvasName: $("#canvasName2").val(),
				canvasWidth: width,
				canvasHeight: height,
				canvasBackgroundColor: canvasColor,
				state: "create",
				createVersion: "second"
			}

			setCanvasSize(canvasDetails.canvasWidth, canvasDetails.canvasHeight);
			$("#createNewCanvasModal").css("display", "none");
			clearLogs();
			socket.emit("createCanvas", canvasDetails);
		} else {
			$('#canvasName2').css('background-color',"rgb(105, 105, 105)");
		}

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
		if (bgIsColored) {
			eraserColor = bgColor;
		} else {
			eraserColor = '#FFF';
		}
		// Saving all the points in an array
		ppts.push({x: dataX, y: dataY});
		tmp_ctx.strokeStyle = eraserColor;
		tmp_ctx.fillStyle = eraserColor;
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

	var onBrushPaint = function() {
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
			case 'first-preset':
				ctx.globalCompositeOperation = 'source-over';
				tmp_ctx.strokeStyle = markerColor;
				tmp_ctx.fillStyle = markerColor;
				tmp_ctx.shadowBlur = 0;
				onPreset1();
			break;
			case 'second-preset':
				tmp_ctx.strokeStyle = markerColor;
				ctx.globalCompositeOperation = 'source-over';
				tmp_ctx.lineJoin = tmp_ctx.lineCap = 'round';
				onPreset2();
			break;
			case 'third-preset':
				ctx.strokeStyle = markerColor;
				ctx.globalCompositeOperation = 'source-over';
				ctx.lineWidth = 1;
	 			ctx.lineJoin = tmp_ctx.lineCap = 'round';
				onPreset3();
			break;
		}
	};

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

	var onPreset3 = function () {
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

	var onDrawLine = function() {
		var pptsl = ppts.length-1;
		ppts.push({x: dataX, y: dataY});
		ctx.lineWidth = markerWidth;
		ctx.strokeStyle = markerColor;
		ctx.beginPath();
		ctx.moveTo(ppts[0].x, ppts[0].y);
		ctx.lineTo(ppts[pptsl].x, ppts[pptsl].y);
	};

	var onSnap = function() {
		var pptsl = ppts.length-1;
		ppts.push({x: dataX, y: dataY});
		ctx.lineWidth = markerWidth;
		ctx.strokeStyle = markerColor;
		ctx.lineJoin = "round";
		ctx.lineCap = "round";
		ctx.beginPath();
		var dx = dataX - prvX;
		var dy = dataY - prvY;
		ctx.moveTo(ppts[0].x, ppts[0].y);
		if(Math.abs(dx)> Math.abs(dy)){
			ctx.lineTo(dataX, prvY);
		} else {
			ctx.lineTo(prvX, dataY);
		}
	};
	// hex to rgba conversion
	function hexToRgbA(hex) {
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

	function resetCanvas() {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
	}

	$("#options").click(function() {
		$(".options-list").toggleClass("show-options");
		if ($(".canvas-list").hasClass('show-options') || $(".settings-list").hasClass('show-options')) {
			$(".canvas-list").removeClass("show-options");
			$(".settings-list").removeClass("show-options");
		}
	});

	$("#canvasMenu").click(function() {
		$(".canvas-list").toggleClass("show-options");
		if ($(".options-list").hasClass('show-options') || $(".settings-list").hasClass('show-options')) {
			$(".options-list").removeClass("show-options");
			$(".settings-list").removeClass("show-options");
		}
	});

	$("#settingsMenu").click(function() {
		$(".settings-list").toggleClass("show-options");
		if ($(".canvas-list").hasClass('show-options') || $(".options-list").hasClass('show-options')) {
			$(".canvas-list").removeClass("show-options");
			$(".options-list").removeClass("show-options");
		}
	});

	$("#saveAs").mouseover(function() {
		$(".saveOptions").addClass('showSaveOps');
	}).mouseleave(function() {
		$(".saveOptions").removeClass('showSaveOps');
	});

	$(".saveOptions, .rotateOptions").mouseleave(function() {
		$(this).removeClass('showSaveOps');
	});

	$("#rotate").mouseover(function() {
		$(".rotateOptions").addClass('showRotateOps');
	}).mouseleave(function() {
		$(".rotateOptions").removeClass('showRotateOps');
	});

	$("#clear-canvas").click(function() {
		var confirmation1 = confirm("Are you sure you want to clear canvas?");
		if (confirmation1) {
			resetCanvas();
			var cPushArray = new Array();
		}

		if (isConnected) {
			socket.emit("onClearCanvasFromPC", "clear canvas");
			if (onTemplate) {
				if (confirmation1) {
				var confirmation2 = confirm("Clear template?");
				if (confirmation2) {
					$('#template-image').removeAttr('src');
					onTemplate = false;
					socket.emit("onClearTemplateFromPC", 'clear');
				}
			}
			}
		}
		$('.event-logs-li').remove();
		$(".event-logs-container div").fadeIn('fast');
	});

	$("#canvas-setup").change(function() {
		if ($(this).val() == "Custom") {
			$('.aspect-ratio-opt').css("display", "none");
			$('.custom-opt').css("display", "table-row");
			$('.simpleColorDisplay, .simpleColorChooser').css("margin-top", "0px");
		} else {
			$('.aspect-ratio-opt').css("display", "table-row");
			$('.custom-opt').css("display", "none");
			$('.simpleColorDisplay, .simpleColorChooser').css("margin-top", "-50px");
		}
	});

	$("#aspect-ratio-size").change(function() {
		aspectRatioChange();
		preview();
	});

	function aspectRatioChange() {
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

	$("#changeBackground").click(function() {
		$("#canvasOptions").css("display", "block");
	});

	$("#createNew").click(function() {
		$("#createNewCanvasModal").css("display", "block");
	});

	$("#select-canvas-option").change(function(){
		if ($(this).val() == "Color") {
			$('#custom-bg-color').fadeIn('slow');
		} else {
			$('#custom-bg-color').fadeOut('slow');
		}
	});

	$("#close-canvas-option").click(function() {
		$("#canvasOptions").css("display", "none");
	});

	$("#close-help").click(function() {
		$("#helpModal").css("display", "none");
	});

	$("#close-create-new").click(function() {
		$("#createNewCanvasModal").css("display", "none");
	});

	$("#close-saveFileName").click(function() {
		$("#saveFileNameModal").css("display", "none");
	});

	$("#setBgColor").click(function() {
		var setColor = $("#custom-bg-color").val();
		$("#canvasOptions").css("display", "none");

		if ($("#select-canvas-option").val() == "Color") {
			$('#main-sketch').css("background-color", setColor);
			bgColor = setColor;
			bgIsColored = true;
		} else {
			$('#main-sketch').css("background-color", "white");
			bgColor = "#FFFFFF";
			bgIsColored = false;
		}

		if (isConnected) {
			socket.emit("onBgChangeFromPC", {bgColor:bgColor, bgIsColored:bgIsColored});
		}
	});

	$('#resize').click(function() {
		resizeState = true;
		var mainSketch = mainsketch;
		$(tmp_canvas).css({'top':'0px'});
		$(".grid").css({'top':'0px'});
		$(mainsketch).addClass("ui-resizable");
		$(".ui-resizable-handle").css("display", "block");

		if (tmp_canvas.width <= 300 && tmp_canvas.height <= 300 && main_canvas.height <= 300 && main_canvas.width <= 300 ) {
			$(mainsketch).resizable({
				resize:function(event, ui){
					//limit resize
					// $(tmp_canvas).resizable(parseInt($(tmp_canvas).height(),15)-10);
					// $(main_canvas).resizable(parseInt($(main_canvas).height(),15)-10);
					// $(main_canvas).resizable(parseInt($(tmp_canvas).width(),15)-10);
					// $(main_canvas).resizable(parseInt($(main_canvas).width(),15)-10);
					setCanvasSize(ui.size.width, ui.size.height);
					canvasPic.src = canvasPicSrc;

			        canvasPic.onload = function () { 
			        	ctx.clearRect(0, 0, canvas.width, canvas.height);
			        	ctx.drawImage(canvasPic, 0, 0); 
			        }

			        $('#canvas-size').css("display", "block");
					$('#canvas-size').html("w: " + ui.size.width + "px h: " + ui.size.height + "px");
					canvasSize = ui.size.width+" x "+ui.size.height;
					canvasSizeW = ui.size.width;
					canvasSizeH = ui.size.height;
					if (isConnected) {
						socket.emit("canvasResizeFromPC", {canvasSizeWidth:ui.size.width, canvasSizeHeight:ui.size.height});
					}
					console.log(canvasSize);
				}
			});
		}
		if (tmp_canvas.width >= 300 <= 600 && tmp_canvas.height >= 300 <= 600 && main_canvas.height >= 300 <= 600 && main_canvas.width >= 300 <= 600 ) {
			$(mainsketch).resizable({
				minWidth:parseInt($(tmp_canvas,main_canvas).width(),10)-200,
				minHeight:parseInt($(tmp_canvas,main_canvas).height(),10)-200,
				stop:function(event, ui){
					tmp_canvas.width = ui.size.width;
					tmp_canvas.height = ui.size.height;
					main_canvas.width = ui.size.width;
					main_canvas.height = ui.size.height;
					//limit resize
					// $(tmp_canvas).resizable(parseInt($(tmp_canvas).height(),10)-200);
					// $(main_canvas).resizable(parseInt($(main_canvas).height(),10)-200);
					// $(main_canvas).resizable(parseInt($(tmp_canvas).width(),10)-200);
					// $(main_canvas).resizable(parseInt($(main_canvas).width(),10)-200);
					canvasPic.src = canvasPicSrc;

			        canvasPic.onload = function () { 
			        	ctx.clearRect(0, 0, canvas.width, canvas.height);
			        	ctx.drawImage(canvasPic, 0, 0); 
			        }

			        $('#canvas-size').css("display", "block");
					$('#canvas-size').html("w: " + ui.size.width + "px h: " + ui.size.height + "px");
					canvasSize = ui.size.width+" x "+ui.size.height;
					if (isConnected) {
						socket.emit("canvasResizeFromPC", {canvasSizeWidth:ui.size.width, canvasSizeHeight:ui.size.height});
					}
				}
			});

		}
		$(mainsketch).css("border", "3px dashed gray");
		$(".resizeHintBar").fadeIn('slow');
	});

	function removeDropdown() {
		if ($('.options-list').hasClass('show-options')) {
    		$('.options-list').toggleClass('show-options');
    	}
    	if ($('.canvas-list').hasClass('show-options')) {
    		$('.canvas-list').toggleClass('show-options');
    	}
    	if ($('.settings-list').hasClass('show-options')) {
    		$('.settings-list').toggleClass('show-options');
    	}
	}

	$(document).on("keyup", canvas, function(event) {
		// enter [confirm resize]
	    if (event.keyCode === 13 && resizeState == true) {
	    	resizeState = false;
	    	$('#canvas-size').css("display", "none");
	    	$(".resizeHintBar").fadeOut('slow');
	    	$(mainsketch).removeClass("ui-resizable");
	    	$(mainsketch).css("border", "none");
	    	$(".ui-resizable-handle").css("display", "none");
	    	logDetails = "Resize Canvas: " +canvasSize;
			logId = "resized-log";
	    	appendli(logDetails, logId, canvasSizeW, canvasSizeH, canvas.toDataURL());
	    	if (isConnected) {
				socket.emit("sendCSize", canvasSize);
			}
	    }

	    // ctrl + n [create new modal]
	    if (event.keyCode == 78 && event.ctrlKey == true && $("#enterPin").css("display") == "none" && $("#menu").css("display") == "none") {
	    	removeDropdown();
	    	$("#createNewCanvasModal").css("display", "block");
	    }

	    // ctrl + b [set background]
	    if (event.keyCode == 66 && event.ctrlKey == true && $("#enterPin").css("display") == "none" && $("#menu").css("display") == "none") {
	    	removeDropdown();
	    	$("#canvasOptions").css("display", "block");
	    }

	    // ctrl + d [disconnect]
	    if (event.keyCode == 68 && event.ctrlKey == true && $("#enterPin").css("display") == "none" && $("#menu").css("display") == "none") {
	    	disconnectDevice();
	    }

	    // ctrl + e [clear canvas]
	    if (event.keyCode == 69 && event.ctrlKey == true && $("#enterPin").css("display") == "none" && $("#menu").css("display") == "none") {
	    	resetCanvas();
			var cPushArray = new Array();
			socket.emit("onClearCanvasFromPC", "clear canvas");
	    }

	    // ctrl + h [show help]
	    if (event.keyCode == 72 && event.ctrlKey == true && $("#enterPin").css("display") == "none" && $("#menu").css("display") == "none") {
	    	$("#helpModal").css("display", "block");
			removeDropdown();
	    }

	    // ctrl + shift + j [save jpg]
	    if (event.keyCode == 74 && event.ctrlKey == true && event.shiftKey == true && $("#enterPin").css("display") == "none" && $("#menu").css("display") == "none") {
	    	removeDropdown();
	    	saveJPG();
	    }

	    // ctrl + o [open file]
	    if (event.keyCode == 79 && event.ctrlKey == true && $("#enterPin").css("display") == "none") {
	    	openFileGdw();
	    }

	    // ctrl + shift + p [save PNG]
	    if (event.keyCode == 80 && event.ctrlKey == true && event.shiftKey == true && $("#enterPin").css("display") == "none") {
	    	removeDropdown();
	    	savePNG();
	    }

	    // ctrl + s [save gdw]
	    if (event.keyCode == 83 && event.ctrlKey == true && $("#enterPin").css("display") == "none" && $("#menu").css("display") == "none") {
	    	removeDropdown();
	    	socket.emit("onRequestArray", "penge pong array");
	    }

	});

	function savePNG() {		
		var canvasBuffer = require('electron-canvas-to-buffer');
		var buffer = canvasBuffer(canvas, 'image/png');
		const {app} = require("electron").remote;
		var fs = require('fs');

		var saveName;
		switch (createLevel) {
			case 'open':
				var splitGdw = $("#canvas-name-active").html().split('.');
				saveName = splitGdw[0];
				break;
			case 'form1':
				saveName = $("#canvasName").val();
				break;
			case 'form2':
				saveName = $("#canvasName2").val();
				break;
		}

		fs.mkdir(app.getPath('pictures') + "/GizDraw");
		fs.writeFile(app.getPath('pictures') + "/GizDraw/" + saveName +'.png', buffer, function (err) {
  			throw err;
		});
		$("#saveNotificationBar").fadeIn('slow');
	}

	$("#save-png").click(savePNG);

	function saveJPG() {
		var canvasBuffer = require('electron-canvas-to-buffer');
		var buffer = canvasBuffer(canvas, 'image/png');
		const {app} = require("electron").remote;
		var fs = require('fs');

		var saveName;
		switch (createLevel) {
			case 'open':
				var splitGdw = $("#canvas-name-active").html().split('.');
				saveName = splitGdw[0];
				break;
			case 'form1':
				saveName = $("#canvasName").val();
				break;
			case 'form2':
				saveName = $("#canvasName2").val();
				break;
		}

		fs.mkdir(app.getPath('pictures') + "/GizDraw");
		fs.writeFile(app.getPath('pictures') + "/GizDraw/" + saveName +'.jpg', buffer, function (err) {
  			throw err;
		});
		$("#saveNotificationBar").fadeIn('slow');
	}

	$("#save-jpg").click(saveJPG);

	$("#saveNotificationBar span").click(function() {
		$("#saveNotificationBar").fadeOut('slow');
	});

	$("#openGizDrawFolder").click(function() {
		const {app} = require("electron").remote;
		const {shell} = require("electron");
		shell.openItem(app.getPath('pictures') + "/GizDraw");
	});

	function rotateBase64Image90Degree(canvasPicSrc) {
		canvasPicSrc = canvas.toDataURL();
	 	canvasPic.src = canvasPicSrc;
	  	canvasPic.onload = function() {
	  		ctx.clearRect(0, 0, canvas.width, canvas.height);
		    canvas.width = canvasPic.height;
		    canvas.height = canvasPic.width;
		  	ctx.save();
		    ctx.translate(canvasPic.width/2,canvasPic.height/2);
		    ctx.rotate(90 * Math.PI / 180);
		    ctx.drawImage(canvasPic, -(canvasPic.height/2), -(canvasPic.width/2)); 
		    ctx.restore();
	  	};
	}

	function rotateBase64ImageNeg90Degree(canvasPicSrc) {
	  	canvasPicSrc = canvas.toDataURL();
	  	canvasPic.src = canvasPicSrc;
	  	canvasPic.onload = function() {
		  	ctx.clearRect(0, 0, canvas.width, canvas.height);
		    canvas.width = canvasPic.height;
		    canvas.height = canvasPic.width;
		  	ctx.save();
		    ctx.translate(canvasPic.width/2,canvasPic.height/2);
		    ctx.rotate(-90 * Math.PI / 180);
		    ctx.drawImage(canvasPic, -(canvasPic.height/2), -(canvasPic.width/2)); 
		    ctx.restore();
	  	};
	}

	$('#rotate-cw').click(function() {
		rotateBase64Image90Degree(canvasPicSrc);
	});

	$('#rotate-ccw').click(function() {
		rotateBase64ImageNeg90Degree(canvasPicSrc);
	});

	$('#flip-horizontal').click(function() {
		if ($(mainsketch).attr('flipped'))
			$(mainsketch).removeAttr('flipped');
		else $(mainsketch).attr('flipped','flipped');
	});

	$('#flip-vertical').click(function() {
		if ($(mainsketch).attr('flippedVert'))
			$(mainsketch).removeAttr('flippedVert');
		else $(mainsketch).attr('flippedVert','flippedVert');
	});

	$('#save-gdw').click(function() {
		socket.emit("onRequestArray", "penge pong array");
	});

	$("#toggleHistory").click(function() {
		if ($(".event-logs-container").hasClass('showHistory')) {
			$("#toggleHistory img").attr("src", "img/arrow-down.svg");
		} else {
			$("#toggleHistory img").attr("src", "img/arrow-up.svg");
		}
		$(".event-logs-container").toggleClass('showHistory');
	});

	function openFileGdw() {
		$('#tmp_canvas2').remove();
		$('#tmp_canvas').remove();
		const fs = require("fs");
		const {dialog} = require("electron").remote;
		dialog.showOpenDialog(function (fileNames) {
			if (fileNames === undefined) return;
  			var fileName = fileNames[0];
  			var stringFileName = String(fileName);
  			var splitPath = stringFileName.split("\\");

  			var newPath = "";
			for (var i = 0; i < splitPath.length; i++) {
				if (i == 0) {
					newPath = splitPath[i];
				} else {
					newPath += "/"+splitPath[i];
				}
			}

  			$('#canvas-name-active').html(splitPath[splitPath.length-1]);
  			/*$('#canvas-name-active').html("*Untitled");*/

  			// for reading / writing recent open file
  			fs.readFile('gizdraw.data', 'utf-8', function (err, data) {
				if (data == undefined) {
					var newList = new Object();
					newList = {
						'file1': {
							'file_name':splitPath[splitPath.length-1],
							'file_location':newPath
						},
					};

					var newListString = JSON.stringify(newList, null, 2);
					fs.writeFile('gizdraw.data', newListString, function (err) {
						console.log("from write only:" + newListString);
					});
				} else {
					var recentList = JSON.parse(data);
					var hasSame = false;
					for (i = 1; i <= Object.keys(recentList).length; i++) {
						if (newPath === String(recentList['file'+i]['file_location'])) {
							hasSame = true;
						}
					}

					if (hasSame == false) {
						recentList['file'+(Object.keys(recentList).length+1)] = {
							'file_name':splitPath[splitPath.length-1],
							'file_location':newPath
						};

						var newListString = JSON.stringify(recentList, null, 2);
						fs.writeFile('gizdraw.data', newListString, function (err) {
							console.log("from read to write:" + newListString);
						});
					}
				}
			});

  			var fileExtension = fileName.split(".");
  			if (fileExtension[1] == "gdw") {
  				gdwReader(fileName);
  			} else {
  				imageReader(fileName);
  			}
  		});
	}

	function imageReader(fileLocation){
		$('#tmp_canvas2').remove();
		$('#tmp_canvas').remove();
		var publicImage;
		fs.readFile(fileLocation, 'base64', function (err, data) {
			var image = "data:image/png;base64,"+data;
			$('#menu').css("display", "none");
			$('#file').css("display", "none");
			$('#setup-canvas-panel').addClass('hide');
			$('#main-sketch').css('display', "block");
			$('#sketchpad').css('display', "block");
			$('body').css("background-color", "#d2d2d2");

			tmp_canvas = document.createElement('canvas');
			tmp_ctx = tmp_canvas.getContext('2d');
			tmp_canvas.id = 'tmp_canvas2';
			
			$('#tmp_canvas2').css("position","absolute");
			$('#tmp_canvas2').css("top","0");
			canvasPic.src = image;
			canvasPic.onload = function (){
				canvas.width = canvasPic.width;
				canvas.height = canvasPic.height;
				tmp_canvas.width = canvasPic.width;
				tmp_canvas.height = canvasPic.height;
				$('#main-sketch').css('height', canvasPic.height);
				$('#main-sketch').css('width', canvasPic.width);
				mainsketch.appendChild(tmp_canvas);
				$('#tmp_canvas2').css("position","absolute");
				$('#tmp_canvas2').css("top","0");
				$('#main-sketch').css('background-color', "white");
	        	ctx.clearRect(0, 0, canvas.width, canvas.height);
	        	ctx.drawImage(canvasPic, 0, 0);
	        }

	       	var canvasDetails = {
				width: canvasPic.width,
				height: canvasPic.height,
				imageSource: image
			}

			socket.emit("sendImageToMobile", canvasDetails);
			createLevel = 'open';
			clearLogs();
			$('#template-image').removeAttr('src');
			onTemplate = false;
		});
	}

	function gdwReader(fileLocation) {
		fs.readFile(fileLocation, 'utf-8', function (err, data) {
			console.log(data);
			var convertedData = JSON.parse(data);
			$('#menu').css("display", "none");
			$('#file').css("display", "none");
			$('#setup-canvas-panel').addClass('hide');
			$('#main-sketch').css('display', "block");
			$('#sketchpad').css('display', "block");
			$('body').css("background-color", "#d2d2d2");

			tmp_canvas = document.createElement('canvas');
			tmp_ctx = tmp_canvas.getContext('2d');
			tmp_canvas.id = 'tmp_canvas2';
			
			var objectLength = String(Object.keys(convertedData).length);
			canvas.width = convertedData["width"];
			canvas.height = convertedData["height"];
			tmp_canvas.width = convertedData["width"];
			tmp_canvas.height = convertedData["height"];
			$('#main-sketch').css('height', convertedData["height"]);
			$('#main-sketch').css('width', convertedData["width"]);
			mainsketch.appendChild(tmp_canvas);
			$('#tmp_canvas2').css("position","absolute");
			$('#tmp_canvas2').css("top","0");
			canvasPic.src = convertedData[objectLength-4];
			$('#main-sketch').css('background-color', convertedData["bgColor"]);
			canvasPic.onload = function (){
	        	ctx.clearRect(0, 0, canvas.width, canvas.height);
	        	ctx.drawImage(canvasPic, 0, 0);
	        }

	        var canvasDetails = {
				canvasName: $("#canvasName").val(),
				canvasWidth: convertedData["width"],
				canvasHeight: convertedData["height"],
				canvasBackgroundColor: convertedData["bgColor"],
				canvasSrc: convertedData[objectLength-4],
				canvasArray: convertedData,
				canvasArrayLength: Object.keys(convertedData).length,
				state: "open"
			}

			socket.emit("createCanvas", canvasDetails);
			createLevel = 'open';
			clearLogs();
		});
	}

	$('.open').click(openFileGdw);

	$("#canvasOption2").change(function() {
		if ($(this).val() == "Custom") {
			$('#customSize2').css("display","none");
			$('.fixedSize2').css("display","table-row");
		} else {
			$('#customSize2').css("display","table-row");
			$('.fixedSize2').css("display","none");
		}
	});

	$("#changeBackground2").change(function() {
		if ($(this).val() == "Color") {
			$('#createCanvasTableModal tr td .custom-bg-color2').css('display', 'block');
			$("#createCanvasTableModal tr td button").css("margin-top", "-17px");
		} else {
			$('#createCanvasTableModal tr td .custom-bg-color2').css('display', 'none');
			$("#createCanvasTableModal tr td button").css("margin-top", "0");
		}
	});

	function clearLogs() {
		$(".event-logs-container ul").html(" ");
		$(".event-logs-container div").fadeIn("fast");
	}

	$("#showHelp").click(function() {
		$("#helpModal").css("display", "block");
	});

	$(document).on("click", ".event-logs-li", function(){
		canvasSendSrc = $(this).attr('data-base64');
		var cnvsW = $(this).attr('data-canvas-width');
		var cnvsH = $(this).attr('data-canvas-height');
		canvasPic.src = canvasSendSrc;
        canvasPic.onload = function () {
        	ctx.clearRect(0, 0, canvas.width, canvas.height);
        	ctx.drawImage(canvasPic, 0, 0);
        }
        logNum = $(this).attr('data-log-count');
        setCanvasSize(cnvsW, cnvsH);
        var loglistId = $(this).attr('id');
        if(isConnected){
        	socket.emit("canvasDetailsSend", {cnvsSrc:canvasSendSrc, cnvsW:cnvsW, cnvsH:cnvsH});
        	socket.emit("sendLogStep", $(this).attr('data-cStep'));
        }
        $('.events-log-li').css('opacity', '1');
        logcStep = parseInt($(this).attr('data-cStep'))+1;
        for (i = 0; i <= logCount; i++) {
        	$("li[data-log-count="+i+"]").css('opacity','1');
        }
        for (i = logNum; i <= logCount; i++){
        	$("li[data-log-count="+i+"]").css('opacity','0.5');
        }

	});
	
	var appendli = function(logdtls, logkeyid, cW, cH, cS){
		logCount++;
		$(".event-logs-container ul").append("<li class='event-logs-li' id='"+logkeyid+"' data-log-count='"+logCount+"' data-canvas-width='"+cW+"' data-canvas-height='"+cH+"' data-base64='"+cS+"'><img src='img/file-default-image.jpg'>"+logdtls+"</li>");
	    $(".event-logs-container div").fadeOut('fast');
	};

	var setCanvasSize = function(cW, cH){
		canvas.width = cW;
        canvas.height = cH;
        tmp_canvas.width = cW;
        tmp_canvas.height = cH;
        $('#main-sketch').css('height', cH);
		$('#main-sketch').css('width', cW);
		mainsketch.appendChild(tmp_canvas);
		$('#tmp_canvas').css("position","absolute");
		$('#tmp_canvas').css("top","0");
	};	
});