var server = require('http').createServer();
var io = require('socket.io')(server);

server.listen(3000);

console.log("Server is running...");

io.sockets.on('connection', function (socket) {
    console.log('socket connected:' + socket.id);

    /*socket.on("closeModal", function(data){
    	console.log(data);
    });*/

    socket.on("message", function(data){
    	console.log(data);
    	socket.emit("HelloPC", "hello pc");
    });

});