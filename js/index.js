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

	const fs = require("fs");
	const {dialog} = require("electron").remote;
	
	$('.open').click(function() {
		dialog.showOpenDialog(function (fileNames) {
			if (fileNames === undefined) return;
  			var fileName = fileNames[0];
  			var stringFileName = String(fileName);
  			var splitPath = stringFileName.split("\\");
  			$('#canvas-name-active').html(splitPath[splitPath.length-1]);
  			fs.readFile(fileName, 'utf-8', function (err, data) {
    			var convertedData = JSON.parse(data);
    			console.log(convertedData);
				$('#menu').css("display", "none");
				$('#file').css("display", "none");
				$('#setup-canvas-panel').addClass('hide');
				$('#main-sketch').css('display', "block");
				$('#sketchpad').css('display', "block");
				$('body').css("background-color", "#d2d2d2");
  			});
  		});
	});
})