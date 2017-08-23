$(document).ready(function(){

	$('#recent-panel').addClass('show');
	$('#setup-canvas-panel').addClass('hide');

	function changePanel(){
		$('.menu-item').removeClass('active');
		$('.panel').removeClass('show');
		$('.panel').addClass('hide');
	}

	//setCanvasColor

	$('#setCanvasColor').change(function(){
		var set = $(this).val();
		if (set == "Color") {
			$(this).after("<input id='colorpick' type='color'/>");
		} else {
			$('#colorpick').fadeOut('fast');
		}
	});

	//connect and disconnect show modal

	$('#connect-new').click(function(){
		$('#enterPin').css("display", "block");
	});

	$('#disconnect').click(function(){
		$('#enterPin').css("display", "block");
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

});