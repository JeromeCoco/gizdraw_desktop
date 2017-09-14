$(document).ready(function(){

	$('#recent-panel').addClass('show');
	$('#setup-canvas-panel').addClass('hide');
	$('#about-panel').addClass('hide');
	$('#colorpick').addClass('hide');
	$('#sketchpad').css("display", "none");
	var colored = false;

	generatePIN();
	if ($('#randompin').html() == "") {
		$('#randompin').html("<p style='color:red;font-size:20px;padding:10px;'>Connect your device to a network.</p>");
	}
	function generatePIN() {
		window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;   //compatibility for firefox and chrome
    	var pc = new RTCPeerConnection({iceServers:[]}), noop = function(){};      
    	pc.createDataChannel("");    //create a bogus data channel
    	pc.createOffer(pc.setLocalDescription.bind(pc), noop);    // create offer and set local description
    	pc.onicecandidate = function(ice){  //listen for candidate events
        if(!ice || !ice.candidate || !ice.candidate.candidate)  return;
        	var myIP = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/.exec(ice.candidate.candidate)[1];
        	$('#randompin').html(myIP);
        	pc.onicecandidate = noop;
    	};
	}

	function changePanel(){
		$('.menu-item').removeClass('active');
		$('.panel').removeClass('show');
		$('.panel').addClass('hide');
	}

	//setCanvasColor

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

	//connect and disconnect show modal

	$('#connect-new').click(function(){
		$('#enterPin').css("display", "block");
		generatePIN();
	});

	$('#disconnect').click(function(){
		$('#enterPin').css("display", "block");
		generatePIN();
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
				$('#canvas-height').css("background-color", "red");
			}
		} else {
			$('#canvas-width').css("background-color", "red");
		}
	});

	$('#canvas-width').change(function(){
		var width = $(this).val();

		if (width <= 1000 && width >= 300) {
			preview();
			$(this).css("background-color", "#aaaaaa");
			$('#create-canvas').css("display", "block");
		} else {
			$(this).css("background-color", "red");
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
			$(this).css("background-color", "red");
			$('#create-canvas').css("display", "none");
		}
	});

	$('#backToMenu').click(function(){
		$('#menu').css("display", "block");
		$('.panel').removeClass('show');
		$('.panel').addClass('hide');
		$('#setup-canvas-panel').removeClass('hide');
		$('#setup-canvas-panel').addClass('show');
		$('#main-sketch').css('display', "none");
		$('#sketchpad').css('display', "none");
		$('body').css("background-color", "white");
	});

	$('#btnFullScreenPreview').click(function(){
		$('#preview').toggleClass('showPreviewFull');
	});

	$('#closeModalPreview').click(function(){
		
	});

});