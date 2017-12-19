$(document).ready(function() {
	var canvasOptions = document.getElementById('canvasOptions');
	var enterPin = document.getElementById('enterPin');
	enterPin.style.display = "block";

	$(".close").click(function() {
		enterPin.style.display = "none";
	});

	$('#create-canvas').click(function() {
		if ($('#canvasName').val() != "") {
			$('#canvas-name-active').html($('#canvasName').val());
			$('#menu').css("display", "none");
			$('#setup-canvas-panel').addClass('hide');
			$('#main-sketch').css('display', "block");
			$('#sketchpad').css('display', "block");
			if ($('#setCanvasColor').val() == "Color") {
				$('#main-sketch').css('background-color', $('#colorpick').val());
			} else {
				$('#main-sketch').css('background-color', "white");
			}
			$('body').css("background-color", "#d2d2d2");
			$('#canvasName').css('background-color',"#aaaaaa");
		} else {
			$('#canvasName').css('background-color',"#e44d2e");
		}
	});

	$('#create-canvas2').click(function() {
		if ($('#canvasName2').val() != "") {
			$('#canvas-name-active').html($('#canvasName2').val());
			$('#menu').css("display", "none");
			$('#setup-canvas-panel').addClass('hide');
			$('#main-sketch').css('display', "block");
			$('#sketchpad').css('display', "block");
			if ($('#changeBackground2').val() == "Color") {
				$('#main-sketch').css('background-color', $('.custom-bg-color2').val());
			} else {
				$('#main-sketch').css('background-color', "white");
			}
			$('body').css("background-color", "#d2d2d2");
		} else {
			$('#canvasName2').css('background-color',"#e44d2e");
		}
	});
})