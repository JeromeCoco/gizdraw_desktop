var server = require('http').createServer();
var io = require('socket.io')(server);

server.listen(3000);

console.log("Server is running...");

io.sockets.on('connection', function (socket) {
    console.log('socket connected:' + socket.id);

    socket.on("sender", function(data){
    	socket.broadcast.emit("sendtopc", data);
    })

    socket.on("createCanvas", function(data){
    	socket.broadcast.emit("createCanvasToMobile", data);
    });

    socket.on("sendActiveTool", function(data){
    	socket.broadcast.emit("sendActiveToolToPC", data);
    });

    socket.on("sendCoordinates", function(data){
    	socket.broadcast.emit("sendCoordinatesToPC", data);
    });

    socket.on("onTouchStart", function (data) {
        socket.broadcast.emit("onTouchStartToPC", data);
    });

    socket.on("onTouchEnd", function (data) {
        socket.broadcast.emit("onTouchEndToPC", data);
    });
});