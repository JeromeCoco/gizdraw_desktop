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

})