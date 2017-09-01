/*enter pin modal*/
var enterPin = document.getElementById('enterPin');
var span = document.getElementsByClassName("close")[0];

window.onload = function() {
    enterPin.style.display = "block";
}

span.onclick = function() {
    enterPin.style.display = "none";
}

$(document).ready(function(){

	$('#create-canvas').click(function(){
		if ($('#canvasName').val() != "") {
			$('#menu').css("display", "none");
			$('#setup-canvas-panel').addClass('hide');
			$('#main-sketch').css('display', "block");
			$('#sketchpad').css('display', "block");
			$('#main-sketch').css('height', $('#canvas-height').val());
			$('#main-sketch').css('width', $('#canvas-width').val());
			if ($('#setCanvasColor').val() == "Color") {
				$('#main-sketch').css('background-color', $('#colorpick').val());
			} else {
				$('#main-sketch').css('background-color', "white");
			}
			$('body').css("background-color", "#d2d2d2");
			$('#canvasName').css('background-color',"#aaaaaa");
		} else {
			$('#canvasName').css('background-color',"red");
		}
	});

	const fs = require("fs");
	const {dialog} = require("electron").remote;

	$('#open-file').click(function(){
		dialog.showOpenDialog();
	});

	$('#openFileOnSketch').click(function(){
		dialog.showOpenDialog();
	});

})