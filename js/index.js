/*enter pin modal*/
var enterPin = document.getElementById('enterPin');
var span = document.getElementsByClassName("close")[0];

window.onload = function() {
    enterPin.style.display = "block";
}

span.onclick = function() {
    enterPin.style.display = "none";
}